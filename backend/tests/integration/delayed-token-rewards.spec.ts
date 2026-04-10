import { Client } from "pg";

import { TEST_DATABASE_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { issueDelayedTokenRewardsTask } from "../../src/worker/tasks/issue-delayed-token-rewards";

jest.setTimeout(30000);

describe("delayed token rewards", () => {
  it("rewards eligible 24h-old resources and claims only once", async () => {
    const stamp = Date.now();
    const rewardNow = new Date();
    const oldEnoughAt = new Date(rewardNow.getTime() - 25 * 60 * 60 * 1000).toISOString();
    const invalidatedEarlyAt = new Date(rewardNow.getTime() - 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString();

    const resourceCreator = await seedDemoAccount({
      identifier: `resource-reward-${stamp}@example.com`,
      displayName: "Resource Reward Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `claim-reward-${stamp}@example.com`,
      displayName: "Claim Reward Claimer"
    });
    const withdrawnClaimer = await seedDemoAccount({
      identifier: `withdrawn-claim-${stamp}@example.com`,
      displayName: "Withdrawn Claim Claimer"
    });

    const resource = await seedResource({
      creatorAccount: resourceCreator,
      title: `Rewarded Resource ${stamp}`,
      expiresAt: new Date(rewardNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
    const freshResource = await seedResource({
      creatorAccount: resourceCreator,
      title: `Fresh Resource ${stamp}`,
      expiresAt: new Date(rewardNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });

    const need = await seedNeed({
      title: `Delayed Reward Need ${stamp}`,
      expiresAt: new Date(rewardNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "I have stayed available for a full day.",
      status: "open"
    });
    const withdrawnClaim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: withdrawnClaimer,
      message: "I had to step away.",
      status: "withdrawn"
    });

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(`update app_public.resource set created_at = $2 where id = $1`, [resource.id, oldEnoughAt]);
      await client.query(`update app_public.need_claim set created_at = $2 where id = $1`, [claim.id, oldEnoughAt]);
      await client.query(
        `
          update app_public.need_claim
          set created_at = $2,
              updated_at = $3
          where id = $1
        `,
        [withdrawnClaim.id, oldEnoughAt, invalidatedEarlyAt]
      );
    } finally {
      await client.end();
    }

    process.env.DATABASE_URL = TEST_DATABASE_URL;

    await issueDelayedTokenRewardsTask({ nowIso: rewardNow.toISOString() }, {} as never);
    await issueDelayedTokenRewardsTask({ nowIso: rewardNow.toISOString() }, {} as never);

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const resourceRewardRows = await checkClient.query<{ amount_delta: number }>(
        `
          select amount_delta
          from app_public.token_movement
          where account_id = $1
            and event_type = 'resource_age_24h_reward'
            and reference_type = 'resource'
            and reference_id = $2
        `,
        [resourceCreator.accountId, resource.id]
      );
      const freshResourceRewardRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'resource_age_24h_reward'
            and reference_type = 'resource'
            and reference_id = $2
        `,
        [resourceCreator.accountId, freshResource.id]
      );
      const claimRewardRows = await checkClient.query<{ amount_delta: number }>(
        `
          select amount_delta
          from app_public.token_movement
          where account_id = $1
            and event_type = 'claim_age_24h_reward'
            and reference_type = 'need_claim'
            and reference_id = $2
        `,
        [claimer.accountId, claim.id]
      );
      const withdrawnClaimRewardRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'claim_age_24h_reward'
            and reference_type = 'need_claim'
            and reference_id = $2
        `,
        [withdrawnClaimer.accountId, withdrawnClaim.id]
      );

      expect(resourceRewardRows.rows).toEqual([{ amount_delta: 20 }]);
      expect(freshResourceRewardRows.rows[0]?.count).toBe("0");
      expect(claimRewardRows.rows).toEqual([{ amount_delta: 10 }]);
      expect(withdrawnClaimRewardRows.rows[0]?.count).toBe("0");
    } finally {
      await checkClient.end();
    }
  });
});
