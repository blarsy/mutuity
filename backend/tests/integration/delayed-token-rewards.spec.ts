import { Client } from "pg";

import { TEST_DATABASE_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed, seedNeedClaim } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { issueDelayedTokenRewardsTask } from "../../src/worker/tasks/issue-delayed-token-rewards";

jest.setTimeout(30000);

describe("delayed token rewards", () => {
  it("rewards eligible 24h-old resources and needs only once, with no claim-age reward", async () => {
    const stamp = Date.now();
    const rewardNow = new Date();
    const oldEnoughAt = new Date(rewardNow.getTime() - 25 * 60 * 60 * 1000).toISOString();

    const resourceCreator = await seedDemoAccount({
      identifier: `resource-reward-${stamp}@example.com`,
      displayName: "Resource Reward Creator"
    });
    const needCreator = await seedDemoAccount({
      identifier: `need-reward-${stamp}@example.com`,
      displayName: "Need Reward Creator"
    });
    const claimer = await seedDemoAccount({
      identifier: `no-claim-reward-${stamp}@example.com`,
      displayName: "No Claim Reward Claimer"
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
      creatorAccount: needCreator,
      title: `Delayed Reward Need ${stamp}`,
      expiresAt: new Date(rewardNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
    const inactiveNeed = await seedNeed({
      creatorAccount: needCreator,
      title: `Inactive Delayed Reward Need ${stamp}`,
      isActive: false,
      expiresAt: new Date(rewardNow.getTime() + 24 * 60 * 60 * 1000).toISOString()
    });
    const claim = await seedNeedClaim({
      needId: need.id,
      claimerAccount: claimer,
      message: "I have stayed available for a full day.",
      status: "open"
    });

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(`update app_public.resource set created_at = $2 where id = $1`, [resource.id, oldEnoughAt]);
      await client.query(`update app_public.need set created_at = $2 where id = $1`, [need.id, oldEnoughAt]);
      await client.query(`update app_public.need set created_at = $2 where id = $1`, [inactiveNeed.id, oldEnoughAt]);
      await client.query(`update app_public.need_claim set created_at = $2 where id = $1`, [claim.id, oldEnoughAt]);
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
      const claimRewardRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'claim_age_24h_reward'
            and reference_type = 'need_claim'
            and reference_id = $2
        `,
        [claimer.accountId, claim.id]
      );
      const needRewardRows = await checkClient.query<{ amount_delta: number }>(
        `
          select amount_delta
          from app_public.token_movement
          where account_id = $1
            and event_type = 'need_age_24h_reward'
            and reference_type = 'need'
            and reference_id = $2
        `,
        [needCreator.accountId, need.id]
      );
      const inactiveNeedRewardRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'need_age_24h_reward'
            and reference_type = 'need'
            and reference_id = $2
        `,
        [needCreator.accountId, inactiveNeed.id]
      );

      expect(resourceRewardRows.rows).toEqual([{ amount_delta: 20 }]);
      expect(freshResourceRewardRows.rows[0]?.count).toBe("0");
      expect(needRewardRows.rows).toEqual([{ amount_delta: 10 }]);
      expect(inactiveNeedRewardRows.rows[0]?.count).toBe("0");
      expect(claimRewardRows.rows[0]?.count).toBe("0");
    } finally {
      await checkClient.end();
    }
  });
});
