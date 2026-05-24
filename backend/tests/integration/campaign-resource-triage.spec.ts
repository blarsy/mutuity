import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

type SeededCampaignResourceContext = {
  campaignId: string;
  pendingResourceToAcceptId: string;
  pendingResourceToRejectId: string;
};

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function seedCampaignWithJoinedResources(
  campaignCreatorAccountId: string,
  resourceCreatorAccountId: string,
  stamp: number
): Promise<SeededCampaignResourceContext> {
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
        `Resource triage campaign ${stamp}`,
        "mutual aid",
        5,
        3200,
        startAt,
        airdropAt,
        endAt
      ]
    );

    const acceptResourceResult = await client.query<{ id: string }>(
      `
        insert into app_public.resource (
          creator_account_id,
          title,
          location,
          intensity,
          is_product,
          is_service,
          is_active
        )
        values ($1, $2, $3, 'sharing', true, false, true)
        returning id
      `,
      [resourceCreatorAccountId, `Pending accept resource ${stamp}`, "Tournai"]
    );

    const rejectResourceResult = await client.query<{ id: string }>(
      `
        insert into app_public.resource (
          creator_account_id,
          title,
          location,
          intensity,
          is_product,
          is_service,
          is_active
        )
        values ($1, $2, $3, 'leg_up', true, false, true)
        returning id
      `,
      [resourceCreatorAccountId, `Pending reject resource ${stamp}`, "Mons"]
    );

    const pendingResourceToAcceptId = acceptResourceResult.rows[0].id;
    const pendingResourceToRejectId = rejectResourceResult.rows[0].id;
    const campaignId = campaignResult.rows[0].id;

    await client.query(
      `
        insert into app_public.campaign_resource (campaign_id, resource_id, status)
        values ($1, $2, 'pending'), ($1, $3, 'pending')
      `,
      [campaignId, pendingResourceToAcceptId, pendingResourceToRejectId]
    );

    return {
      campaignId,
      pendingResourceToAcceptId,
      pendingResourceToRejectId
    };
  } finally {
    await client.end();
  }
}

describe("campaign resource triage integration", () => {
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

  it("allows campaign creator to accept or reject pending joined resources and blocks unauthorized transitions", async () => {
    const stamp = Date.now();
    const campaignCreator = await seedDemoAccount({
      identifier: `resource-triage-campaign-creator-${stamp}@example.com`,
      displayName: "Campaign Resource Triage Creator"
    });
    const resourceCreator = await seedDemoAccount({
      identifier: `resource-triage-resource-creator-${stamp}@example.com`,
      displayName: "Resource Triage Creator"
    });
    const outsider = await seedDemoAccount({
      identifier: `resource-triage-outsider-${stamp}@example.com`,
      displayName: "Resource Triage Outsider"
    });

    const campaignCreatorCookie = await loginAs(campaignCreator);
    const outsiderCookie = await loginAs(outsider);

    const context = await seedCampaignWithJoinedResources(campaignCreator.accountId, resourceCreator.accountId, stamp);

    const outsiderAcceptResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
            acceptCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
              campaignResource {
                campaignId
                resourceId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          resourceId: context.pendingResourceToAcceptId
        }
      },
      outsiderCookie
    );

    expect(outsiderAcceptResponse.status).toBe(200);
    await expect(outsiderAcceptResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Only the campaign creator can triage joined resources",
          extensions: {
            code: "FORBIDDEN"
          }
        }
      ]
    });

    const creatorAcceptResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
            acceptCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
              campaignResource {
                campaignId
                resourceId
                status
                actedByAccountId
                actedAt
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          resourceId: context.pendingResourceToAcceptId
        }
      },
      campaignCreatorCookie
    );

    expect(creatorAcceptResponse.status).toBe(200);
    await expect(creatorAcceptResponse.json()).resolves.toMatchObject({
      data: {
        acceptCampaignResource: {
          campaignResource: {
            campaignId: context.campaignId,
            resourceId: context.pendingResourceToAcceptId,
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
          mutation RejectCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
            rejectCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
              campaignResource {
                campaignId
                resourceId
                status
                actedByAccountId
                actedAt
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          resourceId: context.pendingResourceToRejectId
        }
      },
      campaignCreatorCookie
    );

    expect(creatorRejectResponse.status).toBe(200);
    await expect(creatorRejectResponse.json()).resolves.toMatchObject({
      data: {
        rejectCampaignResource: {
          campaignResource: {
            campaignId: context.campaignId,
            resourceId: context.pendingResourceToRejectId,
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
          mutation RejectCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
            rejectCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
              campaignResource {
                campaignId
                resourceId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          resourceId: context.pendingResourceToAcceptId
        }
      },
      campaignCreatorCookie
    );

    expect(reTriageResponse.status).toBe(200);
    await expect(reTriageResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Campaign resource can only be triaged from pending status",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        }
      ]
    });

    const unknownRelationResponse = await postGraphql(
      {
        query: `
          mutation AcceptCampaignResource($campaignId: UUID!, $resourceId: UUID!) {
            acceptCampaignResource(input: { campaignId: $campaignId, resourceId: $resourceId }) {
              campaignResource {
                campaignId
                resourceId
                status
              }
            }
          }
        `,
        variables: {
          campaignId: context.campaignId,
          resourceId: "00000000-0000-0000-0000-000000000000"
        }
      },
      campaignCreatorCookie
    );

    expect(unknownRelationResponse.status).toBe(200);
    await expect(unknownRelationResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Campaign resource relation not found",
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
          where table_name = 'app_public.campaign_resource'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'resource_id', to_jsonb($2::uuid)
            )
            and new_row ->> 'status' = 'accepted'
        `,
        [context.campaignId, context.pendingResourceToAcceptId]
      );

      const rejectedAuditResult = await auditClient.query<{ count: string }>(
        `
          select count(*)::text as count
          from audit.event
          where table_name = 'app_public.campaign_resource'
            and action = 'UPDATE'
            and row_pk @> jsonb_build_object(
              'campaign_id', to_jsonb($1::uuid),
              'resource_id', to_jsonb($2::uuid)
            )
            and new_row ->> 'status' = 'rejected'
        `,
        [context.campaignId, context.pendingResourceToRejectId]
      );

      expect(acceptedAuditResult.rows[0]?.count).toBe("1");
      expect(rejectedAuditResult.rows[0]?.count).toBe("1");
    } finally {
      await auditClient.end();
    }
  });
});
