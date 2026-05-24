import {
  TEST_BACKEND_URL,
  TEST_DATABASE_URL,
  loginWithGraphqlSessionCookie,
  seedDemoAccount,
  type SeededAccount
} from "./auth-test-helpers";
import { Client } from "pg";

jest.setTimeout(30000);

async function loginAs(account: SeededAccount) {
  return loginWithGraphqlSessionCookie(account.identifier, account.password);
}

async function withDbClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({
    connectionString: TEST_DATABASE_URL
  });

  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function getResourceUpdatedAtEpoch(resourceId: string) {
  return withDbClient(async client => {
    const result = await client.query<{ updated_at_epoch: string }>(
      `
        select extract(epoch from updated_at)::text as updated_at_epoch
        from app_public.resource
        where id = $1
      `,
      [resourceId]
    );

    return Number(result.rows[0]?.updated_at_epoch ?? "0");
  });
}

describe("resource publishing integration", () => {
  it("allows an authenticated account to publish a resource", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-publish-${stamp}@example.com`,
      displayName: "Resource Publisher"
    });
    const sessionCookie = await loginAs(creator);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateResource(
            $title: String!
            $description: String
            $location: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $intensity: NeedIntensity!
            $defaultTokenAmount: Int
            $categoryCodes: [Int!]
            $isProduct: Boolean!
            $isService: Boolean!
            $canBeGiven: Boolean!
            $canBeExchanged: Boolean!
            $canBeTakenAway: Boolean!
            $canBeDelivered: Boolean!
            $expiresAt: Datetime
          ) {
            publishResource(
              input: {
                title: $title
                description: $description
                location: $location
                latitude: $latitude
                longitude: $longitude
                intensity: $intensity
                defaultTokenAmount: $defaultTokenAmount
                categoryCodes: $categoryCodes
                isProduct: $isProduct
                isService: $isService
                canBeGiven: $canBeGiven
                canBeExchanged: $canBeExchanged
                canBeTakenAway: $canBeTakenAway
                canBeDelivered: $canBeDelivered
                expiresAt: $expiresAt
              }
            ) {
              resource {
                id
                creatorAccountId
                title
                description
                location
                intensity
                defaultTokenAmount
                categoryLabels
                isProduct
                isService
                canBeGiven
                canBeExchanged
                canBeTakenAway
                canBeDelivered
                expiresAt
                isActive
              }
            }
          }
        `,
        variables: {
          title: `US2 Published Resource ${stamp}`,
          description: "Fresh soup and kitchen utensils available this weekend.",
          location: "Tournai centre",
          latitude: 50.6072,
          longitude: 3.3889,
          intensity: "SHARING",
          defaultTokenAmount: 250,
          categoryCodes: [3, 7],
          isProduct: true,
          isService: false,
          canBeGiven: true,
          canBeExchanged: true,
          canBeTakenAway: true,
          canBeDelivered: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      })
    });

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      data: {
        publishResource: {
          resource: {
            creatorAccountId: creator.accountId,
            title: `US2 Published Resource ${stamp}`,
            description: "Fresh soup and kitchen utensils available this weekend.",
            location: "Tournai centre",
            intensity: "SHARING",
            defaultTokenAmount: 250,
            categoryLabels: ["Food & beverage", "Building material & tools"],
            isProduct: true,
            isService: false,
            canBeGiven: true,
            canBeExchanged: true,
            canBeTakenAway: true,
            canBeDelivered: false,
            isActive: true
          }
        }
      }
    });
  });

  it("rejects invalid publish payloads with a safe validation error", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-publish-invalid-${stamp}@example.com`,
      displayName: "Resource Validation Publisher"
    });
    const sessionCookie = await loginAs(creator);

    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation CreateInvalidResource(
            $title: String!
            $location: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $intensity: NeedIntensity!
            $defaultTokenAmount: Int
            $description: String
          ) {
            publishResource(
              input: {
                title: $title
                location: $location
                latitude: $latitude
                longitude: $longitude
                intensity: $intensity
                defaultTokenAmount: $defaultTokenAmount
                description: $description
                isProduct: true
                isService: false
                canBeGiven: true
                canBeExchanged: false
                canBeTakenAway: true
                canBeDelivered: false
              }
            ) {
              resource {
                id
              }
            }
          }
        `,
        variables: {
          title: `US2 Invalid Resource ${stamp}`,
          location: "Tournai centre",
          latitude: 50.6072,
          longitude: 3.3889,
          intensity: "LEG_UP",
          defaultTokenAmount: 250,
          description: "x".repeat(8001)
        }
      })
    });

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      errors: [
        {
          message: "Resource description must be 8000 characters or fewer",
          extensions: {
            code: "BAD_USER_INPUT"
          }
        }
      ]
    });
  });

  it("updates resource updatedAt when linked categories and images change through publishResource edit mode", async () => {
    const stamp = Date.now();
    const creator = await seedDemoAccount({
      identifier: `resource-edit-${stamp}@example.com`,
      displayName: "Resource Editor"
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
          mutation CreateResource(
            $title: String!
            $location: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $intensity: NeedIntensity!
            $categoryCodes: [Int!]
            $imageUrls: [String!]
            $isProduct: Boolean!
            $isService: Boolean!
            $canBeGiven: Boolean!
            $canBeExchanged: Boolean!
            $canBeTakenAway: Boolean!
            $canBeDelivered: Boolean!
          ) {
            publishResource(
              input: {
                title: $title
                location: $location
                latitude: $latitude
                longitude: $longitude
                intensity: $intensity
                categoryCodes: $categoryCodes
                imageUrls: $imageUrls
                isProduct: $isProduct
                isService: $isService
                canBeGiven: $canBeGiven
                canBeExchanged: $canBeExchanged
                canBeTakenAway: $canBeTakenAway
                canBeDelivered: $canBeDelivered
              }
            ) {
              resource {
                id
                categoryLabels
                imageUrls
                updatedAt
              }
            }
          }
        `,
        variables: {
          title: `Editable resource ${stamp}`,
          location: "Tournai centre",
          latitude: 50.6072,
          longitude: 3.3889,
          intensity: "SHARING",
          categoryCodes: [3],
          imageUrls: ["https://example.com/first-image.jpg"],
          isProduct: true,
          isService: false,
          canBeGiven: true,
          canBeExchanged: false,
          canBeTakenAway: true,
          canBeDelivered: false
        }
      })
    });

    expect(createResponse.status).toBe(200);

    const createPayload = (await createResponse.json()) as {
      data?: {
        publishResource?: {
          resource?: {
            id: string;
            categoryLabels: string[];
            imageUrls: string[];
            updatedAt: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(createPayload.errors).toBeUndefined();

    const resource = createPayload.data?.publishResource?.resource;
    expect(resource?.id).toBeTruthy();
    expect(resource?.categoryLabels).toEqual(["Food & beverage"]);
    expect(resource?.imageUrls).toEqual(["https://example.com/first-image.jpg"]);

    const beforeUpdateEpoch = await getResourceUpdatedAtEpoch(resource!.id);

    const updateResponse = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: sessionCookie
      },
      body: JSON.stringify({
        query: `
          mutation UpdateResource(
            $resourceId: UUID!
            $title: String!
            $location: String!
            $latitude: BigFloat!
            $longitude: BigFloat!
            $intensity: NeedIntensity!
            $categoryCodes: [Int!]
            $imageUrls: [String!]
            $isProduct: Boolean!
            $isService: Boolean!
            $canBeGiven: Boolean!
            $canBeExchanged: Boolean!
            $canBeTakenAway: Boolean!
            $canBeDelivered: Boolean!
          ) {
            publishResource(
              input: {
                resourceId: $resourceId
                title: $title
                location: $location
                latitude: $latitude
                longitude: $longitude
                intensity: $intensity
                categoryCodes: $categoryCodes
                imageUrls: $imageUrls
                isProduct: $isProduct
                isService: $isService
                canBeGiven: $canBeGiven
                canBeExchanged: $canBeExchanged
                canBeTakenAway: $canBeTakenAway
                canBeDelivered: $canBeDelivered
              }
            ) {
              resource {
                id
                categoryLabels
                imageUrls
                updatedAt
              }
            }
          }
        `,
        variables: {
          resourceId: resource!.id,
          title: `Editable resource ${stamp}`,
          location: "Tournai centre",
          latitude: 50.6072,
          longitude: 3.3889,
          intensity: "SHARING",
          categoryCodes: [7],
          imageUrls: ["https://example.com/updated-image.jpg"],
          isProduct: true,
          isService: false,
          canBeGiven: true,
          canBeExchanged: false,
          canBeTakenAway: true,
          canBeDelivered: false
        }
      })
    });

    expect(updateResponse.status).toBe(200);

    const updatePayload = (await updateResponse.json()) as {
      data?: {
        publishResource?: {
          resource?: {
            id: string;
            categoryLabels: string[];
            imageUrls: string[];
            updatedAt: string;
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    expect(updatePayload.errors).toBeUndefined();
    expect(updatePayload.data?.publishResource?.resource).toMatchObject({
      id: resource!.id,
      categoryLabels: ["Building material & tools"],
      imageUrls: ["https://example.com/updated-image.jpg"]
    });

    const afterUpdateEpoch = await getResourceUpdatedAtEpoch(resource!.id);
    expect(afterUpdateEpoch).toBeGreaterThan(beforeUpdateEpoch);
  });
});
