import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    mutate: jest.fn(),
    query: jest.fn()
  }
}));

import { findResourceConversation, startResourceConversation } from "../../../src/services/graphql/chat";
import {
  RESOURCE_CONVERSATION_LOOKUP_QUERY,
  SEND_RESOURCE_MESSAGE_DIRECT_MUTATION
} from "../../../src/services/graphql/operations";

describe("resource conversation entry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns an existing conversation without sending a message", async () => {
    (apolloClient.query as jest.Mock).mockResolvedValue({
      data: {
        resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId: { id: "conversation-1" }
      }
    });

    await expect(findResourceConversation({
      resourceId: "resource-1",
      ownerAccountId: "owner-1",
      bidderAccountId: "bidder-1"
    })).resolves.toBe("conversation-1");

    expect(apolloClient.query).toHaveBeenCalledWith({
      query: RESOURCE_CONVERSATION_LOOKUP_QUERY,
      variables: {
        resourceId: "resource-1",
        ownerAccountId: "owner-1",
        bidderAccountId: "bidder-1"
      },
      fetchPolicy: "network-only"
    });
    expect(apolloClient.mutate).not.toHaveBeenCalled();
  });

  it("creates the conversation with the user's first message", async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({
      data: {
        sendResourceMessageDirect: {
          resourceMessage: { id: "message-1", conversationId: "conversation-1" },
          resourceConversationByConversationId: { id: "conversation-1" }
        }
      }
    });

    await expect(startResourceConversation({
      resourceId: "resource-1",
      otherAccountId: "owner-1",
      messageText: "Is this still available?",
      imageUrl: "file:///photo.jpg"
    })).resolves.toBe("conversation-1");

    expect(apolloClient.mutate).toHaveBeenCalledWith({
      mutation: SEND_RESOURCE_MESSAGE_DIRECT_MUTATION,
      variables: {
        input: {
          pResourceId: "resource-1",
          pOtherAccountId: "owner-1",
          pBody: "Is this still available?",
          pImageUrls: ["file:///photo.jpg"]
        }
      }
    });
  });
});