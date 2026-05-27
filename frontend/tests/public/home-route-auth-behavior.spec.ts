import { shouldRedirectFromRoot, shouldRenderGuestActions } from "../../src/pages/index";

describe("root home auth behavior", () => {
  it("does not redirect while session is loading", () => {
    expect(shouldRedirectFromRoot("loading", false)).toBe(false);
    expect(shouldRedirectFromRoot("loading", true)).toBe(false);
  });

  it("redirects authenticated users to /app after bootstrap", () => {
    expect(shouldRedirectFromRoot("authenticated", true)).toBe(true);
  });

  it("keeps anonymous users on root and renders guest actions", () => {
    expect(shouldRedirectFromRoot("anonymous", false)).toBe(false);
    expect(shouldRenderGuestActions("anonymous", false)).toBe(true);
  });

  it("hides guest actions for authenticated users", () => {
    expect(shouldRenderGuestActions("authenticated", true)).toBe(false);
  });
});
