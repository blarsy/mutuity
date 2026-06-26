import { Client } from "pg";

import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

describe("need milestone rewards", () => {
  it("grants first-image reward on INSERT when need is created with images", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-image-insert-${stamp}@example.com`,
      displayName: "Need Image Insert Tester"
    });
    const sessionCookie = await loginAs(creator);

    const createResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed(
            $title: String!
            $location: String!
            $intensity: NeedIntensity!
            $imageUrls: [String!]
          ) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                imageUrls: $imageUrls
                objectRequired: true
                competenceRequired: false
                toolingRequired: false
                multiplePeopleRequired: false
              }
            ) {
              need {
                id
                imageUrls
              }
            }
          }
        `,
        variables: {
          title: `Need Image Insert ${stamp}`,
          location: "Tournai",
          intensity: "SHARING",
          imageUrls: ["https://example.com/need-first-image.png"]
        }
      })
    });

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    expect(createJson.data?.createNeed?.need?.imageUrls).toEqual([
      "https://example.com/need-first-image.png"
    ]);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'need_first_image_reward'
          group by event_type
          order by event_type asc
        `,
        [creator.accountId]
      );

      expect(rewardCounts.rows).toEqual([
        { event_type: "need_first_image_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });

  it("grants first-default-token-amount reward on INSERT when need is created with a Topes amount", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-topes-insert-${stamp}@example.com`,
      displayName: "Need Topes Insert Tester"
    });
    const sessionCookie = await loginAs(creator);

    const createResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed(
            $title: String!
            $location: String!
            $intensity: NeedIntensity!
            $proposedTopesAmount: Int
          ) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                proposedTopesAmount: $proposedTopesAmount
                objectRequired: true
                competenceRequired: false
                toolingRequired: false
                multiplePeopleRequired: false
              }
            ) {
              need {
                id
                proposedTopesAmount
              }
            }
          }
        `,
        variables: {
          title: `Need Topes Insert ${stamp}`,
          location: "Tournai",
          intensity: "SHARING",
          proposedTopesAmount: 500
        }
      })
    });

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    expect(createJson.data?.createNeed?.need?.proposedTopesAmount).toBe(500);

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and event_type = 'need_first_default_token_amount_reward'
          group by event_type
          order by event_type asc
        `,
        [creator.accountId]
      );

      expect(rewardCounts.rows).toEqual([
        { event_type: "need_first_default_token_amount_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });

  it("grants both rewards on INSERT when need is created with images and a Topes amount", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-both-insert-${stamp}@example.com`,
      displayName: "Need Both Insert Tester"
    });
    const sessionCookie = await loginAs(creator);

    const createResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed(
            $title: String!
            $location: String!
            $intensity: NeedIntensity!
            $proposedTopesAmount: Int
            $imageUrls: [String!]
          ) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                proposedTopesAmount: $proposedTopesAmount
                imageUrls: $imageUrls
                objectRequired: true
                competenceRequired: false
                toolingRequired: false
                multiplePeopleRequired: false
              }
            ) {
              need {
                id
              }
            }
          }
        `,
        variables: {
          title: `Need Both Insert ${stamp}`,
          location: "Tournai",
          intensity: "SHARING",
          proposedTopesAmount: 500,
          imageUrls: ["https://example.com/need-both.png"]
        }
      })
    });

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    const needId = createJson.data?.createNeed?.need?.id as string;
    expect(needId).toBeTruthy();

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and reference_id = $2
            and event_type in (
              'need_first_image_reward',
              'need_first_default_token_amount_reward'
            )
          group by event_type
          order by event_type asc
        `,
        [creator.accountId, needId]
      );

      expect(rewardCounts.rows).toEqual([
        { event_type: "need_first_default_token_amount_reward", count: "1" },
        { event_type: "need_first_image_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });

  it("grants rewards on UPDATE when need initially has no images or Topes", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-update-${stamp}@example.com`,
      displayName: "Need Update Tester"
    });
    const sessionCookie = await loginAs(creator);

    // Create a need WITHOUT images and WITHOUT Topes amount
    const createResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed(
            $title: String!
            $location: String!
            $intensity: NeedIntensity!
          ) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                objectRequired: true
                competenceRequired: false
                toolingRequired: false
                multiplePeopleRequired: false
              }
            ) {
              need {
                id
              }
            }
          }
        `,
        variables: {
          title: `Need Update ${stamp}`,
          location: "Tournai",
          intensity: "SHARING"
        }
      })
    });

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    const needId = createJson.data?.createNeed?.need?.id as string;
    expect(needId).toBeTruthy();

    // Verify no rewards were issued on creation
    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      const beforeUpdate = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and reference_id = $2
            and event_type in (
              'need_first_image_reward',
              'need_first_default_token_amount_reward'
            )
          group by event_type
        `,
        [creator.accountId, needId]
      );
      expect(beforeUpdate.rows).toEqual([]);

      // Now update the need via SQL to add both images and Topes amount
      await client.query(
        `
          update app_public.need
          set image_urls = array['https://example.com/need-updated.png'],
              proposed_topes_amount = 500
          where id = $1
        `,
        [needId]
      );

      const afterUpdate = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and reference_id = $2
            and event_type in (
              'need_first_image_reward',
              'need_first_default_token_amount_reward'
            )
          group by event_type
          order by event_type asc
        `,
        [creator.accountId, needId]
      );

      expect(afterUpdate.rows).toEqual([
        { event_type: "need_first_default_token_amount_reward", count: "1" },
        { event_type: "need_first_image_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });

  it("does not grant duplicate rewards on repeated updates", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `need-dup-${stamp}@example.com`,
      displayName: "Need Dup Tester"
    });
    const sessionCookie = await loginAs(creator);

    // Create a need WITH both images and Topes amount so rewards fire on INSERT
    const createResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed(
            $title: String!
            $location: String!
            $intensity: NeedIntensity!
            $proposedTopesAmount: Int
            $imageUrls: [String!]
          ) {
            createNeed(
              input: {
                title: $title
                location: $location
                intensity: $intensity
                proposedTopesAmount: $proposedTopesAmount
                imageUrls: $imageUrls
                objectRequired: true
                competenceRequired: false
                toolingRequired: false
                multiplePeopleRequired: false
              }
            ) {
              need {
                id
              }
            }
          }
        `,
        variables: {
          title: `Need Dup ${stamp}`,
          location: "Tournai",
          intensity: "SHARING",
          proposedTopesAmount: 500,
          imageUrls: ["https://example.com/need-dup-first.png"]
        }
      })
    });

    expect(createResponse.status).toBe(200);
    const createJson = await createResponse.json();
    const needId = createJson.data?.createNeed?.need?.id as string;
    expect(needId).toBeTruthy();

    const client = new Client({ connectionString: TEST_DATABASE_URL });
    await client.connect();

    try {
      // Update with a second image and changed Topes amount — should NOT trigger new rewards
      await client.query(
        `
          update app_public.need
          set image_urls = array['https://example.com/need-dup-first.png', 'https://example.com/need-dup-second.png'],
              proposed_topes_amount = 750
          where id = $1
        `,
        [needId]
      );

      // Second update — still no new rewards
      await client.query(
        `
          update app_public.need
          set image_urls = array['https://example.com/need-dup-first.png', 'https://example.com/need-dup-second.png', 'https://example.com/need-dup-third.png'],
              proposed_topes_amount = 999
          where id = $1
        `,
        [needId]
      );

      const rewardCounts = await client.query<{ event_type: string; count: string }>(
        `
          select event_type, count(*)::text as count
          from app_public.token_movement
          where account_id = $1
            and reference_id = $2
            and event_type in (
              'need_first_image_reward',
              'need_first_default_token_amount_reward'
            )
          group by event_type
          order by event_type asc
        `,
        [creator.accountId, needId]
      );

      // Still exactly one of each
      expect(rewardCounts.rows).toEqual([
        { event_type: "need_first_default_token_amount_reward", count: "1" },
        { event_type: "need_first_image_reward", count: "1" }
      ]);
    } finally {
      await client.end();
    }
  });
});