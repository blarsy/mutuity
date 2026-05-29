import { SOCIAL_AUTH_PROVIDERS, getSocialAuthCallbackUrl, getSocialAuthStartUrl } from "../../src/features/auth/socialAuth";
import { resolveSocialPrefill } from "../../src/pages/register";

describe("social auth helpers", () => {
  const previousGoogleUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
  const previousAppleUrl = process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;
  const previousBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const previousGoogleCallbackUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL;
  const previousAppleRedirectUri = process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI;

  afterEach(() => {
    if (previousGoogleUrl === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL = previousGoogleUrl;
    }

    if (previousAppleUrl === undefined) {
      delete process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;
    } else {
      process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL = previousAppleUrl;
    }

    if (previousBackendUrl === undefined) {
      delete process.env.NEXT_PUBLIC_BACKEND_URL;
    } else {
      process.env.NEXT_PUBLIC_BACKEND_URL = previousBackendUrl;
    }

    if (previousGoogleCallbackUrl === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL = previousGoogleCallbackUrl;
    }

    if (previousAppleRedirectUri === undefined) {
      delete process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI;
    } else {
      process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI = previousAppleRedirectUri;
    }
  });

  it("keeps social auth providers scoped to google and apple", () => {
    expect(SOCIAL_AUTH_PROVIDERS).toEqual(["google", "apple"]);
  });

  it("returns null when provider and backend start URLs are not configured", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
    delete process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;
    delete process.env.NEXT_PUBLIC_BACKEND_URL;

    expect(getSocialAuthStartUrl("google", "/needs/create")).toBeNull();
    expect(getSocialAuthStartUrl("apple", "/needs/create")).toBeNull();
  });

  it("falls back to backend auth start endpoints when explicit provider URLs are missing", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
    delete process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:5050/";

    expect(getSocialAuthStartUrl("google", "/needs/create")).toBe(
      "http://localhost:5050/auth/google/start?next=%2Fneeds%2Fcreate"
    );
    expect(getSocialAuthStartUrl("apple", "/needs/create")).toBe(
      "http://localhost:5050/auth/apple/start?next=%2Fneeds%2Fcreate"
    );
  });

  it("builds absolute provider URL and carries next destination", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL = "https://accounts.example.test/oauth/google/start";

    const url = getSocialAuthStartUrl("google", "/campaigns/create?draft=1");

    expect(url).toBe(
      "https://accounts.example.test/oauth/google/start?next=%2Fcampaigns%2Fcreate%3Fdraft%3D1"
    );
  });

  it("extracts provider-prefill values from register query safely", () => {
    expect(
      resolveSocialPrefill({
        provider: "Google",
        name: "Alice Example",
        email: "ALICE@EXAMPLE.COM"
      })
    ).toEqual({
      provider: "google",
      suggestedName: "Alice Example",
      suggestedEmail: "ALICE@EXAMPLE.COM"
    });

    expect(resolveSocialPrefill({ provider: ["apple"], name: ["ignored"] })).toEqual({
      provider: "",
      suggestedName: "",
      suggestedEmail: ""
    });
  });

  it("resolves callback URL from dedicated callback env keys", () => {
    process.env.NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL = "https://accounts.example.test/oauth/google/callback";

    expect(getSocialAuthCallbackUrl("google")).toBe("https://accounts.example.test/oauth/google/callback");
  });

  it("falls back to redirect URI env keys for callback configuration", () => {
    process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI = "https://accounts.example.test/oauth/apple/callback";

    expect(getSocialAuthCallbackUrl("apple")).toBe("https://accounts.example.test/oauth/apple/callback");
  });
});
