import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    mutate: jest.fn(),
    query: jest.fn()
  }
}));

import { findNeedConversation, startNeedConversation } from "../../../src/services/graphql/chat";
import { CLAIM_CONVERSATION_LOOKUP_QUERY, SEND_NEED_MESSAGE_MUTATION } from "../../../src/services/graphql/operations";

describe("need conversation entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing conversation without sending a message", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({
      data: {
        claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: { id: "conversation-1" }
      }
    });

    await expect(findNeedConversation({
      needId: "need-1",
      creatorAccountId: "creator-1",
      claimerAccountId: "claimer-1"
    })).resolves.toBe("conversation-1");

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: CLAIM_CONVERSATION_LOOKUP_QUERY,
      variables: {
        needId: "need-1",
        creatorAccountId: "creator-1",
        claimerAccountId: "claimer-1"
      },
      fetchPolicy: "network-only"
    });
    expect(apolloClient.mutate).not.toHaveBeenCalled();
  });

  it("creates the conversation with the user's first message", async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({
      data: {
        sendNeedMessage: {
          claimMessage: {
            id: "message-1",
            conversationId: "conversation-1"
          }
        }
      }
    });

    await expect(startNeedConversation({
      needId: "need-1",
      messageText: "Hello, I can help."
    })).resolves.toBe("conversation-1");

    expect(apolloClient.mutate).toHaveBeenCalledWith({
      mutation: SEND_NEED_MESSAGE_MUTATION,
      variables: {
        input: {
          pNeedId: "need-1",
          pBody: "Hello, I can help.",
          pImageUrls: []
        }
      }
    });
  });
});