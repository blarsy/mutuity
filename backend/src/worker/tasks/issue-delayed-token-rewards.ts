import type { Task } from "graphile-worker";
import { Client } from "pg";

import { logWorkerError, logWorkerInfo } from "../../logging/operationalLogger.js";

type IssueDelayedTokenRewardsPayload = {
  nowIso?: string;
};

type IssueDelayedTokenRewardsResult = {
  resource_reward_count: number;
  claim_reward_count: number;
  total_reward_count: number;
};

const ISSUE_DELAYED_TOKEN_REWARDS_SQL =
  "select * from app_private.issue_delayed_token_rewards($1::timestamptz);";

export const issueDelayedTokenRewardsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as IssueDelayedTokenRewardsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<IssueDelayedTokenRewardsResult>(ISSUE_DELAYED_TOKEN_REWARDS_SQL, [
      now.toISOString()
    ]);
    const counts = result.rows[0] ?? {
      resource_reward_count: 0,
      claim_reward_count: 0,
      total_reward_count: 0
    };

    await logWorkerInfo(
      `[worker] issue_delayed_token_rewards tick at ${now.toISOString()} (resources=${counts.resource_reward_count}, claims=${counts.claim_reward_count}, total=${counts.total_reward_count})`,
      {
        task: "issue_delayed_token_rewards",
        resourceRewards: counts.resource_reward_count,
        claimRewards: counts.claim_reward_count,
        totalRewards: counts.total_reward_count
      }
    );
  } catch (error) {
    await logWorkerError("[worker] issue_delayed_token_rewards task failed", error, {
      task: "issue_delayed_token_rewards"
    });
    throw error;
  } finally {
    await client.end();
  }
};
