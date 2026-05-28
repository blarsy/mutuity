import { resolveSocialCallbackOutcome } from "../../src/features/auth/socialCallback";

describe("social callback outcome resolver", () => {
  it("normalizes next destination and provider", () => {
    const result = resolveSocialCallbackOutcome("google", {
      next: "/campaigns/abc",
      provider: "apple"
    });

    expect(result.nextDestination).toBe("/campaigns/abc");
    expect(result.provider).toBe("google");
  });

  it("forces external next values to root for safety", () => {
    const result = resolveSocialCallbackOutcome("apple", {
      next: "https://attacker.test/hijack"
    });

    expect(result.nextDestination).toBe("/");
  });

  it("routes to explicit registration when callback requires confirmation", () => {
    const result = resolveSocialCallbackOutcome("google", {
      status: "link_confirmation_required",
      email: "person@example.com",
      name: "Person Example"
    });

    expect(result.shouldRedirectToRegister).toBe(true);
    expect(result.registerPrefillHref).toBe(
      "/register?provider=google&email=person%40example.com&name=Person+Example"
    );
  });

  it("keeps callback errors visible and avoids implicit registration redirect", () => {
    const result = resolveSocialCallbackOutcome("apple", {
      status: "register_required",
      error: "Provider callback failed"
    });

    expect(result.errorMessage).toBe("Provider callback failed");
    expect(result.shouldRedirectToRegister).toBe(true);
  });
});
