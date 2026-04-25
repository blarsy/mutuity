import type { Task } from "graphile-worker";
import { Client } from "pg";

import { logWorkerInfo } from "../../logging/operationalLogger.js";

type IssueCampaignAirdropComingSoonPayload = {
  nowIso?: string;
};

type IssueCampaignAirdropComingSoonResult = {
  campaign_count: number;
  recipient_count: number;
  notification_count: number;
};

const ISSUE_CAMPAIGN_AIRDROP_COMING_SOON_SQL =
  "select * from app_private.issue_campaign_airdrop_coming_soon($1::timestamptz);";

export const issueCampaignAirdropComingSoonTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as IssueCampaignAirdropComingSoonPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<IssueCampaignAirdropComingSoonResult>(
      ISSUE_CAMPAIGN_AIRDROP_COMING_SOON_SQL,
      [now.toISOString()]
    );
    const counts = result.rows[0] ?? {
      campaign_count: 0,
      recipient_count: 0,
      notification_count: 0
    };

    await logWorkerInfo(
      `[worker] issue_campaign_airdrop_coming_soon tick at ${now.toISOString()} (campaigns=${counts.campaign_count}, recipients=${counts.recipient_count}, notifications=${counts.notification_count})`,
      {
        task: "issue_campaign_airdrop_coming_soon",
        campaigns: counts.campaign_count,
        recipients: counts.recipient_count,
        notifications: counts.notification_count
      }
    );
  } finally {
    await client.end();
  }
};
