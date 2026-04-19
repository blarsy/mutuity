import {
  TEST_BACKEND_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "../integration/auth-test-helpers";
import { seedNeed, seedNeedClaim } from "../integration/need-test-helpers";

jest.setTimeout(30000);

describe("claim settlement contract", () => {
  it("exposes the creator-only settlement mutation and resulting settlement state", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `contract-settle-creator-${stamp}@example.com`,
      displayName: "Contract Settlement Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `contract-settle-claimer-${stamp}@example.com`,
      displayName: "Contract Settlement Claimer"
    });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `US5 Contract ${stamp}`,
      proposedTopesAmount: 180,
      expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "Please choose me for this need."
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const mutationResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: creatorCookie
      },
      body: JSON.stringify({
        query: `
          mutation SettleNeedClaim($input: SettleNeedClaimInput!) {
            settleNeedClaim(input: $input) {
              clientMutationId
              needClaim {
                id
                needId
                claimerAccountId
                status
                settledAt
                settledByAccountId
                needClaimSettlementEventByNeedClaimId {
                  id
                  needClaimId
                  needId
                  claimerAccountId
                  settledByAccountId
                  topesAmount
                }
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
            needClaimId: claim.id,
            clientMutationId: "claim-settlement-contract"
          }
        }
      })
    });

    expect(mutationResponse.status).toBe(200);
    await expect(mutationResponse.json()).resolves.toMatchObject({
      data: {
        settleNeedClaim: {
          clientMutationId: "claim-settlement-contract",
          needClaim: {
            id: claim.id,
            needId: need.id,
            claimerAccountId: claimer.accountId,
            status: "SETTLED",
            settledByAccountId: creator.accountId,
            needClaimSettlementEventByNeedClaimId: {
              needClaimId: claim.id,
              needId: need.id,
              claimerAccountId: claimer.accountId,
              settledByAccountId: creator.accountId,
              topesAmount: 180
            }
          },
          needByNeedId: {
            id: need.id,
            title: `US5 Contract ${stamp}`
          },
          accountByClaimerAccountId: {
            id: claimer.accountId,
            displayName: claimer.displayName
          }
        }
      }
    });
  });
});
