import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

type SeededCampaign = {
  id: string;
};

async function seedApprovedActiveCampaign(creatorAccountId: string, stamp: number): Promise<SeededCampaign> {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    const startAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const airdropAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const endAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await client.query<{ id: string }>(
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
        creatorAccountId,
        `Need linking ${stamp}`,
        "mutual aid",
        5,
        3000,
        startAt,
        airdropAt,
        endAt
      ]
    );

    return {
      id: result.rows[0].id
    };
  } finally {
    await client.end();
  }
}

describe("need create integration", () => {
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

  it("creates standalone need and campaign-linked pending need while enforcing Topes rules", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-creator-${stamp}@example.com`,
      displayName: "Need Creator"
    });

    const creatorCookie = await loginWithGraphqlSessionCookie(creator.identifier, creator.password);

    const standaloneResponse = await postGraphql(
      {
        query: `
          mutation CreateNeed($title: String!, $location: String!, $intensity: NeedIntensity!, $proposedTopesAmount: Int) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                proposedTopesAmount: $proposedTopesAmount
              }
            ) {
              need {
                id
                title
                intensity
                proposedTopesAmount
              }
            }
          }
        `,
        variables: {
          title: `Standalone need ${stamp}`,
          location: "Tournai",
          intensity: "SHARING",
          proposedTopesAmount: 250
        }
      },
      creatorCookie
    );

    expect(standaloneResponse.status).toBe(200);
    const standalonePayload = (await standaloneResponse.json()) as {
      data?: {
        createNeed: {
          need: {
            id: string;
            intensity: string;
            proposedTopesAmount: number;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(standalonePayload.errors).toBeUndefined();
    const standaloneNeedId = standalonePayload.data?.createNeed.need.id;
    expect(standaloneNeedId).toBeTruthy();
    expect(standalonePayload.data?.createNeed.need.intensity).toBe("SHARING");
    expect(standalonePayload.data?.createNeed.need.proposedTopesAmount).toBe(250);

    const approvedCampaign = await seedApprovedActiveCampaign(creator.accountId, stamp);

    const linkedResponse = await postGraphql(
      {
        query: `
          mutation CreateNeed($title: String!, $location: String!, $intensity: NeedIntensity!, $campaignId: UUID!) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                campaignId: $campaignId
              }
            ) {
              need {
                id
                title
              }
            }
          }
        `,
        variables: {
          title: `Linked need ${stamp}`,
          location: "Mons",
          intensity: "LEG_UP",
          campaignId: approvedCampaign.id
        }
      },
      creatorCookie
    );

    expect(linkedResponse.status).toBe(200);
    const linkedPayload = (await linkedResponse.json()) as {
      data?: {
        createNeed: {
          need: {
            id: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(linkedPayload.errors).toBeUndefined();
    const linkedNeedId = linkedPayload.data?.createNeed.need.id;
    expect(linkedNeedId).toBeTruthy();

    const relationResponse = await postGraphql(
      {
        query: `
          query LinkedNeedStatus($needId: UUID!) {
            allCampaignNeeds(condition: { needId: $needId }) {
              nodes {
                campaignId
                needId
                status
              }
            }
          }
        `,
        variables: {
          needId: linkedNeedId
        }
      },
      creatorCookie
    );

    expect(relationResponse.status).toBe(200);
    await expect(relationResponse.json()).resolves.toMatchObject({
      data: {
        allCampaignNeeds: {
          nodes: [
            {
              campaignId: approvedCampaign.id,
              needId: linkedNeedId,
              status: "PENDING"
            }
          ]
        }
      }
    });

    const invalidTopesResponse = await postGraphql(
      {
        query: `
          mutation CreateNeed($title: String!, $location: String!, $intensity: NeedIntensity!, $proposedTopesAmount: Int) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                proposedTopesAmount: $proposedTopesAmount
              }
            ) {
              need {
                id
              }
            }
          }
        `,
        variables: {
          title: `Invalid need ${stamp}`,
          location: "Lille",
          intensity: "SHARING",
          proposedTopesAmount: 80
        }
      },
      creatorCookie
    );

    expect(invalidTopesResponse.status).toBe(200);
    await expect(invalidTopesResponse.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Topes for sharing must be between 100 and 999",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        }
      ]
    });
  });
});
