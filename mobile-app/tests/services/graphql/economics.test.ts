import { print } from "graphql";
import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    query: jest.fn()
  }
}));

import { fetchTokenHistoryPage } from "../../../src/services/graphql/economics";
import { TOKEN_HISTORY_QUERY } from "../../../src/services/graphql/operations";

describe("fetchTokenHistoryPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("requests newest movements before pagination so recent gifts with lower UUIDs are not buried", async () => {
    const recentGift = {
      id: "00000000-0000-4000-8000-000000000001",
      amountDelta: 50,
      eventType: "token_gift_received",
      createdAt: "2026-10-08T09:00:00.000Z"
    };
    const olderMovements = Array.from({ length: 10 }, (_, index) => ({
      id: `ffffffff-ffff-4fff-8fff-${String(index).padStart(12, "0")}`,
      amountDelta: 20,
      eventType: "profile_first_avatar_reward",
      createdAt: "2026-07-28T14:00:00.000Z"
    }));

    (apolloClient.query as jest.Mock).mockImplementation(({ query, variables }) => {
      // Model server-side ordering BEFORE slicing the page; sorting it locally is insufficient.
      expect(print(query)).toContain("orderBy: [CREATED_AT_DESC, ID_DESC]");
      const nodes = [...olderMovements, recentGift]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id))
        .slice(0, variables.first);
      return Promise.resolve({
        data: {
          allTokenMovements: {
            nodes,
            pageInfo: { hasNextPage: true, endCursor: "chronological-cursor" }
          }
        }
      });
    });

    const page = await fetchTokenHistoryPage("account-1", 10);

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: TOKEN_HISTORY_QUERY,
      variables: { condition: { accountId: "account-1" }, first: 10 },
      fetchPolicy: "network-only"
    });
    expect(page.items).toHaveLength(10);
    expect(page.items[0]).toEqual(expect.objectContaining({
      id: recentGift.id,
      eventType: "token_gift_received",
      tokenChange: 50
    }));
    expect(page.hasNextPage).toBe(true);
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
        query: TOKEN_HISTORY_QUERY,
        variables: expect.objectContaining({
          condition: { accountId: "account-1" },
          first: 10,
          after: "cursor-1"
        })
      })
    );
  });
});