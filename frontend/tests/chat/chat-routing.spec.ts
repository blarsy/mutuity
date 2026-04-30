import { conversationContextUrl, conversationThreadUrl } from "../../src/features/chat/chatRouting";

describe("chat conversation routing", () => {
  it("builds the thread URL with kind and conversationId as query params", () => {
    expect(conversationThreadUrl("need", "conv-111")).toBe("/chat?kind=need&id=conv-111");
    expect(conversationThreadUrl("resource", "conv-222")).toBe("/chat?kind=resource&id=conv-222");
  });

  it("builds the context entity URL for navigation back from a conversation header", () => {
    expect(conversationContextUrl("need", "need-abc")).toBe("/needs/need-abc");
    expect(conversationContextUrl("resource", "resource-xyz")).toBe("/resources/resource-xyz");
  });

  it("handles uppercase GraphQL enum values returned by PostGraphile", () => {
    // PostGraphile returns enum values in UPPERCASE; helpers normalise before comparison
    expect(conversationThreadUrl("NEED", "conv-333")).toBe("/chat?kind=NEED&id=conv-333");
    expect(conversationContextUrl("RESOURCE", "res-444")).toBe("/resources/res-444");
    expect(conversationContextUrl("NEED", "need-555")).toBe("/needs/need-555");
  });
});
