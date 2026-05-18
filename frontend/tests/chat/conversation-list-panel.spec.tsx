import { getAutoOpenConversation } from "../../src/features/chat/ConversationListPanel";

describe("getAutoOpenConversation", () => {
  const conversations = [
    {
      conversationKind: "resource" as const,
      conversationId: "conv-1",
      contextId: "res-1",
      contextTitle: "First conversation",
      otherAccountId: "account-1",
      otherAccountDisplayName: "Alex",
      lastMessagePreview: "Hello",
      unreadCount: 0,
      lastActivityAt: "2024-01-01T12:00:00.000Z"
    },
    {
      conversationKind: "need" as const,
      conversationId: "conv-2",
      contextId: "need-1",
      contextTitle: "Second conversation",
      otherAccountId: "account-2",
      otherAccountDisplayName: "Blair",
      lastMessagePreview: "Hi",
      unreadCount: 1,
      lastActivityAt: "2024-01-01T11:00:00.000Z"
    }
  ];

  it("returns the first conversation when nothing is selected and search is empty", () => {
    expect(getAutoOpenConversation(conversations, null, false, "")).toBe(conversations[0]);
  });

  it("returns null when a conversation is already selected", () => {
    expect(getAutoOpenConversation(conversations, "conv-2", false, "")).toBeNull();
  });

  it("returns null when a draft is selected", () => {
    expect(getAutoOpenConversation(conversations, null, true, "")).toBeNull();
  });

  it("returns null when search is active", () => {
    expect(getAutoOpenConversation(conversations, null, false, "garden")).toBeNull();
  });
});
