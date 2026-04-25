import { getSocialAuthStartUrl } from "../../src/features/auth/socialAuth";
import { resolveSocialPrefill } from "../../src/pages/register";

describe("social auth helpers", () => {
  const previousGoogleUrl = process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
  const previousAppleUrl = process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;

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
  });

  it("returns null when provider start URLs are not configured", () => {
    delete process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL;
    delete process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL;

    expect(getSocialAuthStartUrl("google", "/needs/create")).toBeNull();
    expect(getSocialAuthStartUrl("apple", "/needs/create")).toBeNull();
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
});
