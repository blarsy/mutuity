import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn()
  }
}));

import { fetchTokenHistoryPage } from "../../../src/services/graphql/economics";

describe("fetchTokenHistoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns items sorted by createdAt descending with pagination info", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({
      data: {
        allTokenMovements: {
          nodes: [
            {
              id: "m-1",
              amountDelta: 20,
              eventType: "profile_first_avatar_reward",
              createdAt: "2026-07-28T14:00:00.000Z"
            },
            {
              id: "m-2",
              amountDelta: -30,
              eventType: "resource_bid_reserved",
              createdAt: "2026-07-29T09:00:00.000Z"
            }
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: "cursor-2"
          }
        }
      }
    });

    const page = await fetchTokenHistoryPage("account-1", 10);

    expect(page.items.map((item) => item.id)).toEqual(["m-2", "m-1"]);
    expect(page.items[0]).toEqual(
      expect.objectContaining({
        eventType: "resource_bid_reserved",
        tokenChange: -30
      })
    );
    expect(page.hasNextPage).toBe(true);
    expect(page.endCursor).toBe("cursor-2");
  });

  it("passes the after cursor when provided", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({
      data: {
        allTokenMovements: {
          nodes: [],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        }
      }
    });

    await fetchTokenHistoryPage("account-1", 10, "cursor-1");

    expect(apolloClient.query).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: expect.objectContaining({
          condition: { accountId: "account-1" },
          first: 10,
          after: "cursor-1"
        })
      })
    );
  });
});