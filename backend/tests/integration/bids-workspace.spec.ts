import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function gqlRequest<T>(cookie: string, query: string, variables?: Record<string, unknown>) {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json() as GraphqlResponse<T>;

  expect(response.status).toBe(200);
  expect(json.errors).toBeUndefined();

  return json.data as T;
}

describe("bids workspace integration", () => {
  it("returns sent/received bids ordered by latest status-change time and filters active bids", async () => {
    const stamp = Date.now();
    const creatorOne = await seedDemoAccount({
      identifier: `workspace-creator-1-${stamp}@example.com`,
      displayName: "Workspace Creator One"
    });
    const creatorTwo = await seedDemoAccount({
      identifier: `workspace-creator-2-${stamp}@example.com`,
      displayName: "Workspace Creator Two"
    });
    const bidder = await seedDemoAccount({
      identifier: `workspace-bidder-${stamp}@example.com`,
      displayName: "Workspace Bidder"
    });

    const resourceOne = await seedResource({
      creatorAccount: creatorOne,
      title: `Workspace Resource One ${stamp}`,
      defaultTokenAmount: 100,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [4]
    });
    const resourceTwo = await seedResource({
      creatorAccount: creatorTwo,
      title: `Workspace Resource Two ${stamp}`,
      defaultTokenAmount: 130,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [4]
    });
    const resourceThree = await seedResource({
      creatorAccount: creatorOne,
      title: `Workspace Resource Three ${stamp}`,
      defaultTokenAmount: 160,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [4]
    });

    const bidderCookie = await loginAs(bidder);
    const creatorOneCookie = await loginAs(creatorOne);

    const submitBidMutation = `
      mutation SubmitBid($input: SubmitResourceBidInput!) {
        submitResourceBid(input: $input) {
          resourceBid {
            id
          }
        }
      }
    `;

    const bidOneData = await gqlRequest<{
      submitResourceBid: { resourceBid: { id: string } };
    }>(bidderCookie, submitBidMutation, {
      input: {
        resourceId: resourceOne.id,
        message: "Bid one"
      }
    });

    const bidTwoData = await gqlRequest<{
      submitResourceBid: { resourceBid: { id: string } };
    }>(bidderCookie, submitBidMutation, {
      input: {
        resourceId: resourceTwo.id,
        message: "Bid two"
      }
    });

    const bidThreeData = await gqlRequest<{
      submitResourceBid: { resourceBid: { id: string } };
    }>(bidderCookie, submitBidMutation, {
      input: {
        resourceId: resourceThree.id,
        message: "Bid three"
      }
    });

    const bidOneId = bidOneData.submitResourceBid.resourceBid.id;
    const bidTwoId = bidTwoData.submitResourceBid.resourceBid.id;
    const bidThreeId = bidThreeData.submitResourceBid.resourceBid.id;

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      // Touch bid three first so it is the oldest status-change in the final ordering.
      await client.query(
        `
          update app_public.resource_bid
          set message = coalesce(message, '')
          where id = $1
        `,
        [bidThreeId]
      );

      await client.query(
        `
          update app_public.resource_bid
          set status = 'declined'::app_public.resource_bid_status,
              responded_at = now(),
              responded_by_account_id = $2,
              updated_at = now()
          where id = $1
        `,
        [bidOneId, creatorOne.accountId]
      );
      await client.query(
        `
          update app_public.resource_bid
          set status = 'withdrawn'::app_public.resource_bid_status,
              responded_at = null,
              responded_by_account_id = null,
              updated_at = now()
          where id = $1
        `,
        [bidTwoId]
      );
    } finally {
      await client.end();
    }

    const sentAllData = await gqlRequest<{
      sentResourceBids: {
        nodes: Array<{ id: string; status: string; isActive: boolean }>;
      };
    }>(
      bidderCookie,
      `
        query SentResourceBids($activeOnly: Boolean) {
          sentResourceBids(first: 20, activeOnly: $activeOnly) {
            nodes {
              id
              status
              isActive
            }
          }
        }
      `,
      { activeOnly: false }
    );

    expect(sentAllData.sentResourceBids.nodes.map(node => node.id)).toEqual([
      bidTwoId,
      bidOneId,
      bidThreeId
    ]);
    expect(sentAllData.sentResourceBids.nodes.map(node => node.status)).toEqual([
      "WITHDRAWN",
      "DECLINED",
      "OPEN"
    ]);

    const sentActiveOnlyData = await gqlRequest<{
      sentResourceBids: {
        nodes: Array<{ id: string; status: string; isActive: boolean }>;
      };
    }>(
      bidderCookie,
      `
        query SentResourceBids($activeOnly: Boolean) {
          sentResourceBids(first: 20, activeOnly: $activeOnly) {
            nodes {
              id
              status
              isActive
            }
          }
        }
      `,
      { activeOnly: true }
    );

    expect(sentActiveOnlyData.sentResourceBids.nodes).toEqual([
      expect.objectContaining({ id: bidThreeId, status: "OPEN", isActive: true })
    ]);

    const receivedAllData = await gqlRequest<{
      receivedResourceBids: {
        nodes: Array<{ id: string; status: string; isActive: boolean }>;
      };
    }>(
      creatorOneCookie,
      `
        query ReceivedResourceBids($activeOnly: Boolean) {
          receivedResourceBids(first: 20, activeOnly: $activeOnly) {
            nodes {
              id
              status
              isActive
            }
          }
        }
      `,
      { activeOnly: false }
    );

    expect(receivedAllData.receivedResourceBids.nodes.map(node => node.id)).toEqual([
      bidOneId,
      bidThreeId
    ]);
    expect(receivedAllData.receivedResourceBids.nodes.map(node => node.status)).toEqual([
      "DECLINED",
      "OPEN"
    ]);

    const receivedActiveOnlyData = await gqlRequest<{
      receivedResourceBids: {
        nodes: Array<{ id: string; status: string; isActive: boolean }>;
      };
    }>(
      creatorOneCookie,
      `
        query ReceivedResourceBids($activeOnly: Boolean) {
          receivedResourceBids(first: 20, activeOnly: $activeOnly) {
            nodes {
              id
              status
              isActive
            }
          }
        }
      `,
      { activeOnly: true }
    );

    expect(receivedActiveOnlyData.receivedResourceBids.nodes).toEqual([
      expect.objectContaining({ id: bidThreeId, status: "OPEN", isActive: true })
    ]);
  });
});
