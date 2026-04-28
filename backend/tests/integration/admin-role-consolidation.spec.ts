import { TEST_BACKEND_URL, loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";

jest.setTimeout(30000);

type GraphqlBody = {
  data?: Record<string, unknown>;
  errors?: Array<{
    message: string;
    path?: string[];
    extensions?: {
      code?: string;
    };
  }>;
};


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

describe("administrator-only role consolidation", () => {
  it("enforces administrator-only authorization across moderation, approval, grants, and admin support queries", async () => {
    const stamp = Date.now();

    const creator = await seedDemoAccount({
      identifier: `creator-role-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Role Creator"
    });
    const admin = await seedDemoAccount({
      identifier: `admin-role-${stamp}@example.com`,
      role: "admin",
      displayName: "Role Admin"
    });
    const regular = await seedDemoAccount({
      identifier: `regular-role-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Role Regular"
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);
    const adminCookie = await loginWithGraphqlSessionCookie(admin.identifier, admin.password);
    const regularCookie = await loginWithGraphqlSessionCookie(regular.identifier, regular.password);

    const createCampaignResponse = await postGraphql(
      {
        query: `
          mutation CreateCampaign($title: String!, $theme: String!, $rewardsMultiplier: Int!, $airdropAmount: Int!, $startAt: Datetime!, $airdropAt: Datetime!, $endAt: Datetime!) {
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
          title: `Role consolidation ${stamp}`,
          theme: "solidarity",
          rewardsMultiplier: 5,
          airdropAmount: 3200,
          startAt: "2026-05-01T10:00:00.000Z",
          airdropAt: "2026-05-02T10:00:00.000Z",
          endAt: "2026-05-03T10:00:00.000Z"
        }
      },
      creatorCookie
    );

    expect(createCampaignResponse.status).toBe(200);
    const createCampaignBody = (await createCampaignResponse.json()) as GraphqlBody;
    expect(createCampaignBody.errors).toBeUndefined();
    const campaignId = ((createCampaignBody.data?.createCampaign as { campaign: { id: string } } | undefined)?.campaign.id ?? null);
    expect(campaignId).toBeTruthy();

    const regularModerationResponse = await postGraphql(
      {
        query: `
          mutation AddCampaignModerationNote($campaignId: UUID!, $body: String!) {
            addCampaignModerationNote(input: { campaignId: $campaignId, body: $body }) {
              campaignModerationNote { id }
            }
          }
        `,
        variables: {
          campaignId,
          body: "Please update campaign details"
        }
      },
      regularCookie
    );

    expect(regularModerationResponse.status).toBe(200);
    const regularModerationBody = (await regularModerationResponse.json()) as GraphqlBody;
    expect(regularModerationBody.data?.addCampaignModerationNote ?? null).toBeNull();
    expect(regularModerationBody.errors?.length ?? 0).toBeGreaterThan(0);

    const adminModerationResponse = await postGraphql(
      {
        query: `
          mutation AddCampaignModerationNote($campaignId: UUID!, $body: String!) {
            addCampaignModerationNote(input: { campaignId: $campaignId, body: $body }) {
              campaignModerationNote { id campaignId }
            }
          }
        `,
        variables: {
          campaignId,
          body: "Looks good for approval"
        }
      },
      adminCookie
    );

    expect(adminModerationResponse.status).toBe(200);
    const adminModerationBody = (await adminModerationResponse.json()) as GraphqlBody;
    expect(adminModerationBody.errors).toBeUndefined();
    expect(adminModerationBody.data?.addCampaignModerationNote).toBeTruthy();

    const regularApproveResponse = await postGraphql(
      {
        query: `
          mutation ApproveCampaign($campaignId: UUID!) {
            approveCampaign(input: { campaignId: $campaignId }) {
              campaign { id }
            }
          }
        `,
        variables: { campaignId }
      },
      regularCookie
    );

    expect(regularApproveResponse.status).toBe(200);
    const regularApproveBody = (await regularApproveResponse.json()) as GraphqlBody;
    expect(regularApproveBody.data?.approveCampaign ?? null).toBeNull();
    expect(regularApproveBody.errors?.length ?? 0).toBeGreaterThan(0);

    const adminApproveResponse = await postGraphql(
      {
        query: `
          mutation ApproveCampaign($campaignId: UUID!) {
            approveCampaign(input: { campaignId: $campaignId }) {
              campaign { id moderationStatus }
            }
          }
        `,
        variables: { campaignId }
      },
      adminCookie
    );

    expect(adminApproveResponse.status).toBe(200);
    const adminApproveBody = (await adminApproveResponse.json()) as GraphqlBody;
    expect(adminApproveBody.errors).toBeUndefined();
    expect(adminApproveBody.data?.approveCampaign).toBeTruthy();

    const regularUpsertGrantResponse = await postGraphql(
      {
        query: `
          mutation UpsertGrant(
            $pTitle: String!
            $pAwardedTokenAmount: Int!
            $pMaxSuccessfulClaimCount: Int
            $pExpiresAt: Datetime!
          ) {
            upsertGrant(
              input: {
                pTitle: $pTitle
                pAwardedTokenAmount: $pAwardedTokenAmount
                pMaxSuccessfulClaimCount: $pMaxSuccessfulClaimCount
                pExpiresAt: $pExpiresAt
              }
            ) {
              grantDefinition { id }
            }
          }
        `,
        variables: {
          pTitle: `Grant denied ${stamp}`,
          pAwardedTokenAmount: 100,
          pMaxSuccessfulClaimCount: 1,
          pExpiresAt: "2027-01-01T00:00:00.000Z"
        }
      },
      regularCookie
    );

    expect(regularUpsertGrantResponse.status).toBe(200);
    const regularUpsertGrantBody = (await regularUpsertGrantResponse.json()) as GraphqlBody;
    expect(regularUpsertGrantBody.data?.upsertGrant ?? null).toBeNull();
    expect(regularUpsertGrantBody.errors?.length ?? 0).toBeGreaterThan(0);

    const adminUpsertGrantResponse = await postGraphql(
      {
        query: `
          mutation UpsertGrant(
            $pTitle: String!
            $pAwardedTokenAmount: Int!
            $pMaxSuccessfulClaimCount: Int
            $pExpiresAt: Datetime!
          ) {
            upsertGrant(
              input: {
                pTitle: $pTitle
                pAwardedTokenAmount: $pAwardedTokenAmount
                pMaxSuccessfulClaimCount: $pMaxSuccessfulClaimCount
                pExpiresAt: $pExpiresAt
              }
            ) {
              grantDefinition { id title }
            }
          }
        `,
        variables: {
          pTitle: `Grant allowed ${stamp}`,
          pAwardedTokenAmount: 100,
          pMaxSuccessfulClaimCount: 1,
          pExpiresAt: "2027-01-01T00:00:00.000Z"
        }
      },
      adminCookie
    );

    expect(adminUpsertGrantResponse.status).toBe(200);
    const adminUpsertGrantBody = (await adminUpsertGrantResponse.json()) as GraphqlBody;
    expect(adminUpsertGrantBody.errors).toBeUndefined();
    expect(adminUpsertGrantBody.data?.upsertGrant).toBeTruthy();

    const regularAdminListResponse = await postGraphql(
      {
        query: `
          query {
            adminListAccounts(pLimit: 5) {
              totalCount
            }
          }
        `
      },
      regularCookie
    );

    expect(regularAdminListResponse.status).toBe(200);
    const regularAdminListBody = (await regularAdminListResponse.json()) as GraphqlBody;
    expect(regularAdminListBody.data?.adminListAccounts ?? null).toBeNull();
    expect(regularAdminListBody.errors?.length ?? 0).toBeGreaterThan(0);

    const adminAdminListResponse = await postGraphql(
      {
        query: `
          query {
            adminListAccounts(pLimit: 5) {
              totalCount
            }
          }
        `
      },
      adminCookie
    );

    expect(adminAdminListResponse.status).toBe(200);
    const adminAdminListBody = (await adminAdminListResponse.json()) as GraphqlBody;
    expect(adminAdminListBody.errors).toBeUndefined();
    expect(
      (adminAdminListBody.data?.adminListAccounts as { totalCount: number } | undefined)?.totalCount
    ).toBeGreaterThan(0);
  });
});
