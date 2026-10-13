import { findNeedConversation, findResourceConversation, startClaimConversation, startNeedConversation, startResourceConversation } from "../../src/services/graphql/chat";
import { openBidChat, openClaimChat, sendWorkspaceFirstMessage } from "../../src/services/graphql/workspaceChat";
import { NeedClaimStatus } from "../../src/services/graphql/generated";
import type { NeedClaimItem } from "../../src/services/graphql/needs";
import type { BidWorkspaceItem } from "../../src/screens/bids/types";

jest.mock("../../src/services/graphql/chat", () => ({
  findNeedConversation: jest.fn(), findResourceConversation: jest.fn(),
  startClaimConversation: jest.fn(), startNeedConversation: jest.fn(), startResourceConversation: jest.fn()
}));

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(startResourceConversation).mockResolvedValue("created-resource");
  jest.mocked(startNeedConversation).mockResolvedValue("created-need");
  jest.mocked(startClaimConversation).mockResolvedValue("created-claim");
});

describe.each(["sent", "received"] as const)("%s workspace chat", (direction) => {
  const currentAccountId = direction === "sent" ? "sender" : "owner";
  const bid: BidWorkspaceItem = {
    id: "bid", direction, status: "EXPIRED", title: "Tools", resourceId: "resource",
    counterpartyAccountId: direction === "sent" ? "owner" : "sender", counterpartyDisplayName: "Other",
    conversationId: null, tokenAmount: 100, isActive: false, updatedAt: null
  };
  const claim: NeedClaimItem = {
    id: "claim", needId: "need", needTitle: "Repairs", needImageUrl: null,
    conversationId: null, message: null, createdAt: null, updatedAt: null, status: NeedClaimStatus.Declined,
    ownerAccountId: "owner", ownerDisplayName: "Owner", ownerAvatarUrl: null,
    claimerAccountId: "sender", claimerDisplayName: "Sender", claimerAvatarUrl: null
  };

  it("finds resource chat by listing and participant pair, including chats not attached to the bid", async () => {
    jest.mocked(findResourceConversation).mockResolvedValue("existing-resource");
    expect(await openBidChat(bid, currentAccountId)).toEqual({ id: "existing-resource", kind: "resource" });
    expect(findResourceConversation).toHaveBeenCalledWith({ resourceId: "resource", ownerAccountId: "owner", bidderAccountId: "sender" });
    expect(startResourceConversation).not.toHaveBeenCalled();
  });

  it("finds need chat by listing and participant pair, including closed claims", async () => {
    jest.mocked(findNeedConversation).mockResolvedValue("existing-need");
    expect(await openClaimChat(claim, direction, currentAccountId)).toEqual({ id: "existing-need", kind: "need" });
    expect(findNeedConversation).toHaveBeenCalledWith({ needId: "need", creatorAccountId: "owner", claimerAccountId: "sender" });
    expect(startClaimConversation).not.toHaveBeenCalled();
    expect(startNeedConversation).not.toHaveBeenCalled();
  });

  it("opens a resource draft without creating chat and creates it on the first message", async () => {
    jest.mocked(findResourceConversation).mockResolvedValue(null);
    const conversation = await openBidChat(bid, currentAccountId);
    expect(conversation.id).toBeNull();
    expect(startResourceConversation).not.toHaveBeenCalled();
    if (conversation.id !== null) throw new Error("Expected draft");
    expect(conversation.draft.otherAccountId).toBe(bid.counterpartyAccountId);
    expect(await sendWorkspaceFirstMessage(conversation, "Hello", "image.jpg")).toEqual({ id: "created-resource", kind: "resource" });
    expect(startResourceConversation).toHaveBeenCalledWith({ resourceId: "resource", otherAccountId: bid.counterpartyAccountId, messageText: "Hello", imageUrl: "image.jpg" });
  });

  it("opens a need draft and uses the correct creator or claimer first-message flow", async () => {
    jest.mocked(findNeedConversation).mockResolvedValue(null);
    const conversation = await openClaimChat(claim, direction, currentAccountId);
    expect(conversation.id).toBeNull();
    expect(startNeedConversation).not.toHaveBeenCalled();
    expect(startClaimConversation).not.toHaveBeenCalled();
    if (conversation.id !== null) throw new Error("Expected draft");
    expect(conversation.draft.otherAccountId).toBe(direction === "received" ? "sender" : "owner");
    await sendWorkspaceFirstMessage(conversation, "Hello");
    if (direction === "received") {
      expect(startClaimConversation).toHaveBeenCalledWith({ needClaimId: "claim", messageText: "Hello" });
      expect(startNeedConversation).not.toHaveBeenCalled();
    } else {
      expect(startNeedConversation).toHaveBeenCalledWith({ needId: "need", messageText: "Hello" });
      expect(startClaimConversation).not.toHaveBeenCalled();
    }
  });

  it("uses an attached chat directly without another lookup", async () => {
    expect(await openBidChat({ ...bid, conversationId: "attached-bid" }, currentAccountId)).toEqual({ id: "attached-bid", kind: "resource" });
    expect(await openClaimChat({ ...claim, conversationId: "attached-claim" }, direction, currentAccountId)).toEqual({ id: "attached-claim", kind: "need" });
    expect(findResourceConversation).not.toHaveBeenCalled();
    expect(findNeedConversation).not.toHaveBeenCalled();
  });
});