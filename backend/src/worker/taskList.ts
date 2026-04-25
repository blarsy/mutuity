import type { TaskList } from "graphile-worker";
import { cleanupOperationalLogsTask } from "./tasks/cleanup-operational-logs.js";
import { deliverAuthEmailsTask } from "./tasks/deliver-auth-emails.js";
import { deliverPushNotificationsTask } from "./tasks/deliver-push-notifications.js";
import { expireNeedsTask } from "./tasks/expire-needs.js";
import { issueCampaignAirdropComingSoonTask } from "./tasks/issue-campaign-airdrop-coming-soon.js";
import { issueCampaignAirdropPayoutsTask } from "./tasks/issue-campaign-airdrop-payouts.js";
import { issueDelayedTokenRewardsTask } from "./tasks/issue-delayed-token-rewards.js";
import { issueNotificationDigestsTask } from "./tasks/issue-notification-digests.js";
import { processResourceBidNotificationsTask } from "./tasks/process-resource-bid-notifications.js";

export const taskList: TaskList = {
  cleanup_operational_logs: cleanupOperationalLogsTask,
  deliver_mail_outbox: deliverAuthEmailsTask,
  deliver_push_notification_outbox: deliverPushNotificationsTask,
  expire_needs: expireNeedsTask,
  issue_delayed_token_rewards: issueDelayedTokenRewardsTask,
  issue_notification_digests: issueNotificationDigestsTask,
  process_resource_bid_notifications: processResourceBidNotificationsTask,
  issue_campaign_airdrop_coming_soon: issueCampaignAirdropComingSoonTask,
  issue_campaign_airdrop_payouts: issueCampaignAirdropPayoutsTask
};
