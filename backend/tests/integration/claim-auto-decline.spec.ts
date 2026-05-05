import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";

jest.setTimeout(30000);

type GraphqlResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function gqlOk<T>(
  cookie: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie
    },
    body: JSON.stringify({ query, variables })
  });
  expect(response.status).toBe(200);
  const json = (await response.json()) as GraphqlResponse<T>;
  expect(json.errors).toBeUndefined();
  return json.data as T;
}

/** Directly invoke the expire-overdue-needs-and-claims SQL function */
async function runExpireWorker(): Promise<{ expired_need_count: number; expired_claim_count: number }> {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();
  try {
    const result = await client.query<{
      expired_need_count: number;
      expired_claim_count: number;
    }>("SELECT * FROM app_private.expire_overdue_needs_and_claims();");
    return result.rows[0] ?? { expired_need_count: 0, expired_claim_count: 0 };
  } finally {
    await client.end();
  }
}

const NEED_CLAIMS_FOR_NEED_QUERY = `
  query NeedClaimsByNeed($needId: UUID!) {
    allNeedClaims(condition: { needId: $needId }) {
      nodes {
        id
        status
      }
    }
  }
`;

const MY_NOTIFICATIONS_QUERY = `
  query ClaimNotifs {
    allNeedClaimNotifications(first: 50) {
      nodes {
        eventType
        needClaimId
      }
    }
  }
`;

describe("claim-auto-decline: need expiry via worker", () => {
  it("open claims are auto-declined when the need expires, claimer receives claim_expired notification", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `exp-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `exp-claimer-${stamp}@example.com` });

    // Seed a need with an expiry already in the past
    const need = await seedNeed({
      creatorAccount: creator,
      title: `Expiry test ${stamp}`,
      proposedTopesAmount: 0,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString() // 1 minute ago
    });

    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    // Verify claim starts as OPEN
    const creatorCookie = await loginAs(creator);
    const before = await gqlOk<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(creatorCookie, NEED_CLAIMS_FOR_NEED_QUERY, { needId: need.id });
    expect(before.allNeedClaims.nodes.find(c => c.id === claim.id)?.status).toBe("OPEN");

    // Run the expiry worker
    await runExpireWorker();

    // Claim should now be EXPIRED (expiry path sets status=EXPIRED)
    const after = await gqlOk<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(creatorCookie, NEED_CLAIMS_FOR_NEED_QUERY, { needId: need.id });
    expect(after.allNeedClaims.nodes.find(c => c.id === claim.id)?.status).toBe("EXPIRED");

    // Claimer receives claim_expired notification
    const claimerCookie = await loginAs(claimer);
    const notifs = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string }> };
    }>(claimerCookie, MY_NOTIFICATIONS_QUERY);

    expect(
      notifs.allNeedClaimNotifications.nodes.some(
        n => n.needClaimId === claim.id && n.eventType === "claim_expired"
      )
    ).toBe(true);
  });

  it("creator receives a batch need_expired_claims_declined notification", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `expbatch-creator-${stamp}@example.com` });
    const claimerA = await seedDemoAccount({ identifier: `expbatch-a-${stamp}@example.com` });
    const claimerB = await seedDemoAccount({ identifier: `expbatch-b-${stamp}@example.com` });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Batch expiry ${stamp}`,
      proposedTopesAmount: 0,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString()
    });

    const claimA = await seedNeedClaim({ needId: need.id, claimerAccount: claimerA });
    const claimB = await seedNeedClaim({ needId: need.id, claimerAccount: claimerB });

    await runExpireWorker();

    const creatorCookie = await loginAs(creator);
    const notifs = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string | null }> };
    }>(creatorCookie, MY_NOTIFICATIONS_QUERY);

    const batchNotif = notifs.allNeedClaimNotifications.nodes.find(
      n => n.eventType === "need_expired_claims_declined"
    );
    expect(batchNotif).toBeTruthy();
    // claimA and claimB should be EXPIRED (expiry path)
    const after = await gqlOk<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(creatorCookie, NEED_CLAIMS_FOR_NEED_QUERY, { needId: need.id });
    expect(after.allNeedClaims.nodes.find(c => c.id === claimA.id)?.status).toBe("EXPIRED");
    expect(after.allNeedClaims.nodes.find(c => c.id === claimB.id)?.status).toBe("EXPIRED");
  });

  it("already-declined claims are not double-declined by the expiry worker", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `exp-already-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `exp-already-claimer-${stamp}@example.com` });

    const need = await seedNeed({
      creatorAccount: creator,
      proposedTopesAmount: 0,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString()
    });
    // Seed it as already declined
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer, status: "declined" });

    await runExpireWorker();

    const creatorCookie = await loginAs(creator);
    const after = await gqlOk<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(creatorCookie, NEED_CLAIMS_FOR_NEED_QUERY, { needId: need.id });
    // Still DECLINED, not some error state
    expect(after.allNeedClaims.nodes.find(c => c.id === claim.id)?.status).toBe("DECLINED");
  });
});

describe("claim-auto-decline: need deactivation via mutation", () => {
  it("open claims are auto-declined when the need creator deactivates the need", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `deact-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `deact-claimer-${stamp}@example.com` });

    const need = await seedNeed({
      creatorAccount: creator,
      title: `Deactivation test ${stamp}`,
      proposedTopesAmount: 0
    });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    const creatorCookie = await loginAs(creator);

    // Deactivate the need by setting isActive=false via updateNeedById
    await gqlOk(creatorCookie, `
      mutation DeactivateNeed($input: UpdateNeedByIdInput!) {
        updateNeedById(input: $input) {
          need {
            id
            isActive
          }
        }
      }
    `, {
      input: {
        id: need.id,
        needPatch: { isActive: false }
      }
    });

    // Open claim should now be DECLINED
    const after = await gqlOk<{
      allNeedClaims: { nodes: Array<{ id: string; status: string }> };
    }>(creatorCookie, NEED_CLAIMS_FOR_NEED_QUERY, { needId: need.id });
    expect(after.allNeedClaims.nodes.find(c => c.id === claim.id)?.status).toBe("DECLINED");

    // Claimer receives claim_need_deactivated notification
    const claimerCookie = await loginAs(claimer);
    const notifs = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string }> };
    }>(claimerCookie, MY_NOTIFICATIONS_QUERY);

    expect(
      notifs.allNeedClaimNotifications.nodes.some(
        n => n.needClaimId === claim.id && n.eventType === "claim_need_deactivated"
      )
    ).toBe(true);
  });

  it("expiry-driven deactivation does not trigger the deactivation trigger (no double notification)", async () => {
    // If a need has already expired (is_active=false due to expiry), updating is_active should not
    // fire claim_need_deactivated a second time; that is handled by the expiry worker.
    const stamp = Date.now();
    const creator = await seedDemoAccount({ identifier: `deact-exp-creator-${stamp}@example.com` });
    const claimer = await seedDemoAccount({ identifier: `deact-exp-claimer-${stamp}@example.com` });

    const need = await seedNeed({
      creatorAccount: creator,
      proposedTopesAmount: 0,
      expiresAt: new Date(Date.now() - 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({ needId: need.id, claimerAccount: claimer });

    // Run expiry worker first — this sets is_active=false and declines via expiry path
    await runExpireWorker();

    // Now try to update is_active=false again (already false) — trigger should no-op
    const creatorCookie = await loginAs(creator);
    await gqlOk(creatorCookie, `
      mutation DeactivateNeed($input: UpdateNeedByIdInput!) {
        updateNeedById(input: $input) {
          need { id isActive }
        }
      }
    `, {
      input: { id: need.id, needPatch: { isActive: false } }
    });

    // Check claimer does NOT have a claim_need_deactivated notification (only claim_expired)
    const claimerCookie = await loginAs(claimer);
    const notifs = await gqlOk<{
      allNeedClaimNotifications: { nodes: Array<{ eventType: string; needClaimId: string }> };
    }>(claimerCookie, MY_NOTIFICATIONS_QUERY);

    const claimNotifs = notifs.allNeedClaimNotifications.nodes.filter(
      n => n.needClaimId === claim.id
    );
    expect(claimNotifs.some(n => n.eventType === "claim_expired")).toBe(true);
    expect(claimNotifs.some(n => n.eventType === "claim_need_deactivated")).toBe(false);
  });
});
