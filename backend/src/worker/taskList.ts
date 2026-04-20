import type { TaskList } from "graphile-worker";
import { deliverAuthEmailsTask } from "./tasks/deliver-auth-emails.js";
import { expireNeedsTask } from "./tasks/expire-needs.js";
import { issueCampaignAirdropComingSoonTask } from "./tasks/issue-campaign-airdrop-coming-soon.js";
import { issueCampaignAirdropPayoutsTask } from "./tasks/issue-campaign-airdrop-payouts.js";
import { issueDelayedTokenRewardsTask } from "./tasks/issue-delayed-token-rewards.js";
import { processResourceBidNotificationsTask } from "./tasks/process-resource-bid-notifications.js";

export const taskList: TaskList = {
  deliver_mail_outbox: deliverAuthEmailsTask,
  expire_needs: expireNeedsTask,
  issue_delayed_token_rewards: issueDelayedTokenRewardsTask,
  process_resource_bid_notifications: processResourceBidNotificationsTask,
  issue_campaign_airdrop_coming_soon: issueCampaignAirdropComingSoonTask,
  issue_campaign_airdrop_payouts: issueCampaignAirdropPayoutsTask
};
