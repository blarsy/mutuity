import {
  buildAccountPageMeta,
  buildCampaignPageMeta,
  buildNeedPageMeta,
  canonicalUrlForPath,
  plainText,
  resolveAccountAvailabilityState,
  resolveCampaignAvailabilityState,
  resolveNeedAvailabilityState
} from "../../src/features/shared/publicPageSeo";

describe("public page seo helpers", () => {
  it("normalizes HTML to plain text for metadata", () => {
    expect(plainText("<p>Hello&nbsp;<strong>world</strong></p>")).toBe("Hello world");
  });

  it("builds canonical urls from route path", () => {
    expect(canonicalUrlForPath("/needs/abc")).toBe("http://localhost:3000/needs/abc");
  });

  it("uses campaign description as sole metadata source", () => {
    const meta = buildCampaignPageMeta({
      campaignId: "c1",
      campaignTitle: "Campaign title",
      campaignDescription: "Plain campaign summary"
    });

    expect(meta.title).toBe("Campaign title");
    expect(meta.description).toBe("Plain campaign summary");
    expect(meta.canonicalUrl).toBe("http://localhost:3000/campaigns/c1");
  });

  it("builds metadata fallback chains for need and account", () => {
    const needMeta = buildNeedPageMeta({
      needId: "n1",
      needTitle: null,
      needDescription: null
    });
    const accountMeta = buildAccountPageMeta({
      accountId: "a1",
      displayName: null,
      bio: null
    });

    expect(needMeta.title).toBe("Need");
    expect(needMeta.description).toBe("Need details on Mutuity");
    expect(accountMeta.title).toBe("Account");
    expect(accountMeta.description).toBe("Account on Mutuity");
  });

  it("resolves availability states for need, campaign, and account", () => {
    expect(resolveNeedAvailabilityState(null)).toBe("NOT_FOUND_OR_HIDDEN");
    expect(resolveNeedAvailabilityState({ isActive: false, expiresAt: null })).toBe("VISIBLE_DELETED");
    expect(resolveNeedAvailabilityState({ isActive: true, expiresAt: "2000-01-01T00:00:00.000Z" })).toBe(
      "VISIBLE_ENDED"
    );

    expect(resolveCampaignAvailabilityState(null)).toBe("NOT_FOUND_OR_HIDDEN");
    expect(
      resolveCampaignAvailabilityState({
        startAt: "2000-01-01T00:00:00.000Z",
        endAt: "2000-01-02T00:00:00.000Z"
      })
    ).toBe("VISIBLE_ENDED");

    expect(resolveAccountAvailabilityState(null)).toBe("NOT_FOUND_OR_HIDDEN");
    expect(resolveAccountAvailabilityState({ externalSubject: "deleted-abc" })).toBe("VISIBLE_DELETED");
    expect(resolveAccountAvailabilityState({ externalSubject: "oauth|normal" })).toBe("VISIBLE_ACTIVE");
  });
});