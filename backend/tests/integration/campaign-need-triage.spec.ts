import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  getSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

type SeededCampaignNeedContext = {
  campaignId: string;
  pendingNeedToAcceptId: string;
  pendingNeedToRejectId: string;
};

async function loginAs(account: SeededAccount) {
  const response = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      identifier: account.identifier,
      password: account.password
    })
  });

  expect(response.status).toBe(200);

  return getSessionCookie(response);
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

    await client.query(
      `
        insert into app_public.campaign_need (campaign_id, need_id, status)
        values ($1, $2, 'pending'), ($1, $3, 'pending')
      `,
      [campaignId, pendingNeedToAcceptId, pendingNeedToRejectId]
    );

    return {
      campaignId,
      pendingNeedToAcceptId,
      pendingNeedToRejectId
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
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
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
          needId: context.pendingNeedToAcceptId
        }
      },
      outsiderCookie
    );

    expect(outsiderAcceptResponse.status).toBe(200);
    await expect(outsiderAcceptResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Only the campaign creator can triage joined needs",
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ]
    });

    const creatorAcceptResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
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
          needId: context.pendingNeedToAcceptId
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
          mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!) {
            rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
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
          needId: context.pendingNeedToRejectId
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
            actedByAccountId: campaignCreator.accountId,
            actedAt: expect.any(String)
          }
        }
      }
    });

    const reTriageResponse = await postGraphql(
      {
        query: `
          mutation RejectCampaignNeed($campaignId: UUID!, $needId: UUID!) {
            rejectCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
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
          needId: context.pendingNeedToAcceptId
        }
      },
      campaignCreatorCookie
    );

    expect(reTriageResponse.status).toBe(200);
    await expect(reTriageResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Campaign need can only be triaged from pending status",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        }
      ]
    });

    const unknownRelationResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignNeed($campaignId: UUID!, $needId: UUID!) {
            acceptCampaignNeed(input: { campaignId: $campaignId, needId: $needId }) {
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
          needId: "00000000-0000-0000-0000-000000000000"
        }
      },
      campaignCreatorCookie
    );

    expect(unknownRelationResponse.status).toBe(200);
    await expect(unknownRelationResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Campaign need relation not found",
          extensions: {
            code: "NOT_FOUND"
          }
        }
      ]
    });

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
    } finally {
      await auditClient.end();
    }
  });
});
