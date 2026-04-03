import {
  TEST_BACKEND_URL,
  expireSessionsForAccount,
  getSessionCookie,
  seedDemoAccount
} from "./auth-test-helpers";

jest.setTimeout(30000);

describe("auth session lifecycle", () => {
  it("restores the current session from the auth cookie", async () => {
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

    const sessionResponse = await fetch(`${TEST_BACKEND_URL}/auth/session`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        id: account.accountId,
        externalSubject: account.identifier,
        displayName: account.displayName
      }
    });

    await expireSessionsForAccount(account.accountId);

    const expiredSessionResponse = await fetch(`${TEST_BACKEND_URL}/auth/session`, {
      headers: {
        Cookie: sessionCookie
      }
    });

    expect(expiredSessionResponse.status).toBe(200);
    await expect(expiredSessionResponse.json()).resolves.toMatchObject({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });
  });
});
