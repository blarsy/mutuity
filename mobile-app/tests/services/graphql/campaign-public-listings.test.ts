import { apolloClient } from "../../../src/services/graphql/client";
import { fetchCampaignPublicListings } from "../../../src/services/graphql/campaignPublicListings";
import { PUBLIC_CAMPAIGN_LISTING_LINKS_QUERY, PUBLIC_CAMPAIGN_NEED_CARD_QUERY, PUBLIC_CAMPAIGN_RESOURCE_CARD_QUERY } from "../../../src/services/graphql/operations";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn() } }));

describe("public campaign listings", () => {
  beforeEach(() => jest.mocked(apolloClient.query).mockReset());

  it("loads only links for this campaign, deduplicates them and omits unavailable listings", async () => {
    jest.mocked(apolloClient.query).mockImplementation(async (options: any) => {
      if (options.query === PUBLIC_CAMPAIGN_LISTING_LINKS_QUERY) return { data: {
        publicCampaignResourceLinks: { nodes: [
          { campaignId: "c1", resourceId: "r1" }, { campaignId: "c1", resourceId: "r1" },
          { campaignId: "c2", resourceId: "other" }, { campaignId: "c1", resourceId: "expired" }
        ] },
        publicCampaignNeedLinks: { nodes: [{ campaignId: "c1", needId: "n1" }, { campaignId: "c1", needId: "missing" }] }
      } } as any;
      const base = { id: options.variables.id, title: options.variables.id, createdAt: "2026-01-01", imageUrls: [null, "image"], isActive: true, expiresAt: null, accountByCreatorAccountId: { displayName: "Alice" } };
      if (options.query === PUBLIC_CAMPAIGN_RESOURCE_CARD_QUERY) return { data: { resourceById: {
        ...base, expiresAt: base.id === "expired" ? "2000-01-01" : null, canBeGiven: true, canBeExchanged: false
      } } } as any;
      if (options.query === PUBLIC_CAMPAIGN_NEED_CARD_QUERY) return { data: { needById: base.id === "missing" ? null : { ...base, proposedTopesAmount: 42 } } } as any;
      throw new Error("unexpected query");
    });

    const result = await fetchCampaignPublicListings("c1");
    expect(result.resources).toEqual([expect.objectContaining({ id: "r1", imageUrls: ["image"], creatorDisplayName: "Alice", canBeGifted: true })]);
    expect(result.needs).toEqual([expect.objectContaining({ id: "n1", proposedTokenAmount: 42 })]);
    expect(apolloClient.query).toHaveBeenCalledTimes(5);
    expect(jest.mocked(apolloClient.query).mock.calls.every(([call]) => call.fetchPolicy === "network-only")).toBe(true);
  });

  it("returns empty lists without querying listing details", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: { publicCampaignResourceLinks: { nodes: [] }, publicCampaignNeedLinks: { nodes: [] } } } as any);
    await expect(fetchCampaignPublicListings("c1")).resolves.toEqual({ resources: [], needs: [] });
    expect(apolloClient.query).toHaveBeenCalledTimes(1);
  });

  it("propagates failures instead of reporting an empty campaign", async () => {
    jest.mocked(apolloClient.query).mockRejectedValue(new Error("offline"));
    await expect(fetchCampaignPublicListings("c1")).rejects.toThrow("offline");
  });

  it("treats a missing links connection as a loading error", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: { publicCampaignResourceLinks: null, publicCampaignNeedLinks: { nodes: [] } } } as any);
    await expect(fetchCampaignPublicListings("c1")).rejects.toThrow("Campaign listing links unavailable");
  });
});