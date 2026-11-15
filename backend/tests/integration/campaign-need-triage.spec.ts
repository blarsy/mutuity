import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

type SeededCampaignNeedContext = {
  campaignId: string;
  pendingNeedToAcceptId: string;
  pendingNeedToRejectId: string;
  acceptSubmissionId: string;
  rejectSubmissionId: string;
};

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function seedCampaignWithJoinedNeeds(
  campaignCreatorAccountId: string,
  needCreatorAccountId: string,
  stamp: number
): Promise<SeededCampaignNeedContext> {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    const startAt = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const airdropAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const campaignResult = await client.query<{ id: string }>(
      `
        insert into app_public.campaign (
          creator_account_id,
          title,
          theme,
          rewards_multiplier,
          airdrop_amount,
          start_at,
          airdrop_at,
          end_at,
          moderation_status
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, 'approved')
        returning id
      `,
      [
        campaignCreatorAccountId,
        `Triage campaign ${stamp}`,
        "mutual aid",
        5,
        3200,
        startAt,
        airdropAt,
        endAt
      ]
    );

    const acceptNeedResult = await client.query<{ id: string }>(
      `
        insert into app_public.need (
          creator_account_id,
          title,
          location,
          intensity,
          object_required
        )
        values ($1, $2, $3, 'sharing', true)
        returning id
      `,
      [needCreatorAccountId, `Pending accept need ${stamp}`, "Tournai"]
    );

    const rejectNeedResult = await client.query<{ id: string }>(
      `
        insert into app_public.need (
          creator_account_id,
          title,
          location,
          intensity,
          object_required
        )
        values ($1, $2, $3, 'leg_up', true)
        returning id
      `,
      [needCreatorAccountId, `Pending reject need ${stamp}`, "Mons"]
    );

    const pendingNeedToAcceptId = acceptNeedResult.rows[0].id;
    const pendingNeedToRejectId = rejectNeedResult.rows[0].id;
    const campaignId = campaignResult.rows[0].id;

    const submissions = await client.query<{ need_id: string; submission_id: string }>(
      `
        insert into app_public.campaign_need (campaign_id, need_id, status, is_current)
        values ($1, $2, 'pending', true), ($1, $3, 'pending', true)
        returning need_id, submission_id
      `,
      [campaignId, pendingNeedToAcceptId, pendingNeedToRejectId]
    );

    return {
      campaignId,
      pendingNeedToAcceptId,
      pendingNeedToRejectId,
      acceptSubmissionId: submissions.rows.find(row => row.need_id === pendingNeedToAcceptId)!.submission_id,
      rejectSubmissionId: submissions.rows.find(row => row.need_id === pendingNeedToRejectId)!.submission_id
    };
  } finally {
    await client.end();
  }
}

describe("campaign need triage integration", () => {
  async function postGraphql(body: Record<string, unknown>, cookie?: string) {
    return fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {})
      },
      body: JSON.stringify(body)
    });
  }

  it("allows campaign creator to accept or reject pending joined needs and blocks unauthorized transitions", async () => {
    const stamp = Date.now();
    const campaignCreator = await seedDemoAccount({
      identifier: `triage-campaign-creator-${stamp}@example.com`,
      displayName: "Campaign Triage Creator"
    });
    const needCreator = await seedDemoAccount({
      identifier: `triage-need-creator-${stamp}@example.com`,
      displayName: "Need Triage Creator"
    });
    const outsider = await seedDemoAccount({
      identifier: `triage-outsider-${stamp}@example.com`,
      displayName: "Triage Outsider"
    });

    const campaignCreatorCookie = await loginAs(campaignCreator);
    const outsiderCookie = await loginAs(outsider);

    const context = await seedCampaignWithJoinedNeeds(campaignCreator.accountId, needCreator.accountId, stamp);

    const outsiderAcceptResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId }) {
              campaignNeed {
                campaignId
                needId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          needId: context.pendingNeedToAcceptId,
          expectedSubmissionId: context.acceptSubmissionId
        }
      },
      outsiderCookie
    );

    expect(outsiderAcceptResponse.status).toBe(200);
    const outsiderPayload = await outsiderAcceptResponse.json();

    const creatorAcceptResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId }) {
              campaignNeed {
                campaignId
                needId
                status
                actedByAccountId
                actedAt
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          needId: context.pendingNeedToAcceptId,
          expectedSubmissionId: context.acceptSubmissionId
        }
      },
      campaignCreatorCookie
    );

    expect(creatorAcceptResponse.status).toBe(200);
    await expect(creatorAcceptResponse.json()).resolves.toMatchObject({
      data: {
        acceptCampaignNeed: {
          campaignNeed: {
            campaignId: context.campaignId,
            needId: context.pendingNeedToAcceptId,
            status: "ACCEPTED",
            actedByAccountId: campaignCreator.accountId,
            actedAt: expect.any(String)
          }
        }
      }
    });

    const creatorRejectResponse = await postGraphql(
      {
        query: `
          mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
            rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId, rejectionNote: "Please clarify the listing" }) {
              campaignNeed {
                campaignId
                needId
                status
                actedByAccountId
                actedAt
                rejectionNote
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          needId: context.pendingNeedToRejectId,
          expectedSubmissionId: context.rejectSubmissionId
        }
      },
      campaignCreatorCookie
    );

    expect(creatorRejectResponse.status).toBe(200);
    await expect(creatorRejectResponse.json()).resolves.toMatchObject({
      data: {
        rejectCampaignNeed: {
          campaignNeed: {
            campaignId: context.campaignId,
            needId: context.pendingNeedToRejectId,
            status: "REJECTED",
            rejectionNote: "Please clarify the listing",
            actedByAccountId: campaignCreator.accountId,
            actedAt: expect.any(String)
          }
        }
      }
    });

    const reTriageResponse = await postGraphql(
      {
        query: `
          mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
            rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId }) {
              campaignNeed {
                campaignId
                needId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          needId: context.pendingNeedToAcceptId,
          expectedSubmissionId: context.acceptSubmissionId
        }
      },
      campaignCreatorCookie
    );

    expect(reTriageResponse.status).toBe(200);
    const stalePayload = await reTriageResponse.json();

    const unknownRelationResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!, $expectedSubmissionId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId, expectedSubmissionId: $expectedSubmissionId }) {
              campaignNeed {
                campaignId
                needId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          needId: "00000000-0000-0000-0000-000000000000",
          expectedSubmissionId: context.acceptSubmissionId
        }
      },
      campaignCreatorCookie
    );

    expect(unknownRelationResponse.status).toBe(200);
    const missingPayload = await unknownRelationResponse.json();

    const auditClient = new Client({
      connectionString: TEST_DATABASE_URL
    });

    await auditClient.connect();

    try {
      const acceptedAuditResult = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign_need'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'need_id', to_jsonb($2::uuid)
            )
            and new_row ->> 'status' = 'accepted'
        `,
        [context.campaignId, context.pendingNeedToAcceptId]
      );

      const rejectedAuditResult = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign_need'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'need_id', to_jsonb($2::uuid)
            )
            and new_row ->> 'status' = 'rejected'
        `,
        [context.campaignId, context.pendingNeedToRejectId]
      );

      expect(acceptedAuditResult.rows[0]?.count).toBe("1");
      expect(rejectedAuditResult.rows[0]?.count).toBe("1");
      // Check error presentation last so a missing HTTP allowlist entry does
      // not prevent exercising the successful decisions and audit writes.
      expect([outsiderPayload, stalePayload, missingPayload]).toMatchObject([
        { errors: [{ message: "Only the campaign creator can triage joined listings", extensions: { code: "FORBIDDEN" } }] },
        { errors: [{ message: "This application is no longer available for review", extensions: { code: "BAD_USER_INPUT" } }] },
        { errors: [{ message: "This application is no longer available for review", extensions: { code: "BAD_USER_INPUT" } }] }
      ]);
    } finally {
      await auditClient.end();
    }
  });
});
