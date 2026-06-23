import { handleGoogleCallback } from "../../src/auth/googleCallback";
import { signSocialAuthState } from "../../src/auth/socialState";

describe("handleGoogleCallback", () => {
  const stateSecret = "test-social-state-secret";
  const clientId = "google-client-id";
  const clientSecret = "google-client-secret";
  const callbackUrl = "http://localhost:5050/auth/google/callback";

  const fetchMock = jest.spyOn(globalThis, "fetch");

  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterAll(() => {
    fetchMock.mockRestore();
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
    } as unknown as Parameters<typeof handleGoogleCallback>[0]["pool"];
  }

  it("returns success for subject_match", async () => {
    const pool = createPoolMock("subject_match", "7b15d747-2f5c-4078-9d7c-6a453734ce7a");
    const state = signSocialAuthState({ next: "/dashboard" }, stateSecret);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token-value" })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aud: clientId,
          sub: "google-subject-1",
          email: "person@example.com",
          email_verified: "true",
          name: "Person Example"
        })
      } as Response);

    const result = await handleGoogleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      clientSecret,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "success",
      accountId: "7b15d747-2f5c-4078-9d7c-6a453734ce7a",
      nextDestination: "/dashboard"
    });
  });

  it("returns link_confirmation_required for explicit link resolution", async () => {
    const pool = createPoolMock("explicit_link_required");
    const state = signSocialAuthState({ next: "/profile" }, stateSecret);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token-value" })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aud: clientId,
          sub: "google-subject-2",
          email: "link@example.com",
          email_verified: "true",
          name: "Link Needed"
        })
      } as Response);

    const result = await handleGoogleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      clientSecret,
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
    const state = signSocialAuthState({ next: "/" }, stateSecret);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token-value" })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aud: clientId,
          sub: "google-subject-3",
          email: "new@example.com",
          email_verified: "true",
          name: "New Person"
        })
      } as Response);

    const result = await handleGoogleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      clientSecret,
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
    const state = signSocialAuthState({ next: "/" }, stateSecret);

    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id_token: "id-token-value" })
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          aud: clientId,
          sub: "google-subject-reset-required",
          email: "reset-required@example.com",
          email_verified: "true",
          name: "Reset Required"
        })
      } as Response);

    const result = await handleGoogleCallback({
      pool,
      code: "oauth-code",
      state,
      stateSecret,
      clientId,
      clientSecret,
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

    const result = await handleGoogleCallback({
      pool,
      code: "oauth-code",
      state: "invalid-state",
      stateSecret,
      clientId,
      clientSecret,
      callbackUrl
    });

    expect(result).toMatchObject({
      kind: "error",
      nextDestination: "/"
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
