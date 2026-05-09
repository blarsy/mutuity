import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { processResourceBidNotificationsTask } from "../../src/worker/tasks/process-resource-bid-notifications";

jest.setTimeout(30000);

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

type TokenMovementNode = {
  eventType: string;
  amountDelta: number;
  referenceType: string;
  referenceId: string;
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

async function submitBid(cookie: string, resourceId: string, proposedTokenAmount: number, message: string) {
  const data = await gqlRequest<{
    submitResourceBid: { resourceBid: { id: string } };
  }>(
    cookie,
    `
      mutation SubmitBid($input: SubmitResourceBidInput!) {
        submitResourceBid(input: $input) {
          resourceBid {
            id
          }
        }
      }
    `,
    {
      input: {
        resourceId,
        proposedTokenAmount,
        message
      }
    }
  );

  return data.submitResourceBid.resourceBid.id;
}

async function cancelBid(cookie: string, bidId: string) {
  await gqlRequest(
    cookie,
    `
      mutation CancelBid($input: CancelResourceBidInput!) {
        cancelResourceBid(input: $input) {
          resourceBid {
            id
            status
          }
        }
      }
    `,
    {
      input: {
        resourceBidId: bidId
      }
    }
  );
}

async function respondToBid(cookie: string, bidId: string, status: "ACCEPTED" | "DECLINED") {
  await gqlRequest(
    cookie,
    `
      mutation RespondBid($input: RespondToResourceBidInput!) {
        respondToResourceBid(input: $input) {
          resourceBid {
            id
            status
          }
        }
      }
    `,
    {
      input: {
        resourceBidId: bidId,
        status
      }
    }
  );
}

async function tokenMovementsFor(cookie: string, referenceId: string) {
  const data = await gqlRequest<{
    allTokenMovements: { nodes: TokenMovementNode[] };
  }>(
    cookie,
    `
      query TokenMovements {
        allTokenMovements(first: 100) {
          nodes {
            eventType
            amountDelta
            referenceType
            referenceId
          }
        }
      }
    `
  );

  return data.allTokenMovements.nodes.filter(node => node.referenceId === referenceId);
}

async function bidStatus(cookie: string, bidId: string) {
  const data = await gqlRequest<{
    resourceBidById: { status: string } | null;
  }>(
    cookie,
    `
      query BidById($id: UUID!) {
        resourceBidById(id: $id) {
          status
        }
      }
    `,
    { id: bidId }
  );

  return data.resourceBidById?.status ?? null;
}

describe("bid settlement integration", () => {
  it("records reservation and bidder-cancel refund movements", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settlement-cancel-creator-${stamp}@example.com`,
      displayName: "Settlement Cancel Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `settlement-cancel-bidder-${stamp}@example.com`,
      displayName: "Settlement Cancel Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Settlement cancel resource ${stamp}`,
      defaultTokenAmount: 210,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [4]
    });

    const bidderCookie = await loginAs(bidder);

    const bidId = await submitBid(
      bidderCookie,
      resource.id,
      210,
      "I can help with this resource and may cancel if plans change."
    );

    await cancelBid(bidderCookie, bidId);

    await expect(bidStatus(bidderCookie, bidId)).resolves.toBe("WITHDRAWN");

    const movements = await tokenMovementsFor(bidderCookie, bidId);

    expect(movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_reserved", amountDelta: -210, referenceType: "resource_bid" }),
        expect.objectContaining({ eventType: "resource_bid_refunded", amountDelta: 210, referenceType: "resource_bid" })
      ])
    );
  });

  it("refunds reserved Topes when the resource creator declines a bid", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settlement-decline-creator-${stamp}@example.com`,
      displayName: "Settlement Decline Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `settlement-decline-bidder-${stamp}@example.com`,
      displayName: "Settlement Decline Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Settlement decline resource ${stamp}`,
      defaultTokenAmount: 175,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [5]
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitBid(bidderCookie, resource.id, 175, "Decline flow test bid");

    await respondToBid(creatorCookie, bidId, "DECLINED");

    await expect(bidStatus(bidderCookie, bidId)).resolves.toBe("DECLINED");

    const bidderMovements = await tokenMovementsFor(bidderCookie, bidId);

    expect(bidderMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_reserved", amountDelta: -175, referenceType: "resource_bid" }),
        expect.objectContaining({ eventType: "resource_bid_refunded", amountDelta: 175, referenceType: "resource_bid" })
      ])
    );
  });

  it("settles reserved Topes to the resource creator when a bid is accepted", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settlement-accept-creator-${stamp}@example.com`,
      displayName: "Settlement Accept Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `settlement-accept-bidder-${stamp}@example.com`,
      displayName: "Settlement Accept Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Settlement accept resource ${stamp}`,
      defaultTokenAmount: 260,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [6]
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitBid(bidderCookie, resource.id, 260, "Accept flow test bid");

    await respondToBid(creatorCookie, bidId, "ACCEPTED");

    await expect(bidStatus(creatorCookie, bidId)).resolves.toBe("ACCEPTED");

    const bidderMovements = await tokenMovementsFor(bidderCookie, bidId);
    const creatorMovements = await tokenMovementsFor(creatorCookie, bidId);

    expect(bidderMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_reserved", amountDelta: -260, referenceType: "resource_bid" })
      ])
    );

    expect(bidderMovements).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_refunded", referenceType: "resource_bid" })
      ])
    );

    expect(creatorMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_settled", amountDelta: 260, referenceType: "resource_bid" })
      ])
    );
  });

  it("keeps acceptance idempotent under concurrent retries without duplicate settlement movements", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settlement-concurrent-accept-creator-${stamp}@example.com`,
      displayName: "Settlement Concurrent Accept Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `settlement-concurrent-accept-bidder-${stamp}@example.com`,
      displayName: "Settlement Concurrent Accept Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Settlement concurrent accept resource ${stamp}`,
      defaultTokenAmount: 205,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [10]
    });

    const bidderCookie = await loginAs(bidder);
    const creatorCookie = await loginAs(creator);

    const bidId = await submitBid(bidderCookie, resource.id, 205, "Concurrent accept retry coverage bid");

    await Promise.all([
      respondToBid(creatorCookie, bidId, "ACCEPTED"),
      respondToBid(creatorCookie, bidId, "ACCEPTED")
    ]);

    await expect(bidStatus(creatorCookie, bidId)).resolves.toBe("ACCEPTED");

    const bidderMovements = await tokenMovementsFor(bidderCookie, bidId);
    const creatorMovements = await tokenMovementsFor(creatorCookie, bidId);

    const bidderReservations = bidderMovements.filter(movement => movement.eventType === "resource_bid_reserved");
    const bidderRefunds = bidderMovements.filter(movement => movement.eventType === "resource_bid_refunded");
    const creatorSettlements = creatorMovements.filter(movement => movement.eventType === "resource_bid_settled");

    expect(bidderReservations).toHaveLength(1);
    expect(bidderReservations[0]?.amountDelta).toBe(-205);
    expect(bidderRefunds).toHaveLength(0);

    expect(creatorSettlements).toHaveLength(1);
    expect(creatorSettlements[0]?.amountDelta).toBe(205);

    // A subsequent retry should stay idempotent and keep settlement side-effects single.
    await respondToBid(creatorCookie, bidId, "ACCEPTED");

    const creatorMovementsAfterRetry = await tokenMovementsFor(creatorCookie, bidId);
    const creatorSettlementsAfterRetry = creatorMovementsAfterRetry.filter(
      movement => movement.eventType === "resource_bid_settled"
    );
    expect(creatorSettlementsAfterRetry).toHaveLength(1);
  });

  it("refunds reserved Topes when bid validity expires", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settlement-expire-creator-${stamp}@example.com`,
      displayName: "Settlement Expire Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `settlement-expire-bidder-${stamp}@example.com`,
      displayName: "Settlement Expire Bidder"
    });

    const resource = await seedResource({
      creatorAccount: creator,
      title: `Settlement expire resource ${stamp}`,
      defaultTokenAmount: 145,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [8]
    });

    const bidderCookie = await loginAs(bidder);

    const bidId = await submitBid(bidderCookie, resource.id, 145, "Validity expiry test bid");

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(
        `
          update app_public.resource_bid
          set valid_until = now() - interval '1 minute'
          where id = $1
        `,
        [bidId]
      );
    } finally {
      await client.end();
    }

    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await processResourceBidNotificationsTask({ nowIso: new Date().toISOString() }, {} as never);

    await expect(bidStatus(bidderCookie, bidId)).resolves.toBe("EXPIRED");

    const bidderMovements = await tokenMovementsFor(bidderCookie, bidId);

    expect(bidderMovements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ eventType: "resource_bid_reserved", amountDelta: -145, referenceType: "resource_bid" }),
        expect.objectContaining({ eventType: "resource_bid_refunded", amountDelta: 145, referenceType: "resource_bid" })
      ])
    );
  });
});
