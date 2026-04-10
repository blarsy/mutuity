import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  getSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  const loginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      identifier: account.identifier,
      password: account.password
    })
  });

  expect(loginResponse.status).toBe(200);

  return getSessionCookie(loginResponse);
}

describe("profile and resource milestone rewards", () => {
  it("grants each profile completion reward at most once per account lifetime", async () => {
    const stamp = Date.now();
    const account = await seedDemoAccount({
      identifier: `profile-rewards-${stamp}@example.com`,
      displayName: "Profile Reward Tester"
    });
    const sessionCookie = await loginAs(account);

    const firstResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation UpdateProfile($id: UUID!, $patch: AccountPatch!) {
            updateAccountById(input: { id: $id, accountPatch: $patch }) {
              account {
                id
                displayName
                bio
                location
                avatarUrl
                profileLinks
              }
            }
          }
        `,
        variables: {
          id: account.accountId,
          patch: {
            displayName: "Profile Reward Tester",
            bio: "Helping nearby people with time and tools.",
            location: "Tournai",
            avatarUrl: "https://example.com/avatar-one.png",
            profileLinks: [
              {
                url: "https://example.com/profile",
                label: "Main website",
                type: "website"
              },
              {
                url: "https://instagram.com/profile-reward-tester",
                label: "Instagram",
                type: "instagram"
              }
            ]
          }
        }
      })
    });

    expect(firstResponse.status).toBe(200);

    await expect(firstResponse.json()).resolves.toMatchObject({
      data: {
        updateAccountById: {
          account: {
            id: account.accountId,
            bio: "Helping nearby people with time and tools.",
            location: "Tournai",
            avatarUrl: "https://example.com/avatar-one.png",
            profileLinks: [
              {
                url: "https://example.com/profile",
                label: "Main website",
                type: "website"
              },
              {
                url: "https://instagram.com/profile-reward-tester",
                label: "Instagram",
                type: "instagram"
              }
            ]
          }
        }
      }
    });

    const secondResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation UpdateProfile($id: UUID!, $patch: AccountPatch!) {
            updateAccountById(input: { id: $id, accountPatch: $patch }) {
              account {
                id
              }
            }
          }
        `,
        variables: {
          id: account.accountId,
          patch: {
            bio: "Updated bio after the reward was already earned.",
            location: "Lille",
            avatarUrl: "https://example.com/avatar-two.png",
            profileLinks: [
              {
                url: "https://x.com/profile-reward-tester",
                label: "X profile",
                type: "x"
              },
              {
                url: "https://facebook.com/profile-reward-tester",
                label: "Facebook page",
                type: "facebook"
              }
            ]
          }
        }
      })
    });

    expect(secondResponse.status).toBe(200);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type in (
              'profile_first_avatar_reward',
              'profile_first_bio_reward',
              'profile_first_location_reward',
              'profile_first_link_reward'
            )
          group by event_type
          order by event_type asc
        `,
        [account.accountId]
      );

      expect(rewardCounts.rows).toEqual([
        { event_type: "profile_first_avatar_reward", count: "1" },
        { event_type: "profile_first_bio_reward", count: "1" },
        { event_type: "profile_first_link_reward", count: "1" },
        { event_type: "profile_first_location_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });

  it("grants first resource image and default Topes rewards at most once per resource lifetime", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-rewards-${stamp}@example.com`,
      displayName: "Resource Reward Tester"
    });
    const sessionCookie = await loginAs(creator);

    const publishResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation PublishResource(
            $title: String!
            $location: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $intensity: NeedIntensity!
            $defaultTokenAmount: Int
            $imageUrls: [String!]
          ) {
            publishResource(
              input: {
                title: $title
                location: $location
                latitude: $latitude
                longitude: $longitude
                intensity: $intensity
                defaultTokenAmount: $defaultTokenAmount
                imageUrls: $imageUrls
                isProduct: true
                isService: false
                canBeGiven: true
                canBeExchanged: true
                canBeTakenAway: true
                canBeDelivered: false
              }
            ) {
              resource {
                id
                imageUrls
                defaultTokenAmount
              }
            }
          }
        `,
        variables: {
          title: `Rewarded Resource ${stamp}`,
          location: "Tournai centre",
          latitude: 50.6072,
          longitude: 3.3889,
          intensity: "SHARING",
          defaultTokenAmount: 250,
          imageUrls: ["https://example.com/resource-first-image.png"]
        }
      })
    });

    expect(publishResponse.status).toBe(200);

    const publishJson = await publishResponse.json();
    expect(publishJson).toMatchObject({
      data: {
        publishResource: {
          resource: {
            defaultTokenAmount: 250,
            imageUrls: ["https://example.com/resource-first-image.png"]
          }
        }
      }
    });

    const resourceId = publishJson?.data?.publishResource?.resource?.id as string;
    expect(resourceId).toBeTruthy();

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      await client.query(
        `
          update app_public.resource
          set image_urls = array['https://example.com/resource-first-image.png', 'https://example.com/resource-second-image.png'],
              default_token_amount = 300
          where id = $1
        `,
        [resourceId]
      );

      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and reference_id = $2
            and event_type in (
              'resource_first_image_reward',
              'resource_first_default_token_amount_reward'
            )
          group by event_type
          order by event_type asc
        `,
        [creator.accountId, resourceId]
      );

      expect(rewardCounts.rows).toEqual([
        { event_type: "resource_first_default_token_amount_reward", count: "1" },
        { event_type: "resource_first_image_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });
});
