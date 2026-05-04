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

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

describe("resource bid integration", () => {
  it("issues expiring-soon warnings and expires/refunds open bids when the resource deadline passes", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-worker-creator-${stamp}@example.com`,
      displayName: "Timed Resource Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resource-worker-bidder-${stamp}@example.com`,
      displayName: "Timed Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Timed resource ${stamp}`,
      defaultTokenAmount: 210,
      expiresAt: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      categoryCodes: [4]
    });

    const bidderCookie = await loginAs(bidder);
    const createBidResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "Please keep me posted before this expires."
          }
        }
      })
    });
    const createBidJson = await createBidResponse.json() as {
      data?: { submitResourceBid: { resourceBid: { id: string } } };
    };
    const bidId = createBidJson.data?.submitResourceBid.resourceBid.id;

    expect(createBidResponse.status).toBe(200);
    expect(bidId).toBeTruthy();

    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await processResourceBidNotificationsTask({ nowIso: new Date().toISOString() }, {} as never);
    await processResourceBidNotificationsTask({ nowIso: new Date().toISOString() }, {} as never);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const expiringSoonNotifications = await client.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.resource_bid_notification
          where recipient_account_id = $1
            and resource_bid_id = $2
            and event_type = 'resource_bid_expiring_soon'
        `,
        [creator.accountId, bidId]
      );

      expect(expiringSoonNotifications.rows[0]?.count).toBe("1");

      await client.query(
        `
          update app_public.resource
          set expires_at = now() - interval '5 minutes'
          where id = $1
        `,
        [resource.id]
      );
    } finally {
      await client.end();
    }

    await processResourceBidNotificationsTask({ nowIso: new Date().toISOString() }, {} as never);

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const bidStatus = await checkClient.query<{ status: string }>(
        "select status::text from app_public.resource_bid where id = $1",
        [bidId]
      );
      const expiredNotifications = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.resource_bid_notification
          where recipient_account_id = $1
            and resource_bid_id = $2
            and event_type = 'resource_bid_expired'
        `,
        [bidder.accountId, bidId]
      );
      const refundMovements = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'resource_bid_refunded'
            and reference_id = $2
            and payload ->> 'reason' = 'resource_expired'
        `,
        [bidder.accountId, bidId]
      );

      expect(bidStatus.rows[0]?.status).toBe("expired");
      expect(expiredNotifications.rows[0]?.count).toBe("1");
      expect(refundMovements.rows[0]?.count).toBe("1");
    } finally {
      await checkClient.end();
    }
  });

  it("allows an authenticated non-owner to bid on an active resource and reuses the default token amount", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-bid-creator-${stamp}@example.com`,
      displayName: "Resource Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resource-bid-bidder-${stamp}@example.com`,
      displayName: "Helpful Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Bid-ready resource ${stamp}`,
      defaultTokenAmount: 320,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [3]
    });

    const sessionCookie = await loginAs(bidder);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
                resourceId
                bidderAccountId
                message
                proposedTokenAmount
                status
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "I can pick this up tomorrow afternoon."
          }
        }
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        submitResourceBid: {
          resourceBid: {
            resourceId: resource.id,
            bidderAccountId: bidder.accountId,
            message: "I can pick this up tomorrow afternoon.",
            proposedTokenAmount: 320,
            status: "OPEN"
          }
        }
      }
    });

    const creatorCookie = await loginAs(creator);
    const notificationsResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query ResourceBidNotifications {
            allResourceBidNotifications(first: 20) {
              nodes {
                eventType
                payload
              }
            }
          }
        `
      })
    });

    expect(notificationsResponse.status).toBe(200);
    await expect(notificationsResponse.json()).resolves.toMatchObject({
      data: {
        allResourceBidNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "resource_bid_created",
              payload: expect.objectContaining({
                resourceId: resource.id,
                bidderAccountId: bidder.accountId,
                status: "open"
              })
            })
          ])
        }
      }
    });

    const bidderLedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          query BidderLedger {
            allTokenMovements(first: 20) {
              nodes {
                eventType
                amountDelta
                referenceType
                referenceId
              }
            }
          }
        `
      })
    });

    expect(bidderLedgerResponse.status).toBe(200);
    await expect(bidderLedgerResponse.json()).resolves.toMatchObject({
      data: {
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "resource_bid_reserved",
              amountDelta: -320,
              referenceType: "resource_bid"
            })
          ])
        }
      }
    });
  });

  it("allows proposed token amounts outside the resource intensity suggested range", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-bid-intensity-creator-${stamp}@example.com`,
      displayName: "Intensity Advisory Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resource-bid-intensity-bidder-${stamp}@example.com`,
      displayName: "Intensity Advisory Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Intensity advisory resource ${stamp}`,
      intensity: "leg_up",
      defaultTokenAmount: 20,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [3]
    });

    const sessionCookie = await loginAs(bidder);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
                resourceId
                bidderAccountId
                proposedTokenAmount
                status
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            proposedTokenAmount: 120,
            message: "I can help quickly."
          }
        }
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      data: {
        submitResourceBid: {
          resourceBid: {
            resourceId: resource.id,
            bidderAccountId: bidder.accountId,
            proposedTokenAmount: 120,
            status: "OPEN"
          }
        }
      }
    });
  });

  it("rejects new bids on expired resources", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-expired-creator-${stamp}@example.com`,
      displayName: "Expired Resource Creator"
    });
    const bidder = await seedDemoAccount({
      identifier: `resource-expired-bidder-${stamp}@example.com`,
      displayName: "Late Bidder"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Expired resource ${stamp}`,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString(),
      categoryCodes: [5]
    });

    const sessionCookie = await loginAs(bidder);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "Too late?"
          }
        }
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Resource has expired",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        }
      ]
    });
  });

  it("lets the resource creator accept or decline bids and notifies bidders", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-review-creator-${stamp}@example.com`,
      displayName: "Reviewing Creator"
    });
    const bidderA = await seedDemoAccount({
      identifier: `resource-review-biddera-${stamp}@example.com`,
      displayName: "Bidder A"
    });
    const bidderB = await seedDemoAccount({
      identifier: `resource-review-bidderb-${stamp}@example.com`,
      displayName: "Bidder B"
    });
    const outsider = await seedDemoAccount({
      identifier: `resource-review-outsider-${stamp}@example.com`,
      displayName: "Outsider"
    });
    const resource = await seedResource({
      creatorAccount: creator,
      title: `Review resource ${stamp}`,
      defaultTokenAmount: 480,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      categoryCodes: [7]
    });

    const bidderACookie = await loginAs(bidderA);
    const bidderAResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderACookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "I can help this evening.",
            proposedTokenAmount: 500
          }
        }
      })
    });
    const bidderAPayload = await bidderAResponse.json() as {
      data?: { submitResourceBid: { resourceBid: { id: string } } };
    };
    const bidAId = bidderAPayload.data?.submitResourceBid.resourceBid.id;

    const bidderBCookie = await loginAs(bidderB);
    const bidderBResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderBCookie
      },
      body: JSON.stringify({
        query: `
          mutation SubmitResourceBid($input: SubmitResourceBidInput!) {
            submitResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceId: resource.id,
            message: "I could bring it over tomorrow.",
            proposedTokenAmount: 450
          }
        }
      })
    });
    const bidderBPayload = await bidderBResponse.json() as {
      data?: { submitResourceBid: { resourceBid: { id: string } } };
    };
    const bidBId = bidderBPayload.data?.submitResourceBid.resourceBid.id;

    expect(bidAId).toBeTruthy();
    expect(bidBId).toBeTruthy();

    const outsiderCookie = await loginAs(outsider);
    const forbiddenResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: outsiderCookie
      },
      body: JSON.stringify({
        query: `
          mutation RespondToResourceBid($input: RespondToResourceBidInput!) {
            respondToResourceBid(input: $input) {
              resourceBid {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            resourceBidId: bidAId,
            status: "ACCEPTED"
          }
        }
      })
    });

    expect(forbiddenResponse.status).toBe(200);
    await expect(forbiddenResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Only the resource creator can respond to bids",
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ]
    });

    const creatorCookie = await loginAs(creator);
    const reviewResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation RespondToResourceBid($acceptedBidId: UUID!, $declinedBidId: UUID!) {
            accept: respondToResourceBid(input: { resourceBidId: $acceptedBidId, status: ACCEPTED }) {
              resourceBid {
                id
                status
                respondedByAccountId
              }
            }
            decline: respondToResourceBid(input: { resourceBidId: $declinedBidId, status: DECLINED }) {
              resourceBid {
                id
                status
                respondedByAccountId
              }
            }
          }
        `,
        variables: {
          acceptedBidId: bidAId,
          declinedBidId: bidBId
        }
      })
    });

    const reviewPayload = await reviewResponse.json() as {
      data?: {
        accept: { resourceBid: { id: string; status: string; respondedByAccountId: string } };
        decline: { resourceBid: { id: string; status: string; respondedByAccountId: string } };
      };
      errors?: Array<{ message: string }>;
    };

    expect(reviewResponse.status).toBe(200);
    expect(reviewPayload.errors).toBeUndefined();
    expect(reviewPayload.data?.accept.resourceBid).toMatchObject({
      id: bidAId,
      status: "ACCEPTED",
      respondedByAccountId: creator.accountId
    });
    expect(reviewPayload.data?.decline.resourceBid).toMatchObject({
      id: bidBId,
      status: "DECLINED",
      respondedByAccountId: creator.accountId
    });

    const bidderANotificationsResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderACookie
      },
      body: JSON.stringify({
        query: `
          query ResourceBidNotifications {
            allResourceBidNotifications(first: 20) {
              nodes {
                eventType
                payload
              }
            }
          }
        `
      })
    });

    expect(bidderANotificationsResponse.status).toBe(200);
    await expect(bidderANotificationsResponse.json()).resolves.toMatchObject({
      data: {
        allResourceBidNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "resource_bid_accepted",
              payload: expect.objectContaining({
                resourceId: resource.id
              })
            })
          ])
        }
      }
    });

    const bidderBLedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: bidderBCookie
      },
      body: JSON.stringify({
        query: `
          query DeclinedBidderLedger {
            allTokenMovements(first: 20) {
              nodes {
                eventType
                amountDelta
                referenceType
                referenceId
              }
            }
          }
        `
      })
    });

    expect(bidderBLedgerResponse.status).toBe(200);
    await expect(bidderBLedgerResponse.json()).resolves.toMatchObject({
      data: {
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "resource_bid_reserved",
              amountDelta: -450,
              referenceType: "resource_bid"
            }),
            expect.objectContaining({
              eventType: "resource_bid_refunded",
              amountDelta: 450,
              referenceType: "resource_bid"
            })
          ])
        }
      }
    });
  });
});