import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn(),
    mutate: jest.fn()
  }
}));

import { fetchLinkableCampaigns, fetchMyCampaigns, fetchInspirationCampaigns, fetchCampaignById, updateCampaignById, type CampaignUpdateInput } from "../../../src/services/graphql/campaigns";
import { CampaignModerationStatus } from "../../../src/services/graphql/generated";
import { Kind, print, type DocumentNode } from "graphql";

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
      airdropAmount: 4750, rewardsMultiplier: 9, managerNoteFromCreator: "Please review the new schedule."
    };
    jest.mocked(apolloClient.query).mockReset();
    jest.mocked(apolloClient.query).mockResolvedValue({
      data: source === "detail" ? { campaignById: campaign } : { allCampaigns: { nodes: [campaign] } }
    });
    const result = source === "mine" ? (await fetchMyCampaigns("creator")).campaigns[0]
      : source === "inspiration" ? (await fetchInspirationCampaigns())[0]
      : await fetchCampaignById("campaign-1");
    const query = jest.mocked(apolloClient.query).mock.calls[0]![0].query;
    expect(campaignFields(query)).toEqual(expect.arrayContaining([
      "airdropAmount", "rewardsMultiplier", "createdAt", "creatorAccountId", "description",
      ...(source !== "inspiration" ? ["managerNoteFromCreator"] : [])
    ]));
    expect(result).toMatchObject({ airdropAmount: 4750, rewardsMultiplier: 9, createdAt: campaign.createdAt });
  });
});

describe("updateCampaignById", () => {
  it("saves through the creator-authorized moderation function with the complete edit", async () => {
    const input: CampaignUpdateInput = {
      title: "Community garden revised",
      theme: "Food security",
      description: "Grow together and share the harvest.",
      imageUrl: null,
      startAt: "2026-08-10T00:00:00.000Z",
      airdropAt: "2026-08-20T00:00:00.000Z",
      endAt: "2026-09-10T00:00:00.000Z",
      rewardsMultiplier: 7,
      airdropAmount: 4500,
      managerNoteFromCreator: "Updated as requested."
    };
    (apolloClient.mutate as jest.Mock).mockResolvedValue({
      data: {
        updateCampaignForModeration: {
          campaign: {
            id: "campaign-1",
            title: input.title,
            theme: input.theme,
            description: input.description,
            imageUrl: input.imageUrl,
            createdAt: "2026-08-01T12:34:00.000Z",
            creatorAccountId: "creator",
            moderationStatus: CampaignModerationStatus.AwaitingAdaptation,
            startAt: input.startAt,
            airdropAt: input.airdropAt,
            endAt: input.endAt,
            rewardsMultiplier: input.rewardsMultiplier,
            airdropAmount: input.airdropAmount,
            managerNoteFromCreator: input.managerNoteFromCreator
          }
        }
      }
    });

    const result = await updateCampaignById("campaign-1", input);
    const [mutationCall] = (apolloClient.mutate as jest.Mock).mock.calls[0]!;

    expect(print(mutationCall.mutation)).toContain("updateCampaignForModeration");
    expect(mutationCall.variables).toEqual({
      input: {
        pCampaignId: "campaign-1",
        pTitle: input.title,
        pTheme: input.theme,
        pDescription: input.description,
        pStartAt: input.startAt,
        pAirdropAt: input.airdropAt,
        pEndAt: input.endAt,
        pRewardsMultiplier: input.rewardsMultiplier,
        pAirdropAmount: input.airdropAmount,
        pManagerNoteFromCreator: input.managerNoteFromCreator,
        pImageUrl: null
      }
    });
    expect(result).toMatchObject({
      id: "campaign-1",
      title: input.title,
      moderationStatus: CampaignModerationStatus.AwaitingAdaptation
    });
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
