import { handleAppleCallback } from "../../src/auth/appleCallback";
import { signSocialAuthState } from "../../src/auth/socialState";
import * as appleSigninAuth from "apple-signin-auth";

jest.mock("apple-signin-auth", () => ({
  getClientSecret: jest.fn().mockReturnValue("apple-client-secret"),
  getAuthorizationToken: jest.fn(),
  verifyIdToken: jest.fn()
}));

describe("handleAppleCallback", () => {
  const stateSecret = "test-social-state-secret";
  const clientId = "apple-client-id";
  const teamId = "apple-team-id";
  const keyId = "apple-key-id";
  const privateKey = "apple-private-key";
  const callbackUrl = "http://localhost:5050/auth/apple/callback";

  const getAuthorizationTokenMock = appleSigninAuth.getAuthorizationToken as jest.Mock;
  const verifyIdTokenMock = appleSigninAuth.verifyIdToken as jest.Mock;

  beforeEach(() => {
    getAuthorizationTokenMock.mockReset();
    verifyIdTokenMock.mockReset();
  });

  function createPoolMock(
    resolution: "subject_match" | "password_reset_required" | "explicit_link_required" | "no_match",
    accountId?: string
  ) {
    return {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            account_id: accountId ?? null,
            resolution
          }
        ]
      })
    } as unknown as Parameters<typeof handleAppleCallback>[0]["pool"];
  }

  it("returns success for subject_match", async () => {
    const pool = createPoolMock("subject_match", "7b15d747-2f5c-4078-9d7c-6a453734ce7a");
    const state = signSocialAuthState({ next: "/dashboard", nonce: "nonce-1" }, stateSecret);

    getAuthorizationTokenMock.mockResolvedValue({ id_token: "apple-id-token" });
    verifyIdTokenMock.mockResolvedValue({
      sub: "apple-subject-1",
      email: "person@example.com",
      email_verified: "true",
      nonce: "nonce-1"
    });

    const result = await handleAppleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl,
      userPayload: JSON.stringify({
        name: {
          firstName: "Person",
          lastName: "Example"
        }
      })
    });

    expect(result).toMatchObject({
      kind: "success",
      accountId: "7b15d747-2f5c-4078-9d7c-6a453734ce7a",
      nextDestination: "/dashboard",
      name: "Person Example"
    });
  });

  it("returns link_confirmation_required for explicit link resolution", async () => {
    const pool = createPoolMock("explicit_link_required");
    const state = signSocialAuthState({ next: "/profile", nonce: "nonce-2" }, stateSecret);

    getAuthorizationTokenMock.mockResolvedValue({ id_token: "apple-id-token" });
    verifyIdTokenMock.mockResolvedValue({
      sub: "apple-subject-2",
      email: "link@example.com",
      email_verified: "true",
      nonce: "nonce-2"
    });

    const result = await handleAppleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "link_confirmation_required",
      nextDestination: "/profile",
      email: "link@example.com"
    });
  });

  it("returns register_required for no_match", async () => {
    const pool = createPoolMock("no_match");
    const state = signSocialAuthState({ next: "/", nonce: "nonce-3" }, stateSecret);

    getAuthorizationTokenMock.mockResolvedValue({ id_token: "apple-id-token" });
    verifyIdTokenMock.mockResolvedValue({
      sub: "apple-subject-3",
      email: "new@example.com",
      email_verified: "true",
      nonce: "nonce-3"
    });

    const result = await handleAppleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "register_required",
      nextDestination: "/",
      email: "new@example.com"
    });
  });

  it("returns password_reset_required when matched account requires reset", async () => {
    const pool = createPoolMock("password_reset_required", "7b15d747-2f5c-4078-9d7c-6a453734ce7a");
    const state = signSocialAuthState({ next: "/", nonce: "nonce-reset-required" }, stateSecret);

    getAuthorizationTokenMock.mockResolvedValue({ id_token: "apple-id-token" });
    verifyIdTokenMock.mockResolvedValue({
      sub: "apple-subject-reset-required",
      email: "reset-required@example.com",
      email_verified: "true",
      nonce: "nonce-reset-required"
    });

    const result = await handleAppleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "password_reset_required",
      nextDestination: "/",
      email: "reset-required@example.com"
    });
  });

  it("returns error for invalid state", async () => {
    const pool = createPoolMock("no_match");

    const result = await handleAppleCallback({
      pool,
      code: "oauth-code",
      state: "invalid-state",
      stateSecret,
      clientId,
      teamId,
      keyId,
      privateKey,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "error",
      nextDestination: "/"
    });
    expect(getAuthorizationTokenMock).not.toHaveBeenCalled();
  });
});
