import { parseSocialCallbackPayload, parseSocialCallbackPayloadFromUrl, type SocialCallbackPayload } from "../src/services/socialAuth/callback";
import { buildSocialAuthStartUrl } from "../src/services/socialAuth/start";

describe("social auth callback parsing", () => {
  it("parses success callbacks and preserves the session token", () => {
    const payload = parseSocialCallbackPayload({
      provider: "google",
      status: "success",
      next: "/my-hub",
      sessionToken: "social-session-token",
      accountId: "123e4567-e89b-12d3-a456-426614174000"
    } as Partial<SocialCallbackPayload> as SocialCallbackPayload);

    expect(payload.status).toBe("success");
    expect(payload.provider).toBe("google");
    expect(payload.sessionToken).toBe("social-session-token");
    expect(payload.accountId).toBe("123e4567-e89b-12d3-a456-426614174000");
    expect(payload.nextDestination).toBe("MyHub");
  });

  it("parses registration-required callbacks with pending registration data", () => {
    const payload = parseSocialCallbackPayload({
      provider: "apple",
      status: "register_required",
      next: "/campaigns",
      pendingRegistrationToken: "pending-registration-token",
      email: "jane@example.com",
      name: "Jane Doe",
      providerSubject: "subject-123"
    } as Partial<SocialCallbackPayload> as SocialCallbackPayload);

    expect(payload.status).toBe("register_required");
    expect(payload.pendingRegistrationToken).toBe("pending-registration-token");
    expect(payload.email).toBe("jane@example.com");
    expect(payload.name).toBe("Jane Doe");
    expect(payload.providerSubject).toBe("subject-123");
  });

  it("infers the provider from the callback route and preserves the session token", () => {
    const payload = parseSocialCallbackPayloadFromUrl("topela://auth/apple/callback?status=success&sessionToken=abc123&next=%2Fmy-hub");

    expect(payload?.provider).toBe("apple");
    expect(payload?.status).toBe("success");
    expect(payload?.sessionToken).toBe("abc123");
    expect(payload?.nextDestination).toBe("MyHub");
  });
});

describe("social auth start URL building", () => {
  it("builds a backend-owned social start URL with the next destination", () => {
    const url = buildSocialAuthStartUrl("google", "/my-hub");

    expect(url).toContain("/auth/google/start");
    expect(url).toContain("next=%2Fmy-hub");
  });
});
