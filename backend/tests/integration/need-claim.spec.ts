import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";

jest.setTimeout(30000);

describe("need claim integration", () => {
  it("persists authenticated claims, creates a creator notification, and denies signed-out attempts", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `creator-${stamp}@example.com`,
      displayName: "Need Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `claimer-${stamp}@example.com`,
      displayName: "Helpful Claimer"
    });
    const need = await seedNeed({
      creatorAccount: creator,
      title: `US3 Claim ${stamp}`,
      description: "Claimable need for integration coverage",
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    });

    const anonymousResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation ClaimNeed($input: ClaimNeedInput!) {
            claimNeed(input: $input) {
              needClaim {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            needId: need.id,
            message: "I can help right away."
          }
        }
      })
    });

    expect(anonymousResponse.status).toBe(200);
    await expect(anonymousResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "You must sign in to continue.",
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ]
    });

    const loginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifier: claimer.identifier,
        password: claimer.password
      })
    });
    const claimerCookie = getSessionCookie(loginResponse);

    const claimResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerCookie
      },
      body: JSON.stringify({
        query: `
          mutation ClaimNeed($input: ClaimNeedInput!) {
            claimNeed(input: $input) {
              needClaim {
                id
                needId
                claimerAccountId
                message
                status
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: {
          input: {
            needId: need.id,
            message: "I can help right away."
          }
        }
      })
    });

    expect(claimResponse.status).toBe(200);
    const claimPayload = (await claimResponse.json()) as {
      data?: {
        claimNeed: {
          needClaim: {
            id: string;
            needId: string;
            claimerAccountId: string;
            message: string;
            status: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(claimPayload.errors).toBeUndefined();
    expect(claimPayload.data?.claimNeed.needClaim).toMatchObject({
      needId: need.id,
      claimerAccountId: claimer.accountId,
      message: "I can help right away.",
      status: "OPEN"
    });

    const creatorLoginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifier: creator.identifier,
        password: creator.password
      })
    });
    const creatorCookie = getSessionCookie(creatorLoginResponse);

    const notificationResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query ClaimNotifications {
            allNeedClaimNotifications(first: 20) {
              nodes {
                id
                needClaimId
                eventType
                payload
                readAt
              }
            }
          }
        `
      })
    });

    expect(notificationResponse.status).toBe(200);
    const notificationPayload = (await notificationResponse.json()) as {
      data?: {
        allNeedClaimNotifications: {
          nodes: Array<{
            needClaimId: string;
            eventType: string;
            payload: {
              needId: string;
              claimerAccountId: string;
              status: string;
            };
            readAt: string | null;
          }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(notificationPayload.errors).toBeUndefined();
    expect(notificationPayload.data?.allNeedClaimNotifications.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          needClaimId: claimPayload.data?.claimNeed.needClaim.id,
          eventType: "claim_created",
          payload: expect.objectContaining({
            needId: need.id,
            claimerAccountId: claimer.accountId,
            status: "open"
          }),
          readAt: null
        })
      ])
    );
  });
});
