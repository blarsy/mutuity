import {
  TEST_BACKEND_URL,
  getSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedResource } from "./resource-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  const response = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      identifier: account.identifier,
      password: account.password
    })
  });

  expect(response.status).toBe(200);

  return getSessionCookie(response);
}

describe("resource bid integration", () => {
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
  });
});