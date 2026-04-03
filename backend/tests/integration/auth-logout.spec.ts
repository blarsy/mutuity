import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "./auth-test-helpers";

jest.setTimeout(30000);

describe("auth logout flow", () => {
  it("revokes the current session and returns the user to anonymous state", async () => {
    const account = await seedDemoAccount();

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
    const sessionCookie = getSessionCookie(loginResponse);

    const logoutResponse = await fetch(`${TEST_BACKEND_URL}/auth/logout`, {
      method: "POST",
      headers: {
        Cookie: sessionCookie
      }
    });

    expect(logoutResponse.status).toBe(200);
    await expect(logoutResponse.json()).resolves.toMatchObject({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });

    const sessionResponse = await fetch(`${TEST_BACKEND_URL}/auth/session`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });
  });
});
