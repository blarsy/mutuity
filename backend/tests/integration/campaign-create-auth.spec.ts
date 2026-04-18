import { TEST_BACKEND_URL } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("campaign create authentication", () => {
  it("returns sanitized UNAUTHENTICATED error for anonymous createCampaign mutation", async () => {
    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
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
              }
            }
          }
        `,
        variables: {
          title: "Anonymous campaign",
          theme: "mutual aid",
          rewardsMultiplier: 5,
          airdropAmount: 3000,
          startAt: "2026-04-10T10:00:00.000Z",
          airdropAt: "2026-04-11T10:00:00.000Z",
          endAt: "2026-04-12T10:00:00.000Z"
        }
      })
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      errors: [
        {
          message: "You must sign in to continue.",
          extensions: {
            code: "UNAUTHENTICATED"
          }
        }
      ]
    });
  });
});
