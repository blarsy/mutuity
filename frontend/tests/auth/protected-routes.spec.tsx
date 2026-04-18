import { buildLoginHref } from "../../src/features/auth/requireAuth";
import { resolveNextDestination } from "../../src/pages/login";

describe("protected route redirects", () => {
  it("builds login redirect with encoded return path", () => {
    expect(buildLoginHref("/campaigns/create?from=cta")).toBe("/login?next=%2Fcampaigns%2Fcreate%3Ffrom%3Dcta");
  });

  it("falls back to root when current path is login or missing", () => {
    expect(buildLoginHref("/login")).toBe("/login?next=%2F");
    expect(buildLoginHref(undefined)).toBe("/login?next=%2F");
  });

  it("accepts only in-app relative next destinations", () => {
    expect(resolveNextDestination("/needs?tab=mine")).toBe("/needs?tab=mine");
    expect(resolveNextDestination("https://evil.example/steal-session")).toBe("/");
    expect(resolveNextDestination("javascript:alert(1)")).toBe("/");
    expect(resolveNextDestination(42)).toBe("/");
    expect(resolveNextDestination(["/needs"])).toBe("/");
  });
});
