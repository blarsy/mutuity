import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn()
  }
}));

import { fetchLinkableCampaigns } from "../../../src/services/graphql/campaigns";

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
});
