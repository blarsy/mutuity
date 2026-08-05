import {
  buildMobileSocialCallbackUrl,
  normalizeMobileSocialCallbackNextDestination,
  normalizeSocialAuthCallbackContext,
  resolveDefaultFrontendBaseUrl,
  resolveDefaultMobileAppBaseUrl,
  resolveLocalUrl
} from "../../src/auth/socialCallback";

describe("mobile social callback contract builder", () => {
  it("normalizes unsafe next destinations to a safe absolute path", () => {
    expect(normalizeMobileSocialCallbackNextDestination("javascript:alert(1)")).toBe("/");
    expect(normalizeMobileSocialCallbackNextDestination("/my-hub")).toBe("/my-hub");
  });

  it("builds a structured callback URL for registration-required outcomes", () => {
    const callbackUrl = buildMobileSocialCallbackUrl(
      "google",
      {
        status: "register_required",
        nextDestination: "/campaigns",
        email: "new@example.com",
        name: "New User",
        providerSubject: "provider-subject",
        pendingRegistrationToken: "signed-token"
      },
      "https://mutuity.example"
    );

    expect(callbackUrl.pathname).toBe("/auth/google/callback");
    expect(callbackUrl.searchParams.get("status")).toBe("register_required");
    expect(callbackUrl.searchParams.get("next")).toBe("/campaigns");
    expect(callbackUrl.searchParams.get("email")).toBe("new@example.com");
    expect(callbackUrl.searchParams.get("providerSubject")).toBe("provider-subject");
    expect(callbackUrl.searchParams.get("pendingRegistrationToken")).toBe("signed-token");
  });

  it("propagates the account id to the mobile callback contract on success", () => {
    const callbackUrl = buildMobileSocialCallbackUrl(
      "google",
      {
        status: "success",
        nextDestination: "/my-hub",
        sessionToken: "social-session-token",
        accountId: "123e4567-e89b-12d3-a456-426614174000"
      },
      "https://mutuity.example"
    );

    expect(callbackUrl.searchParams.get("sessionToken")).toBe("social-session-token");
    expect(callbackUrl.searchParams.get("accountId")).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("defaults web callback base URL to localhost frontend", () => {
    expect(resolveDefaultFrontendBaseUrl()).toBe("http://localhost:3000");
  });

  it("keeps a configured frontend URL", () => {
    expect(resolveDefaultFrontendBaseUrl({ FRONTEND_URL: "https://mutuity.example" })).toBe("https://mutuity.example");
  });

  it("defaults mobile callback base URL to deep link", () => {
    expect(resolveDefaultMobileAppBaseUrl()).toBe("topela://");
  });

  it("supports overriding mobile callback base URL", () => {
    expect(resolveDefaultMobileAppBaseUrl({ MOBILE_APP_URL: "topela-staging://" })).toBe("topela-staging://");
    expect(resolveDefaultMobileAppBaseUrl({ SOCIAL_AUTH_MOBILE_CALLBACK_URL: "myapp://" })).toBe("myapp://");
  });

  it("normalizes unsupported callback contexts to web", () => {
    expect(normalizeSocialAuthCallbackContext("mobile")).toBe("mobile");
    expect(normalizeSocialAuthCallbackContext("web")).toBe("web");
    expect(normalizeSocialAuthCallbackContext("unknown")).toBe("web");
  });

  it("preserves localhost OAuth callback URLs so adb reverse can be used", () => {
    expect(resolveLocalUrl("http://localhost:5050/auth/google/callback", "http://10.0.2.2:5050/auth/google/callback", { NODE_ENV: "development" })).toBe("http://localhost:5050/auth/google/callback");
    expect(resolveLocalUrl("http://localhost:5050/auth/google/callback", "http://10.0.2.2:5050/auth/google/callback", { NODE_ENV: "production" })).toBe("http://localhost:5050/auth/google/callback");
  });
});
