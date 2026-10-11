import { apolloClient } from "../../../src/services/graphql/client";
import { fetchSearchNeeds, type SearchNeedsFilters } from "../../../src/services/graphql/needs";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: { query: jest.fn() }
}));

const filters: SearchNeedsFilters = {
  searchTerm: "",
  intensityFilters: [],
  maxProposedTokenAmount: null,
  hideClaimedNeeds: false,
  hasReferenceLocation: false,
  distanceKm: 100
};

describe("need campaign normalization", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("preserves the existing campaign or null unless a public link overrides it", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({
      data: {
        allNeeds: {
          nodes: [
            { id: "unlinked", title: "Unlinked need" },
            {
              id: "existing",
              title: "Existing campaign",
              campaignNeedsByNeedId: { nodes: [{ campaignId: "existing-campaign" }] }
            },
            {
              id: "override",
              title: "Public campaign",
              campaignNeedsByNeedId: { nodes: [{ campaignId: "old-campaign" }] }
            }
          ]
        },
        publicCampaignNeedLinks: { nodes: [{ needId: "override", campaignId: "public-campaign" }] }
      }
    });

    const needs = await fetchSearchNeeds(filters);
    expect(needs.map(({ id, campaignId }) => ({ id, campaignId }))).toStrictEqual([
      { id: "unlinked", campaignId: null },
      { id: "existing", campaignId: "existing-campaign" },
      { id: "override", campaignId: "public-campaign" }
    ]);
  });
});