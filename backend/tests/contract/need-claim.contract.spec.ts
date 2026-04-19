import {
  TEST_BACKEND_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "../integration/auth-test-helpers";
import { seedNeed } from "../integration/need-test-helpers";

jest.setTimeout(30000);

describe("need claim contract", () => {
  it("exposes the claim mutation payload and notification shape through GraphQL", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `contract-creator-${stamp}@example.com`,
      displayName: "Contract Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `contract-claimer-${stamp}@example.com`,
      displayName: "Contract Claimer"
    });
    const need = await seedNeed({
      creatorAccount: creator,
      title: `US3 Contract ${stamp}`,
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString()
    });

    const claimerCookie = await loginWithGraphqlSessionCookie(claimer.identifier, claimer.password);

    const mutationResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerCookie
      },
      body: JSON.stringify({
        query: `
          mutation ClaimNeed($input: ClaimNeedInput!) {
            claimNeed(input: $input) {
              clientMutationId
              needClaim {
                id
                needId
                claimerAccountId
                message
                status
                createdAt
                updatedAt
              }
              needByNeedId {
                id
                title
              }
              accountByClaimerAccountId {
                id
                displayName
              }
            }
          }
        `,
        variables: {
          input: {
            needId: need.id,
            message: "Contract flow message",
            clientMutationId: "claim-need-contract"
          }
        }
      })
    });

    expect(mutationResponse.status).toBe(200);
    await expect(mutationResponse.json()).resolves.toMatchObject({
      data: {
        claimNeed: {
          clientMutationId: "claim-need-contract",
          needClaim: {
            needId: need.id,
            claimerAccountId: claimer.accountId,
            message: "Contract flow message",
            status: "OPEN"
          },
          needByNeedId: {
            id: need.id,
            title: `US3 Contract ${stamp}`
          },
          accountByClaimerAccountId: {
            id: claimer.accountId,
            displayName: claimer.displayName
          }
        }
      }
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const notificationResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query ClaimNotifications {
            allNeedClaimNotifications(first: 10) {
              nodes {
                needClaimId
                eventType
                payload
                createdAt
                readAt
              }
            }
          }
        `
      })
    });

    expect(notificationResponse.status).toBe(200);
    await expect(notificationResponse.json()).resolves.toMatchObject({
      data: {
        allNeedClaimNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "claim_created",
              payload: expect.objectContaining({
                needId: need.id,
                claimerAccountId: claimer.accountId,
                status: "open"
              }),
              readAt: null
            })
          ])
        }
      }
    });
  });
});
