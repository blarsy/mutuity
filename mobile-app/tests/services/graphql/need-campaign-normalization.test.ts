import { print } from "graphql";
import { apolloClient } from "../../../src/services/graphql/client";
import { fetchSearchNeeds, type SearchNeedsFilters } from "../../../src/services/graphql/needs";
import { NeedClaimStatus, NeedIntensity } from "../../../src/services/graphql/generated";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn() } }));

const filters: SearchNeedsFilters = {
  searchTerm: "  éclair  ", currentAccountId: "viewer", distanceKm: 10,
  referenceLocation: { latitude: 50.6072, longitude: 3.3889 }
};

describe("public need search", () => {
  beforeEach(() => jest.resetAllMocks());

  it("uses server search and viewer-scoped claims, mapping public results and every campaign", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: {
      searchNeeds: { nodes: [{ id: "need", title: "Lamp", creatorDisplayName: "Éclair",
        latitude: "50.6072", longitude: "3.3889", queryLatitude: "50.6072", queryLongitude: "3.3889",
        proposedTopesAmount: 25, intensity: NeedIntensity.Sharing }] },
      allNeedClaims: { nodes: [{ needId: "need", status: NeedClaimStatus.Open }] },
      publicCampaignNeedLinks: { nodes: [
        { needId: "need", campaignId: "a" }, { needId: "need", campaignId: "b" }
      ] }
    } } as never);
    const needs = await fetchSearchNeeds(filters);
    expect(needs[0]).toMatchObject({ title: "Lamp", creatorDisplayName: "Éclair", distanceKm: 0,
      isClaimedByCurrentAccount: true, campaignId: "a", campaignIds: ["a", "b"] });
    const options = jest.mocked(apolloClient.query).mock.calls[0]![0];
    expect(options.variables).toEqual({ latitude: 50.6072, longitude: 3.3889, searchText: "éclair",
      maxDistanceKm: 10, viewerId: "viewer", includeClaims: true });
    expect(options.fetchPolicy).toBe("no-cache");
    const query = print(options.query);
    expect(query).toContain("searchNeeds(");
    expect(query).toContain("claimerAccountId: $viewerId");
    expect(query).not.toContain("needClaimsByNeedId");
    expect(query).not.toContain("allNeeds(");
  });

  it("omits claims anonymously and does not invent distances or claims", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: {
      searchNeeds: { nodes: [{ id: "need", title: "Unlocated", queryLatitude: "50", queryLongitude: "3" }] },
      publicCampaignNeedLinks: { nodes: [] }
    } } as never);
    const needs = await fetchSearchNeeds({ searchTerm: "", distanceKm: null });
    expect(needs[0]).toMatchObject({ located: false, distanceKm: Infinity,
      isClaimedByCurrentAccount: false, campaignIds: [] });
    expect(jest.mocked(apolloClient.query).mock.calls[0]![0].variables).toMatchObject({
      latitude: null, longitude: null, maxDistanceKm: null, viewerId: null, includeClaims: false
    });
  });

  it("ignores withdrawn claims and uses the server-resolved coordinates", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: {
      searchNeeds: { nodes: [{ id: "need", title: "Test", latitude: 50, longitude: 3,
        queryLatitude: 50, queryLongitude: 3 }] },
      allNeedClaims: { nodes: [{ needId: "need", status: NeedClaimStatus.Withdrawn }] },
      publicCampaignNeedLinks: { nodes: [] }
    } } as never);
    const [need] = await fetchSearchNeeds({ ...filters, referenceLocation: null });
    expect(need).toMatchObject({ distanceKm: 0, isClaimedByCurrentAccount: false });
  });
});