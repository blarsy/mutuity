import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

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

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

type SeededPendingNeeds = {
  needIdToAccept: string;
  needIdToReject: string;
};

async function seedPendingJoinedNeeds(
  campaignId: string,
  needCreatorAccountId: string,
  stamp: number
): Promise<SeededPendingNeeds> {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    const acceptNeed = await client.query<{ id: string }>(
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
      [needCreatorAccountId, `Audit trail accept need ${stamp}`, "Tournai"]
    );

    const rejectNeed = await client.query<{ id: string }>(
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
      [needCreatorAccountId, `Audit trail reject need ${stamp}`, "Mons"]
    );

    const needIdToAccept = acceptNeed.rows[0].id;
    const needIdToReject = rejectNeed.rows[0].id;

    await client.query(
      `
        insert into app_public.campaign_need (campaign_id, need_id, status)
        values ($1, $2, 'pending'), ($1, $3, 'pending')
      `,
      [campaignId, needIdToAccept, needIdToReject]
    );

    return {
      needIdToAccept,
      needIdToReject
    };
  } finally {
    await client.end();
  }
}

describe("audit trail integration", () => {
  it("records campaign approval and joined-need triage transitions", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `audit-creator-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Audit Campaign Creator"
    });
    const manager = await seedDemoAccount({
      identifier: `audit-manager-${stamp}@example.com`,
      role: "admin",
      displayName: "Audit Manager"
    });
    const needCreator = await seedDemoAccount({
      identifier: `audit-need-creator-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Audit Need Creator"
    });

    const creatorCookie = await loginAs(creator);
    const managerCookie = await loginAs(manager);

    const createCampaignResponse = await postGraphql(
      {
        query: `
          mutation CreateCampaign(
            $title: String!
            $theme: String!
            $rewardsMultiplier: Int!
            $airdropAmount: Int!
            $startAt: Datetime!
            $airdropAt: Datetime!
            $endAt: Datetime!
          ) {
            createCampaign(
              input: {
                title: $title
                theme: $theme
                rewardsMultiplier: $rewardsMultiplier
                airdropAmount: $airdropAmount
                startAt: $startAt
                airdropAt: $airdropAt
                endAt: $endAt
              }
            ) {
              campaign {
                id
                moderationStatus
              }
            }
          }
        `,
        variables: {
          title: `Audit campaign ${stamp}`,
          theme: "mutual aid",
          rewardsMultiplier: 5,
          airdropAmount: 3200,
          startAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          airdropAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          endAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      },
      creatorCookie
    );

    expect(createCampaignResponse.status).toBe(200);

    const createCampaignPayload = (await createCampaignResponse.json()) as {
      data?: {
        createCampaign: {
          campaign: {
            id: string;
            moderationStatus: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(createCampaignPayload.errors).toBeUndefined();
    expect(createCampaignPayload.data?.createCampaign.campaign.moderationStatus).toBe("PENDING");

    const campaignId = createCampaignPayload.data?.createCampaign.campaign.id;
    expect(campaignId).toBeTruthy();

    const approvalResponse = await postGraphql(
      {
        query: `
          mutation ApproveCampaign($campaignId: UUID!) {
            approveCampaign(input: { campaignId: $campaignId }) {
              campaign {
                id
                moderationStatus
              }
            }
          }
        `,
        variables: {
          campaignId
        }
      },
      managerCookie
    );

    expect(approvalResponse.status).toBe(200);
    await expect(approvalResponse.json()).resolves.toMatchObject({
      data: {
        approveCampaign: {
          campaign: {
            id: campaignId,
            moderationStatus: "APPROVED"
          }
        }
      }
    });

    const seededNeeds = await seedPendingJoinedNeeds(campaignId as string, needCreator.accountId, stamp);

    const acceptResponse = await postGraphql(
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
          campaignId,
          needId: seededNeeds.needIdToAccept
        }
      },
      creatorCookie
    );

    expect(acceptResponse.status).toBe(200);
    await expect(acceptResponse.json()).resolves.toMatchObject({
      data: {
        acceptCampaignNeed: {
          campaignNeed: {
            campaignId,
            needId: seededNeeds.needIdToAccept,
            status: "ACCEPTED"
          }
        }
      }
    });

    const rejectResponse = await postGraphql(
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
          campaignId,
          needId: seededNeeds.needIdToReject
        }
      },
      creatorCookie
    );

    expect(rejectResponse.status).toBe(200);
    await expect(rejectResponse.json()).resolves.toMatchObject({
      data: {
        rejectCampaignNeed: {
          campaignNeed: {
            campaignId,
            needId: seededNeeds.needIdToReject,
            status: "REJECTED"
          }
        }
      }
    });

    const auditClient = new Client({
      connectionString: TEST_DATABASE_URL
    });

    await auditClient.connect();

    try {
      const campaignApprovalAudit = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object('id', to_jsonb($1::uuid))
            and actor_account_id = $2::uuid
            and old_row ->> 'moderation_status' = 'pending'
            and new_row ->> 'moderation_status' = 'approved'
        `,
        [campaignId, manager.accountId]
      );

      const acceptedNeedAudit = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign_need'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'need_id', to_jsonb($2::uuid)
            )
            and actor_account_id = $3::uuid
            and old_row ->> 'status' = 'pending'
            and new_row ->> 'status' = 'accepted'
        `,
        [campaignId, seededNeeds.needIdToAccept, creator.accountId]
      );

      const rejectedNeedAudit = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign_need'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'need_id', to_jsonb($2::uuid)
            )
            and actor_account_id = $3::uuid
            and old_row ->> 'status' = 'pending'
            and new_row ->> 'status' = 'rejected'
        `,
        [campaignId, seededNeeds.needIdToReject, creator.accountId]
      );

      expect(campaignApprovalAudit.rows[0]?.count).toBe("1");
      expect(acceptedNeedAudit.rows[0]?.count).toBe("1");
      expect(rejectedNeedAudit.rows[0]?.count).toBe("1");
    } finally {
      await auditClient.end();
    }
  });
});
