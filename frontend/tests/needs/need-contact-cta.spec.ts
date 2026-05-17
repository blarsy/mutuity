import { buildNeedContactLoginHref, shouldShowNeedContactCta } from "../../src/features/needs/needCta";

describe("need contact cta", () => {
  it("builds login href with encoded need return route", () => {
    expect(buildNeedContactLoginHref("need-123")).toBe("/login?next=%2Fneeds%2Fneed-123");
  });

  it("shows CTA to guests and non-owner authenticated users", () => {
    expect(
      shouldShowNeedContactCta({
        authenticated: false,
        viewerAccountId: null,
        creatorAccountId: "creator-1"
      })
    ).toBe(true);

    expect(
      shouldShowNeedContactCta({
        authenticated: true,
        viewerAccountId: "viewer-1",
        creatorAccountId: "creator-1"
      })
    ).toBe(true);
  });

  it("hides CTA when the creator is viewing their own need", () => {
    expect(
      shouldShowNeedContactCta({
        authenticated: true,
        viewerAccountId: "creator-1",
        creatorAccountId: "creator-1"
      })
    ).toBe(false);
  });
});