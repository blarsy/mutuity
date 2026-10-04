import { apolloClient } from "../../../src/services/graphql/client";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: { mutate: jest.fn(), query: jest.fn() }
}));

import { sendClaimMessage, sendResourceMessage } from "../../../src/services/graphql/chat";
import {
  SEND_CLAIM_CONVERSATION_MESSAGE_MUTATION,
  SEND_RESOURCE_CONVERSATION_MESSAGE_MUTATION
} from "../../../src/services/graphql/operations";

describe.each([
  ["claim", sendClaimMessage, SEND_CLAIM_CONVERSATION_MESSAGE_MUTATION, "sendClaimConversationMessage", "claimMessage"],
  ["resource", sendResourceMessage, SEND_RESOURCE_CONVERSATION_MESSAGE_MUTATION, "sendResourceConversationMessage", "resourceMessage"]
] as const)("validated %s conversation send", (_kind, send, mutation, field, messageField) => {
  beforeEach(() => jest.clearAllMocks());

  it("sends message and image in one function call without a client-supplied sender", async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({
      data: { [field]: { [messageField]: { id: "message", body: "Hello", createdAt: "2026-10-04T12:00:00Z" } } }
    });
    await expect(send("conversation", "untrusted-sender", " Hello ", "https://example.com/image.png")).resolves.toEqual({
      id: "message", direction: "outgoing", body: "Hello", createdAt: "2026-10-04T12:00:00Z",
      imageUrls: ["https://example.com/image.png"]
    });
    expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
    expect(apolloClient.mutate).toHaveBeenCalledWith({
      mutation, variables: { input: {
        pConversationId: "conversation", pBody: "Hello", pImageUrls: ["https://example.com/image.png"]
      } }
    });
  });

  it("propagates authorization failure without attempting image writes", async () => {
    (apolloClient.mutate as jest.Mock).mockRejectedValue(new Error("Only participants can send messages"));
    await expect(send("conversation", "sender", "Hello", "image")).rejects.toThrow("Only participants");
    expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing mutation payload", async () => {
    (apolloClient.mutate as jest.Mock).mockResolvedValue({ data: { [field]: null } });
    await expect(send("conversation", "sender", "Hello")).rejects.toThrow("Missing created message");
  });
});