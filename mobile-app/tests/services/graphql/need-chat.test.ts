import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: {
    mutate: jest.fn()
  }
}));

import { openOrCreateNeedConversation } from "../../../src/services/graphql/chat";
import { SEND_NEED_MESSAGE_MUTATION } from "../../../src/services/graphql/operations";

describe("openOrCreateNeedConversation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sends the initial message and returns the claim conversation id", async () => {
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

    await expect(openOrCreateNeedConversation({
      needId: "need-1",
      initialMessage: "Hello, I can help."
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