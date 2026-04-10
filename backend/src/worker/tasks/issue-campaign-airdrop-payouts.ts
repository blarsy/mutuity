import type { Task } from "graphile-worker";
import { Client } from "pg";

type IssueCampaignAirdropPayoutsPayload = {
  nowIso?: string;
};

type IssueCampaignAirdropPayoutsResult = {
  campaign_count: number;
  payout_count: number;
  notification_count: number;
};

const ISSUE_CAMPAIGN_AIRDROP_PAYOUTS_SQL =
  "select * from app_private.issue_campaign_airdrop_payouts($1::timestamptz);";

export const issueCampaignAirdropPayoutsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as IssueCampaignAirdropPayoutsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<IssueCampaignAirdropPayoutsResult>(ISSUE_CAMPAIGN_AIRDROP_PAYOUTS_SQL, [
      now.toISOString()
    ]);
    const counts = result.rows[0] ?? {
      campaign_count: 0,
      payout_count: 0,
      notification_count: 0
    };

    console.log(
      `[worker] issue_campaign_airdrop_payouts tick at ${now.toISOString()} (campaigns=${counts.campaign_count}, payouts=${counts.payout_count}, notifications=${counts.notification_count})`
    );
  } finally {
    await client.end();
  }
};
