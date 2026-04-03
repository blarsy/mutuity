import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("auth login flow", () => {
  it("returns anonymous session without a cookie and authenticates valid credentials", async () => {
    await seedDemoAccount();

    const anonymousResponse = await fetch(`${TEST_BACKEND_URL}/auth/session`);
    expect(anonymousResponse.status).toBe(200);
    await expect(anonymousResponse.json()).resolves.toMatchObject({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });

    const invalidResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifier: "demo@example.com",
        password: "wrong-password"
      })
    });

    expect(invalidResponse.status).toBe(401);
    await expect(invalidResponse.json()).resolves.toEqual({
      message: "Unable to sign in with those credentials."
    });

    const loginResponse = await fetch(`${TEST_BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        identifier: "demo@example.com",
        password: "password123"
      })
    });

    expect(loginResponse.status).toBe(200);
    expect(() => getSessionCookie(loginResponse)).not.toThrow();
    await expect(loginResponse.json()).resolves.toMatchObject({
      authenticated: true,
      role: "identified_account",
      account: {
        externalSubject: "demo@example.com",
        displayName: "Demo User"
      }
    });
  });
});
