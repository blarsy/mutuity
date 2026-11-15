import { Client } from "pg";

import { TEST_DATABASE_URL, seedDemoAccount } from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { issueCampaignAirdropComingSoonTask } from "../../src/worker/tasks/issue-campaign-airdrop-coming-soon";

jest.setTimeout(30000);

describe("campaign airdrop coming-soon notifications", () => {
  it("notifies linked accounts once when a campaign is 48 hours from airdrop time, whether links are approved or not", async () => {
    const stamp = Date.now();
    const now = new Date();
    const soonAirdropAt = new Date(now.getTime() + 47 * 60 * 60 * 1000).toISOString();
    const laterAirdropAt = new Date(now.getTime() + 72 * 60 * 60 * 1000).toISOString();

    const campaignCreator = await seedDemoAccount({
      identifier: `campaign-soon-creator-${stamp}@example.com`,
      displayName: "Soon Campaign Creator"
    });
    const eligibleAccount = await seedDemoAccount({
      identifier: `campaign-soon-eligible-${stamp}@example.com`,
      displayName: "Soon Eligible Account"
    });
    const singleNeedAccount = await seedDemoAccount({
      identifier: `campaign-soon-single-need-${stamp}@example.com`,
      displayName: "Single Need Account"
    });

    const eligibleNeed = await seedNeed({ creatorAccount: eligibleAccount, title: `Soon Need ${stamp}` });
    const eligibleResource = await seedResource({ creatorAccount: eligibleAccount, title: `Soon Resource ${stamp}` });
    const singleNeed = await seedNeed({ creatorAccount: singleNeedAccount, title: `Only Need ${stamp}` });
    // A listing may occupy only one current campaign slot, so the later
    // campaign must use distinct listings even for the same recipient.
    const laterNeed = await seedNeed({ creatorAccount: eligibleAccount, title: `Later Need ${stamp}` });
    const laterResource = await seedResource({ creatorAccount: eligibleAccount, title: `Later Resource ${stamp}` });

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    let eligibleCampaignId = "";
    let laterCampaignId = "";

    try {
      const eligibleCampaign = await client.query<{ id: string }>(
        `
          insert into app_public.campaign (
            creator_account_id,
            title,
            theme,
            manager_note_from_creator,
            rewards_multiplier,
            airdrop_amount,
            start_at,
            airdrop_at,
            end_at,
            moderation_status
          )
          values ($1, $2, $3, null, 5, 3200, $4, $5, $6, 'approved')
          returning id
        `,
        [
          campaignCreator.accountId,
          `Coming Soon Campaign ${stamp}`,
          "solidarity",
          new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          soonAirdropAt,
          new Date(now.getTime() + 96 * 60 * 60 * 1000).toISOString()
        ]
      );
      eligibleCampaignId = eligibleCampaign.rows[0]?.id ?? "";

      const laterCampaign = await client.query<{ id: string }>(
        `
          insert into app_public.campaign (
            creator_account_id,
            title,
            theme,
            manager_note_from_creator,
            rewards_multiplier,
            airdrop_amount,
            start_at,
            airdrop_at,
            end_at,
            moderation_status
          )
          values ($1, $2, $3, null, 5, 3200, $4, $5, $6, 'approved')
          returning id
        `,
        [
          campaignCreator.accountId,
          `Later Campaign ${stamp}`,
          "solidarity",
          new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          laterAirdropAt,
          new Date(now.getTime() + 120 * 60 * 60 * 1000).toISOString()
        ]
      );
      laterCampaignId = laterCampaign.rows[0]?.id ?? "";

      await client.query(
        `
          insert into app_public.campaign_need (campaign_id, need_id, status, acted_at, is_current)
          values
            ($1, $2, 'accepted', now(), true),
            ($1, $3, 'pending', null, true),
            ($4, $5, 'accepted', now(), true)
        `,
        [eligibleCampaignId, eligibleNeed.id, singleNeed.id, laterCampaignId, laterNeed.id]
      );

      await client.query(
        `
          insert into app_public.campaign_resource (campaign_id, resource_id, status, acted_at, is_current)
          values
            ($1, $2, 'accepted', now(), true),
            ($3, $4, 'accepted', now(), true)
        `,
        [eligibleCampaignId, eligibleResource.id, laterCampaignId, laterResource.id]
      );
    } finally {
      await client.end();
    }

    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await issueCampaignAirdropComingSoonTask({ nowIso: now.toISOString() }, {} as never);
    await issueCampaignAirdropComingSoonTask({ nowIso: now.toISOString() }, {} as never);

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const eligibleNotifications = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.account_notification
          where recipient_account_id = $1
            and event_type = 'campaign_airdrop_coming_soon'
            and payload ->> 'campaignId' = $2
        `,
        [eligibleAccount.accountId, eligibleCampaignId]
      );
      const singleNeedNotifications = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.account_notification
          where recipient_account_id = $1
            and event_type = 'campaign_airdrop_coming_soon'
            and payload ->> 'campaignId' = $2
        `,
        [singleNeedAccount.accountId, eligibleCampaignId]
      );
      const laterCampaignNotifications = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.account_notification
          where recipient_account_id = $1
            and event_type = 'campaign_airdrop_coming_soon'
            and payload ->> 'campaignId' = $2
        `,
        [eligibleAccount.accountId, laterCampaignId]
      );

      expect(eligibleNotifications.rows[0]?.count).toBe("1");
      expect(singleNeedNotifications.rows[0]?.count).toBe("1");
      expect(laterCampaignNotifications.rows[0]?.count).toBe("0");
    } finally {
      await checkClient.end();
    }
  });
});
