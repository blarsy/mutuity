import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";

jest.setTimeout(30000);

describe("claim settlement integration", () => {
  it("settles one claim atomically, closes siblings, records the Topes event, and stays idempotent", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settle-creator-${stamp}@example.com`,
      displayName: "Settlement Creator"
    });
    const claimerA = await seedDemoAccount({
      identifier: `settle-a-${stamp}@example.com`,
      displayName: "First Claimer"
    });
    const claimerB = await seedDemoAccount({
      identifier: `settle-b-${stamp}@example.com`,
      displayName: "Second Claimer"
    });
    const outsider = await seedDemoAccount({
      identifier: `settle-outsider-${stamp}@example.com`,
      displayName: "Outsider"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `US5 Need ${stamp}`,
      proposedTopesAmount: 275,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });

    const winningClaim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimerA,
      message: "I can take this on today."
    });
    const siblingClaim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimerB,
      message: "I am also available."
    });

    const outsiderLoginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: outsider.identifier, password: outsider.password })
    });
    const outsiderCookie = getSessionCookie(outsiderLoginResponse);

    const forbiddenResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: outsiderCookie
      },
      body: JSON.stringify({
        query: `
          mutation SettleNeedClaim($input: SettleNeedClaimInput!) {
            settleNeedClaim(input: $input) {
              needClaim {
                id
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: winningClaim.id
          }
        }
      })
    });

    expect(forbiddenResponse.status).toBe(200);
    await expect(forbiddenResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Only need creator can settle claims",
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ]
    });

    const creatorLoginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: creator.identifier, password: creator.password })
    });
    const creatorCookie = getSessionCookie(creatorLoginResponse);

    const settleResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation SettleNeedClaim($input: SettleNeedClaimInput!) {
            settleNeedClaim(input: $input) {
              needClaim {
                id
                needId
                status
                settledAt
                settledByAccountId
                needClaimSettlementEventByNeedClaimId {
                  id
                  topesAmount
                  settledByAccountId
                }
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: winningClaim.id,
            clientMutationId: "settle-claim"
          }
        }
      })
    });

    expect(settleResponse.status).toBe(200);
    const settlePayload = (await settleResponse.json()) as {
      data?: {
        settleNeedClaim: {
          needClaim: {
            id: string;
            status: string;
            settledAt: string | null;
            settledByAccountId: string | null;
            needClaimSettlementEventByNeedClaimId: {
              id: string;
              topesAmount: number;
              settledByAccountId: string;
            } | null;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(settlePayload.errors).toBeUndefined();
    expect(settlePayload.data?.settleNeedClaim.needClaim).toMatchObject({
      id: winningClaim.id,
      status: "SETTLED",
      settledByAccountId: creator.accountId,
      needClaimSettlementEventByNeedClaimId: {
        topesAmount: 275,
        settledByAccountId: creator.accountId
      }
    });
    expect(settlePayload.data?.settleNeedClaim.needClaim.settledAt).toBeTruthy();

    const claimsResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query NeedClaims($needId: UUID!, $winningClaimId: UUID!) {
            allNeedClaims(condition: { needId: $needId }) {
              nodes {
                id
                status
                settledAt
                claimerAccountId
              }
            }
            allNeedClaimSettlementEvents(condition: { needClaimId: $winningClaimId }) {
              nodes {
                id
                topesAmount
              }
            }
          }
        `,
        variables: {
          needId: need.id,
          winningClaimId: winningClaim.id
        }
      })
    });

    expect(claimsResponse.status).toBe(200);
    const claimsPayload = (await claimsResponse.json()) as {
      data?: {
        allNeedClaims: {
          nodes: Array<{
            id: string;
            status: string;
            settledAt: string | null;
            claimerAccountId: string;
          }>;
        };
        allNeedClaimSettlementEvents: {
          nodes: Array<{ id: string; topesAmount: number }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(claimsPayload.errors).toBeUndefined();
    expect(claimsPayload.data?.allNeedClaims.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: winningClaim.id,
          status: "SETTLED",
          claimerAccountId: claimerA.accountId
        }),
        expect.objectContaining({
          id: siblingClaim.id,
          status: "DECLINED",
          claimerAccountId: claimerB.accountId
        })
      ])
    );
    expect(claimsPayload.data?.allNeedClaimSettlementEvents.nodes).toHaveLength(1);
    expect(claimsPayload.data?.allNeedClaimSettlementEvents.nodes[0]).toMatchObject({
      topesAmount: 275
    });

    const settleAgainResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation SettleNeedClaim($input: SettleNeedClaimInput!) {
            settleNeedClaim(input: $input) {
              needClaim {
                id
                status
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: winningClaim.id
          }
        }
      })
    });

    expect(settleAgainResponse.status).toBe(200);
    await expect(settleAgainResponse.json()).resolves.toMatchObject({
      data: {
        settleNeedClaim: {
          needClaim: {
            id: winningClaim.id,
            status: "SETTLED"
          }
        }
      }
    });

    const settledMessageResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation SendClaimMessage($input: SendClaimMessageInput!) {
            sendClaimMessage(input: $input) {
              claimMessage {
                id
                body
              }
            }
          }
        `,
        variables: {
          input: {
            needClaimId: winningClaim.id,
            body: "Thanks again — let's coordinate the handoff details."
          }
        }
      })
    });

    expect(settledMessageResponse.status).toBe(200);
    await expect(settledMessageResponse.json()).resolves.toMatchObject({
      data: {
        sendClaimMessage: {
          claimMessage: {
            body: "Thanks again — let's coordinate the handoff details."
          }
        }
      }
    });

    const claimerALoginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: claimerA.identifier, password: claimerA.password })
    });
    const claimerACookie = getSessionCookie(claimerALoginResponse);

    const claimerAResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerACookie
      },
      body: JSON.stringify({
        query: `
          query MyNotifications {
            allNeedClaimNotifications(first: 20) {
              nodes {
                eventType
                needClaimId
                payload
              }
            }
          }
        `
      })
    });

    expect(claimerAResponse.status).toBe(200);
    await expect(claimerAResponse.json()).resolves.toMatchObject({
      data: {
        allNeedClaimNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "claim_settled",
              needClaimId: winningClaim.id,
              payload: expect.objectContaining({
                needId: need.id,
                topesAmount: 275
              })
            })
          ])
        }
      }
    });

    const claimerALedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerACookie
      },
      body: JSON.stringify({
        query: `
          query ClaimerLedger {
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

    expect(claimerALedgerResponse.status).toBe(200);
    await expect(claimerALedgerResponse.json()).resolves.toMatchObject({
      data: {
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "claim_settlement_credit",
              amountDelta: 275,
              referenceType: "need_claim"
            })
          ])
        }
      }
    });

    const creatorLedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query CreatorLedger {
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

    expect(creatorLedgerResponse.status).toBe(200);
    await expect(creatorLedgerResponse.json()).resolves.toMatchObject({
      data: {
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "claim_settlement_debit",
              amountDelta: -275,
              referenceType: "need_claim"
            })
          ])
        }
      }
    });

    const claimerBLoginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: claimerB.identifier, password: claimerB.password })
    });
    const claimerBCookie = getSessionCookie(claimerBLoginResponse);

    const claimerBResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerBCookie
      },
      body: JSON.stringify({
        query: `
          query MyNotifications {
            allNeedClaimNotifications(first: 20) {
              nodes {
                eventType
                needClaimId
                payload
              }
            }
          }
        `
      })
    });

    expect(claimerBResponse.status).toBe(200);
    await expect(claimerBResponse.json()).resolves.toMatchObject({
      data: {
        allNeedClaimNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "claim_declined",
              needClaimId: siblingClaim.id,
              payload: expect.objectContaining({
                needId: need.id,
                settledClaimId: winningClaim.id
              })
            })
          ])
        }
      }
    });
  });
});
