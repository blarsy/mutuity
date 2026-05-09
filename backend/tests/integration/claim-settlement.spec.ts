import { TEST_BACKEND_URL, loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";
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

    const outsiderCookie = await loginWithGraphqlSessionCookie(outsider.identifier, outsider.password);

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

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

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

    const claimerACookie = await loginWithGraphqlSessionCookie(claimerA.identifier, claimerA.password);

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

    const claimerBCookie = await loginWithGraphqlSessionCookie(claimerB.identifier, claimerB.password);

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

  it("handles concurrent settlement attempts safely with a single settlement event and no duplicate ledger side-effects", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `settle-concurrent-creator-${stamp}@example.com`,
      displayName: "Concurrent Settlement Creator"
    });
    const claimerA = await seedDemoAccount({
      identifier: `settle-concurrent-a-${stamp}@example.com`,
      displayName: "Concurrent Claimer A"
    });
    const claimerB = await seedDemoAccount({
      identifier: `settle-concurrent-b-${stamp}@example.com`,
      displayName: "Concurrent Claimer B"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `US5 Concurrent Need ${stamp}`,
      proposedTopesAmount: 190,
      expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString()
    });

    const claimA = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimerA,
      message: "Concurrent candidate A"
    });
    const claimB = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimerB,
      message: "Concurrent candidate B"
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const settleMutation = (needClaimId: string, clientMutationId: string) => fetch(`${TEST_BACKEND_URL}/graphql`, {
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
            needClaimId,
            clientMutationId
          }
        }
      })
    });

    const [responseA, responseB] = await Promise.all([
      settleMutation(claimA.id, "settle-concurrent-a"),
      settleMutation(claimB.id, "settle-concurrent-b")
    ]);

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);

    const payloadA = (await responseA.json()) as {
      data?: { settleNeedClaim: { needClaim: { id: string; status: string } } };
      errors?: Array<{ message: string }>;
    };
    const payloadB = (await responseB.json()) as {
      data?: { settleNeedClaim: { needClaim: { id: string; status: string } } };
      errors?: Array<{ message: string }>;
    };

    const successful = [payloadA, payloadB].filter(payload => payload.errors == null);
    const failed = [payloadA, payloadB].filter(payload => payload.errors != null);

    expect(successful).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0]?.errors?.[0]?.message).toBe("Need claim is no longer open");

    const stateResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          query ConcurrentSettlementState($needId: UUID!) {
            allNeedClaims(condition: { needId: $needId }) {
              nodes {
                id
                status
              }
            }
            allNeedClaimSettlementEvents(condition: { needId: $needId }) {
              nodes {
                id
                needClaimId
                topesAmount
              }
            }
          }
        `,
        variables: {
          needId: need.id
        }
      })
    });

    expect(stateResponse.status).toBe(200);

    const statePayload = (await stateResponse.json()) as {
      data?: {
        allNeedClaims: {
          nodes: Array<{ id: string; status: string }>;
        };
        allNeedClaimSettlementEvents: {
          nodes: Array<{ id: string; needClaimId: string; topesAmount: number }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(statePayload.errors).toBeUndefined();

    const claims = statePayload.data?.allNeedClaims.nodes ?? [];
    expect(claims).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: claimA.id }),
        expect.objectContaining({ id: claimB.id })
      ])
    );

    const settledClaims = claims.filter(claim => claim.status === "SETTLED");
    const declinedClaims = claims.filter(claim => claim.status === "DECLINED");
    expect(settledClaims).toHaveLength(1);
    expect(declinedClaims).toHaveLength(1);

    const settledClaimId = settledClaims[0]?.id;
    const settlementEvents = statePayload.data?.allNeedClaimSettlementEvents.nodes ?? [];
    expect(settlementEvents).toHaveLength(1);
    expect(settlementEvents[0]).toMatchObject({
      needClaimId: settledClaimId,
      topesAmount: 190
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
            allTokenMovements(first: 100) {
              nodes {
                eventType
                amountDelta
                referenceId
              }
            }
          }
        `
      })
    });

    const claimerACookie = await loginWithGraphqlSessionCookie(claimerA.identifier, claimerA.password);
    const claimerALedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerACookie
      },
      body: JSON.stringify({
        query: `
          query ClaimerLedger {
            allTokenMovements(first: 100) {
              nodes {
                eventType
                amountDelta
                referenceId
              }
            }
          }
        `
      })
    });

    const claimerBCookie = await loginWithGraphqlSessionCookie(claimerB.identifier, claimerB.password);
    const claimerBLedgerResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: claimerBCookie
      },
      body: JSON.stringify({
        query: `
          query ClaimerLedger {
            allTokenMovements(first: 100) {
              nodes {
                eventType
                amountDelta
                referenceId
              }
            }
          }
        `,
      })
    });

    expect(creatorLedgerResponse.status).toBe(200);
    expect(claimerALedgerResponse.status).toBe(200);
    expect(claimerBLedgerResponse.status).toBe(200);

    const creatorLedgerPayload = (await creatorLedgerResponse.json()) as {
      data?: {
        allTokenMovements: {
          nodes: Array<{ eventType: string; amountDelta: number; referenceId: string | null }>;
        };
      };
      errors?: Array<{ message: string }>;
    };
    const claimerALedgerPayload = (await claimerALedgerResponse.json()) as {
      data?: {
        allTokenMovements: {
          nodes: Array<{ eventType: string; amountDelta: number; referenceId: string | null }>;
        };
      };
      errors?: Array<{ message: string }>;
    };
    const claimerBLedgerPayload = (await claimerBLedgerResponse.json()) as {
      data?: {
        allTokenMovements: {
          nodes: Array<{ eventType: string; amountDelta: number; referenceId: string | null }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(creatorLedgerPayload.errors).toBeUndefined();
    expect(claimerALedgerPayload.errors).toBeUndefined();
    expect(claimerBLedgerPayload.errors).toBeUndefined();

    const creatorSettlementDebits = (creatorLedgerPayload.data?.allTokenMovements.nodes ?? []).filter(
      movement => movement.eventType === "claim_settlement_debit" && movement.referenceId === settledClaimId
    );
    expect(creatorSettlementDebits).toHaveLength(1);
    expect(creatorSettlementDebits[0]?.amountDelta).toBe(-190);

    const totalCreditsByReference = [
      ...(claimerALedgerPayload.data?.allTokenMovements.nodes ?? []),
      ...(claimerBLedgerPayload.data?.allTokenMovements.nodes ?? [])
    ].filter(
      movement => movement.eventType === "claim_settlement_credit" && movement.referenceId === settledClaimId
    );
    expect(totalCreditsByReference).toHaveLength(1);
    expect(totalCreditsByReference[0]?.amountDelta).toBe(190);
  });
});
