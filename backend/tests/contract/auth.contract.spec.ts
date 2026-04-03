import { TEST_BACKEND_URL, getSessionCookie, seedDemoAccount } from "../integration/auth-test-helpers";

jest.setTimeout(30000);

describe("auth HTTP contract", () => {
  it("exposes the expected login and session response shape", async () => {
    const account = await seedDemoAccount();

    const sessionResponse = await fetch(`${TEST_BACKEND_URL}/auth/session`);
    expect(sessionResponse.status).toBe(200);
    await expect(sessionResponse.json()).resolves.toEqual({
      authenticated: false,
      account: null,
      role: "anonymous",
      expiresAt: null
    });

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
    expect(sessionCookie).toContain("mutuity_session=");

    await expect(loginResponse.json()).resolves.toMatchObject({
      authenticated: true,
      role: account.role,
      account: {
        id: account.accountId,
        externalSubject: account.identifier,
        displayName: account.displayName
      }
    });
  });
});
