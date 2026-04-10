import type { TaskList } from "graphile-worker";
import { expireNeedsTask } from "./tasks/expire-needs.js";
import { issueDelayedTokenRewardsTask } from "./tasks/issue-delayed-token-rewards.js";

export const taskList: TaskList = {
  expire_needs: expireNeedsTask,
  issue_delayed_token_rewards: issueDelayedTokenRewardsTask
};
