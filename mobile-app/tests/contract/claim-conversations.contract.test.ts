import { print } from "graphql";
import { apolloClient } from "../../src/services/graphql/client";
import { NeedClaimStatus } from "../../src/services/graphql/generated";
import { fetchNeedClaimsForAccount } from "../../src/services/graphql/needs";
import { RECEIVED_NEED_CLAIMS_QUERY, SENT_NEED_CLAIMS_QUERY } from "../../src/services/graphql/operations";

jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: { query: jest.fn() }
}));

const mockQuery = jest.mocked(apolloClient.query);

describe.each(["sent", "received"] as const)("%s claim conversations", (direction) => {
  beforeEach(() => mockQuery.mockReset());

  it("queries the existing conversation ID", () => {
    const document = direction === "sent" ? SENT_NEED_CLAIMS_QUERY : RECEIVED_NEED_CLAIMS_QUERY;
    expect(print(document)).toMatch(/claimConversationsByNeedClaimId\(first: 1\)\s*\{\s*nodes\s*\{\s*id/);
  });

  it.each(["conversation-1", null])("maps conversation %s without creating one", async (conversationId) => {
    const claim = {
      id: "claim-1",
      needId: "need-1",
      claimerAccountId: "claimer-1",
      status: NeedClaimStatus.Open,
      createdAt: "2026-10-11T10:00:00Z",
      claimConversationsByNeedClaimId: { nodes: conversationId ? [{ id: conversationId }] : [] }
    };
    const data = direction === "sent"
      ? { allNeedClaims: { nodes: [claim] } }
      : { allNeeds: { nodes: [{ id: "need-1", title: "Need", needClaimsByNeedId: { nodes: [claim] } }] } };
    mockQuery.mockResolvedValueOnce({ data } as never);

    const claims = await fetchNeedClaimsForAccount({ accountId: "account-1", direction });

    expect(claims).toHaveLength(1);
    expect(claims[0]?.conversationId).toBe(conversationId);
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});