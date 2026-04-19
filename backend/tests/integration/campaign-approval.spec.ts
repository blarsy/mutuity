import { TEST_BACKEND_URL, loginWithGraphqlSessionCookie, seedDemoAccount } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("campaign approval integration", () => {
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

  it("enforces manager-only approval and makes campaign visible once approved", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `creator-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Campaign Creator"
    });
    const manager = await seedDemoAccount({
      identifier: `manager-${stamp}@example.com`,
      role: "manager",
      displayName: "Campaign Manager"
    });
    const viewer = await seedDemoAccount({
      identifier: `viewer-${stamp}@example.com`,
      role: "identified_account",
      displayName: "Campaign Viewer"
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const managerCookie = await loginWithGraphqlSessionCookie(manager.identifier, manager.password);

    const viewerCookie = await loginWithGraphqlSessionCookie(viewer.identifier, viewer.password);

    const createResponse = await postGraphql(
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
                title
                moderationStatus
              }
            }
          }
        `,
        variables: {
          title: `US3 Approval ${stamp}`,
          theme: "solidarity",
          rewardsMultiplier: 5,
          airdropAmount: 3200,
          startAt: "2026-04-20T10:00:00.000Z",
          airdropAt: "2026-04-21T10:00:00.000Z",
          endAt: "2026-04-22T10:00:00.000Z"
        }
      },
      creatorCookie
    );

    expect(createResponse.status).toBe(200);
    const createPayload = (await createResponse.json()) as {
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

    expect(createPayload.errors).toBeUndefined();
    const campaignId = createPayload.data?.createCampaign.campaign.id;
    expect(campaignId).toBeTruthy();
    expect(createPayload.data?.createCampaign.campaign.moderationStatus).toBe("PENDING");

    const viewerBeforeApproval = await postGraphql(
      {
      query: `
        query CampaignById($campaignId: UUID!) {
          allCampaigns(condition: { id: $campaignId }) {
            nodes {
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
      viewerCookie
    );

    expect(viewerBeforeApproval.status).toBe(200);
    const viewerBeforePayload = (await viewerBeforeApproval.json()) as {
      data?: {
        allCampaigns: {
          nodes: Array<{ id: string }>;
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(viewerBeforePayload.errors).toBeUndefined();
    expect(viewerBeforePayload.data?.allCampaigns.nodes).toHaveLength(0);

    const creatorApprovalAttempt = await postGraphql(
      {
        query: `
          mutation ApproveCampaign($campaignId: UUID!) {
            approveCampaign(input: { campaignId: $campaignId }) {
              campaign {
                id
              }
            }
          }
        `,
        variables: {
          campaignId
        }
      },
      creatorCookie
    );

    expect(creatorApprovalAttempt.status).toBe(200);
    const creatorApprovalPayload = (await creatorApprovalAttempt.json()) as {
      data?: {
        approveCampaign: unknown;
      };
      errors?: Array<{
        message: string;
        path?: string[];
        extensions?: {
          code?: string;
        };
      }>;
    };

    expect(creatorApprovalPayload.data?.approveCampaign ?? null).toBeNull();
    expect(creatorApprovalPayload.errors?.length ?? 0).toBeGreaterThan(0);
    expect(creatorApprovalPayload.errors?.[0]?.path).toContain("approveCampaign");

    const managerApproval = await postGraphql(
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

    expect(managerApproval.status).toBe(200);
    await expect(managerApproval.json()).resolves.toMatchObject({
      data: {
        approveCampaign: {
          campaign: {
            id: campaignId,
            moderationStatus: "APPROVED"
          }
        }
      }
    });

    const viewerAfterApproval = await postGraphql(
      {
      query: `
        query CampaignById($campaignId: UUID!) {
          allCampaigns(condition: { id: $campaignId }) {
            nodes {
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
      viewerCookie
    );

    expect(viewerAfterApproval.status).toBe(200);
    await expect(viewerAfterApproval.json()).resolves.toMatchObject({
      data: {
        allCampaigns: {
          nodes: [
            {
              id: campaignId,
              moderationStatus: "APPROVED"
            }
          ]
        }
      }
    });
  });
});
