import { TEST_BACKEND_URL } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("need create authentication", () => {
  it("returns sanitized UNAUTHENTICATED error for anonymous createNeed mutation", async () => {
    const response = await fetch(`${TEST_BACKEND_URL}/graphql`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        query: `
          mutation CreateNeed($title: String!, $location: String!, $intensity: NeedIntensity!) {
            createNeed(input: { title: $title, location: $location, intensity: $intensity }) {
              need {
                id
              }
            }
          }
        `,
        variables: {
          title: "Anonymous need",
          location: "Tournai",
          intensity: "SHARING"
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
