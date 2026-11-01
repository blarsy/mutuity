import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn()
  }
}));

import { fetchLinkableCampaigns, fetchMyCampaigns, fetchInspirationCampaigns, fetchCampaignById } from "../../../src/services/graphql/campaigns";
import { Kind, type DocumentNode } from "graphql";

function campaignFields(query: DocumentNode): string[] {
  const operation = query.definitions.find(definition => definition.kind === Kind.OPERATION_DEFINITION);
  if (!operation || operation.kind !== Kind.OPERATION_DEFINITION) return [];
  const root = operation.selectionSet.selections.find(selection => selection.kind === Kind.FIELD);
  if (!root || root.kind !== Kind.FIELD) return [];
  const nodes = root.selectionSet?.selections.find(selection => selection.kind === Kind.FIELD && selection.name.value === "nodes");
  const selections = nodes?.kind === Kind.FIELD ? nodes.selectionSet?.selections : root.selectionSet?.selections;
  return (selections ?? []).flatMap(selection => selection.kind === Kind.FIELD ? [selection.name.value] : []);
}

describe("campaign detail rewards data", () => {
  it.each(["mine", "inspiration", "detail"])("requests and preserves the actual rewards for %s campaigns", async source => {
    const campaign = {
      id: "campaign-1", title: "Community garden", description: "Grow together",
      createdAt: "2026-08-01T12:34:00Z", creatorAccountId: "creator",
      airdropAmount: 4750, rewardsMultiplier: 9
    };
    jest.mocked(apolloClient.query).mockReset();
    jest.mocked(apolloClient.query).mockResolvedValue({
      data: source === "detail" ? { campaignById: campaign } : { allCampaigns: { nodes: [campaign] } }
    });
    const result = source === "mine" ? (await fetchMyCampaigns("creator")).campaigns[0]
      : source === "inspiration" ? (await fetchInspirationCampaigns())[0]
      : await fetchCampaignById("campaign-1");
    const query = jest.mocked(apolloClient.query).mock.calls[0]![0].query;
    expect(campaignFields(query)).toEqual(expect.arrayContaining(["airdropAmount", "rewardsMultiplier", "createdAt", "creatorAccountId", "description"]));
    expect(result).toMatchObject({ airdropAmount: 4750, rewardsMultiplier: 9, createdAt: campaign.createdAt });
  });
});

describe("fetchLinkableCampaigns", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns campaigns from the GraphQL payload even when dates are future or invalid", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({
      data: {
        linkableCampaigns: {
          nodes: [
            {
              id: "campaign-1",
              title: "Spring drive",
              startAt: "2099-01-01T00:00:00Z",
              endAt: "2099-01-02T00:00:00Z"
            },
            {
              id: "campaign-2",
              title: "Autumn relaunch",
              startAt: "",
              endAt: "not-a-date"
            }
          ]
        }
      }
    });

    const campaigns = await fetchLinkableCampaigns();

    expect(campaigns).toEqual([
      { id: "campaign-1", title: "Spring drive" },
      { id: "campaign-2", title: "Autumn relaunch" }
    ]);
  });

  it("filters missing IDs and absent or blank titles without altering valid titles", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({
      data: {
        linkableCampaigns: {
          nodes: [
            null,
            { id: null, title: "Missing ID" },
            { id: "missing-title" },
            { id: "null-title", title: null },
            { id: "blank-title", title: "  " },
            { id: "valid", title: " Valid title " }
          ]
        }
      }
    });

    expect(await fetchLinkableCampaigns()).toEqual([{ id: "valid", title: " Valid title " }]);
  });
});
