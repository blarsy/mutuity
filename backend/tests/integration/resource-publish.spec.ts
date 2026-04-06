import {
  TEST_BACKEND_URL,
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
          expiresAt: "2026-05-10T12:00:00.000Z"
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
});
