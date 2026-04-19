import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";
import { seedNeed } from "./need-test-helpers";
import { seedResource } from "./resource-test-helpers";
import { issueCampaignAirdropPayoutsTask } from "../../src/worker/tasks/issue-campaign-airdrop-payouts";

jest.setTimeout(30000);

describe("campaign airdrop payouts", () => {
  it("pays each eligible account once per approved campaign and emits a notification", async () => {
    const stamp = Date.now();
    const now = new Date();
    const campaignCreator = await seedDemoAccount({
      identifier: `campaign-creator-${stamp}@example.com`,
      displayName: "Campaign Creator"
    });
    const recipientA = await seedDemoAccount({
      identifier: `airdrop-a-${stamp}@example.com`,
      displayName: "Eligible Account A"
    });
    const recipientB = await seedDemoAccount({
      identifier: `airdrop-b-${stamp}@example.com`,
      displayName: "Eligible Account B"
    });
    const needOnlyAccount = await seedDemoAccount({
      identifier: `airdrop-need-only-${stamp}@example.com`,
      displayName: "Need Only Account"
    });
    const resourceOnlyAccount = await seedDemoAccount({
      identifier: `airdrop-resource-only-${stamp}@example.com`,
      displayName: "Resource Only Account"
    });
    const singleNeedAccount = await seedDemoAccount({
      identifier: `airdrop-single-need-${stamp}@example.com`,
      displayName: "Single Need Account"
    });
    const singleResourceAccount = await seedDemoAccount({
      identifier: `airdrop-single-resource-${stamp}@example.com`,
      displayName: "Single Resource Account"
    });
    const rejectedAccount = await seedDemoAccount({
      identifier: `airdrop-rejected-${stamp}@example.com`,
      displayName: "Rejected Account"
    });

    const needA1 = await seedNeed({ creatorAccount: recipientA, title: `Airdrop Need A1 ${stamp}` });
    const needA2 = await seedNeed({ creatorAccount: recipientA, title: `Airdrop Need A2 ${stamp}` });
    const needB = await seedNeed({ creatorAccount: recipientB, title: `Airdrop Need B ${stamp}` });
    const needOnly1 = await seedNeed({ creatorAccount: needOnlyAccount, title: `Need Only 1 ${stamp}` });
    const needOnly2 = await seedNeed({ creatorAccount: needOnlyAccount, title: `Need Only 2 ${stamp}` });
    const singleNeed = await seedNeed({ creatorAccount: singleNeedAccount, title: `Single Need ${stamp}` });
    const rejectedNeed = await seedNeed({ creatorAccount: rejectedAccount, title: `Rejected Need ${stamp}` });

    const resourceA1 = await seedResource({ creatorAccount: recipientA, title: `Airdrop Resource A1 ${stamp}` });
    const resourceA2 = await seedResource({ creatorAccount: recipientA, title: `Airdrop Resource A2 ${stamp}` });
    const resourceB = await seedResource({ creatorAccount: recipientB, title: `Airdrop Resource B ${stamp}` });
    const resourceOnly1 = await seedResource({ creatorAccount: resourceOnlyAccount, title: `Resource Only 1 ${stamp}` });
    const resourceOnly2 = await seedResource({ creatorAccount: resourceOnlyAccount, title: `Resource Only 2 ${stamp}` });
    const singleResource = await seedResource({ creatorAccount: singleResourceAccount, title: `Single Resource ${stamp}` });
    const rejectedResource = await seedResource({ creatorAccount: rejectedAccount, title: `Rejected Resource ${stamp}` });

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    let campaignId = "";

    try {
      const campaignResult = await client.query<{ id: string }>(
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
          values ($1, $2, $3, null, 5, 3400, $4, $5, $6, 'approved')
          returning id
        `,
        [
          campaignCreator.accountId,
          `Airdrop Campaign ${stamp}`,
          "solidarity",
          new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
          new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString()
        ]
      );
      campaignId = campaignResult.rows[0]?.id ?? "";

      await client.query(
        `
          insert into app_public.campaign_need (campaign_id, need_id, status, acted_at)
          values
            ($1, $2, 'accepted', now()),
            ($1, $3, 'accepted', now()),
            ($1, $4, 'accepted', now()),
            ($1, $5, 'accepted', now()),
            ($1, $6, 'accepted', now()),
            ($1, $7, 'accepted', now()),
            ($1, $8, 'rejected', now())
        `,
        [campaignId, needA1.id, needA2.id, needB.id, needOnly1.id, needOnly2.id, singleNeed.id, rejectedNeed.id]
      );

      await client.query(
        `
          insert into app_public.campaign_resource (campaign_id, resource_id, status, acted_at)
          values
            ($1, $2, 'accepted', now()),
            ($1, $3, 'accepted', now()),
            ($1, $4, 'accepted', now()),
            ($1, $5, 'accepted', now()),
            ($1, $6, 'accepted', now()),
            ($1, $7, 'accepted', now()),
            ($1, $8, 'rejected', now())
        `,
        [campaignId, resourceA1.id, resourceA2.id, resourceB.id, resourceOnly1.id, resourceOnly2.id, singleResource.id, rejectedResource.id]
      );
    } finally {
      await client.end();
    }

    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await issueCampaignAirdropPayoutsTask({ nowIso: now.toISOString() }, {} as never);
    await issueCampaignAirdropPayoutsTask({ nowIso: now.toISOString() }, {} as never);

    const recipientACookie = await loginWithGraphqlSessionCookie(recipientA.identifier, recipientA.password);

    const recipientAOverviewResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: recipientACookie
      },
      body: JSON.stringify({
        query: `
          query RecipientAOverview {
            currentTokenBalance
            allTokenMovements(first: 20) {
              nodes {
                eventType
                amountDelta
                referenceType
                referenceId
              }
            }
            allAccountNotifications(first: 20) {
              nodes {
                eventType
                payload
                readAt
              }
            }
          }
        `
      })
    });

    expect(recipientAOverviewResponse.status).toBe(200);
    await expect(recipientAOverviewResponse.json()).resolves.toMatchObject({
      data: {
        currentTokenBalance: 3400,
        allTokenMovements: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "campaign_airdrop_received",
              amountDelta: 3400,
              referenceType: "campaign",
              referenceId: campaignId
            })
          ])
        },
        allAccountNotifications: {
          nodes: expect.arrayContaining([
            expect.objectContaining({
              eventType: "campaign_airdrop_done",
              payload: expect.objectContaining({
                campaignId,
                campaignName: `Airdrop Campaign ${stamp}`,
                amountReceived: 3400
              }),
              readAt: null
            })
          ])
        }
      }
    });

    const checkClient = new Client({ connectionString: TEST_DATABASE_URL });
    await checkClient.connect();

    try {
      const recipientBRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [recipientB.accountId, campaignId]
      );
      const needOnlyRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [needOnlyAccount.accountId, campaignId]
      );
      const resourceOnlyRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [resourceOnlyAccount.accountId, campaignId]
      );
      const singleNeedRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [singleNeedAccount.accountId, campaignId]
      );
      const singleResourceRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [singleResourceAccount.accountId, campaignId]
      );
      const rejectedRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [rejectedAccount.accountId, campaignId]
      );
      const duplicateRows = await checkClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'campaign_airdrop_received'
            and reference_type = 'campaign'
            and reference_id = $2
        `,
        [recipientA.accountId, campaignId]
      );

      expect(recipientBRows.rows[0]?.count).toBe("1");
      expect(needOnlyRows.rows[0]?.count).toBe("1");
      expect(resourceOnlyRows.rows[0]?.count).toBe("1");
      expect(singleNeedRows.rows[0]?.count).toBe("0");
      expect(singleResourceRows.rows[0]?.count).toBe("0");
      expect(rejectedRows.rows[0]?.count).toBe("0");
      expect(duplicateRows.rows[0]?.count).toBe("1");
    } finally {
      await checkClient.end();
    }
  });
});
