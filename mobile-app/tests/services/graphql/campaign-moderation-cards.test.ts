import { apolloClient } from "../../../src/services/graphql/client";
import { fetchCampaignNeedTriage, fetchCampaignResourceTriage } from "../../../src/services/graphql/campaignModeration";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: { query: jest.fn(), mutate: jest.fn() }
}));

const relation = {
  campaignId: "campaign-1",
  submissionId: "submission-1",
  status: "PENDING",
  isCurrent: true,
  submittedAt: "2026-01-01",
  rejectionNote: null,
  campaignByCampaignId: { title: "Campaign", startAt: "2026-01-01", endAt: "2099-01-01" }
};

beforeEach(() => jest.clearAllMocks());

it("loads the need search-card metadata from the joined listing", async () => {
  jest.mocked(apolloClient.query).mockResolvedValueOnce({ data: { allCampaignNeeds: { nodes: [{
    ...relation,
    needId: "need-1",
    needByNeedId: {
      title: "Garden help", intensity: "SHARING", proposedTopesAmount: 125,
      imageUrls: [null, "", "https://example.com/need.jpg"],
      createdAt: "2026-11-01T10:00:00Z",
      accountByCreatorAccountId: { displayName: "Alice" }
    }
  }] } } } as never);
  expect(await fetchCampaignNeedTriage("campaign-1")).toEqual([expect.objectContaining({
    needId: "need-1", title: "Garden help", proposedTokens: 125,
    imageUrls: ["https://example.com/need.jpg"], createdAt: "2026-11-01T10:00:00Z", creatorDisplayName: "Alice"
  })]);
});

it("loads the resource search-card metadata and gift/exchange flags", async () => {
  jest.mocked(apolloClient.query).mockResolvedValueOnce({ data: { allCampaignResources: { nodes: [{
    ...relation,
    resourceId: "resource-1",
    resourceByResourceId: {
      title: "Garden tools", location: "Town", defaultTokenAmount: null,
      imageUrls: ["https://example.com/resource.jpg"], createdAt: "2026-11-02T10:00:00Z",
      canBeGiven: true, canBeExchanged: false,
      accountByCreatorAccountId: { displayName: "Bob" }
    }
  }] } } } as never);
  expect(await fetchCampaignResourceTriage("campaign-1")).toEqual([expect.objectContaining({
    resourceId: "resource-1", title: "Garden tools", creatorDisplayName: "Bob",
    imageUrls: ["https://example.com/resource.jpg"], createdAt: "2026-11-02T10:00:00Z",
    canBeGifted: true, canBeExchanged: false
  })]);
});

it("safely handles a listing that is no longer visible", async () => {
  jest.mocked(apolloClient.query).mockResolvedValueOnce({ data: { allCampaignResources: { nodes: [{
    ...relation, resourceId: "resource-1", resourceByResourceId: null
  }] } } } as never);
  expect(await fetchCampaignResourceTriage("campaign-1")).toEqual([expect.objectContaining({
    title: null, imageUrls: [], creatorDisplayName: null, createdAt: null, canBeGifted: false, canBeExchanged: false
  })]);
});

it.each(["need", "resource"])("retains rejected %s decisions and their timestamps while hiding superseded applications", async (kind) => {
  const connection = kind === "need" ? "allCampaignNeeds" : "allCampaignResources";
  jest.mocked(apolloClient.query).mockResolvedValueOnce({ data: { [connection]: { nodes: [
    { ...relation, status: "REJECTED", isCurrent: false, actedAt: "2026-01-02T11:30:00Z", needId: "need-1", resourceId: "resource-1" },
    { ...relation, status: "SUPERSEDED", isCurrent: false, needId: "old-need", resourceId: "old-resource" }
  ] } } } as never);
  const items = await (kind === "need" ? fetchCampaignNeedTriage : fetchCampaignResourceTriage)("campaign-1");
  expect(items).toHaveLength(1);
  expect(items[0]).toMatchObject({ status: "REJECTED", actedAt: "2026-01-02T11:30:00Z" });
});
