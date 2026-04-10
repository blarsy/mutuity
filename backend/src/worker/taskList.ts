import type { TaskList } from "graphile-worker";
import { expireNeedsTask } from "./tasks/expire-needs.js";
import { issueCampaignAirdropComingSoonTask } from "./tasks/issue-campaign-airdrop-coming-soon.js";
import { issueCampaignAirdropPayoutsTask } from "./tasks/issue-campaign-airdrop-payouts.js";
import { issueDelayedTokenRewardsTask } from "./tasks/issue-delayed-token-rewards.js";

export const taskList: TaskList = {
  expire_needs: expireNeedsTask,
  issue_delayed_token_rewards: issueDelayedTokenRewardsTask,
  issue_campaign_airdrop_coming_soon: issueCampaignAirdropComingSoonTask,
  issue_campaign_airdrop_payouts: issueCampaignAirdropPayoutsTask
};
