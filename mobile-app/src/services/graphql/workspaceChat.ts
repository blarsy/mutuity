import type { BidWorkspaceItem } from "../../screens/bids/types";
import type { ChatDetailConversation } from "../../screens/chat/ChatDetailScreen";
import type { NeedClaimItem } from "./needs";
import {
  findNeedConversation,
  findResourceConversation,
  startClaimConversation,
  startNeedConversation,
  startResourceConversation,
  type ChatConversationKind
} from "./chat";

export type WorkspaceConversation =
  | { id: string; kind: ChatConversationKind }
  | { id: null; kind: ChatConversationKind; draft: ChatDetailConversation; receivedClaimId?: string };

export async function openBidChat(bid: BidWorkspaceItem, accountId: string): Promise<WorkspaceConversation> {
  const conversationId = bid.conversationId ?? await findResourceConversation({
    resourceId: bid.resourceId,
    ownerAccountId: bid.direction === "received" ? accountId : bid.counterpartyAccountId,
    bidderAccountId: bid.direction === "sent" ? accountId : bid.counterpartyAccountId
  });
  if (conversationId) return { id: conversationId, kind: "resource" };
  return {
    id: null,
    kind: "resource",
    draft: {
      id: `draft-bid-${bid.id}`,
      otherAccountId: bid.counterpartyAccountId,
      otherAccountDisplayName: bid.counterpartyDisplayName,
      otherAccountAvatarUrl: bid.counterpartyAvatarUrl ?? null,
      linkedResourceId: bid.resourceId,
      linkedResourceTitle: bid.title,
      linkedResourceImageUrl: bid.listingImageUrl ?? null
    }
  };
}

export async function openClaimChat(
  claim: NeedClaimItem,
  direction: "sent" | "received",
  accountId: string
): Promise<WorkspaceConversation> {
  const creatorAccountId = direction === "received" ? accountId : claim.ownerAccountId;
  const claimerAccountId = direction === "sent" ? accountId : claim.claimerAccountId;
  if (!creatorAccountId || !claimerAccountId) throw new Error("Missing claim participants");
  const conversationId = claim.conversationId ?? await findNeedConversation({
    needId: claim.needId,
    creatorAccountId,
    claimerAccountId
  });
  if (conversationId) return { id: conversationId, kind: "need" };
  return {
    id: null,
    kind: "need",
    ...(direction === "received" ? { receivedClaimId: claim.id } : {}),
    draft: {
      id: `draft-claim-${claim.id}`,
      otherAccountId: direction === "received" ? claimerAccountId : creatorAccountId,
      otherAccountDisplayName: (direction === "received" ? claim.claimerDisplayName : claim.ownerDisplayName) ?? "Conversation",
      otherAccountAvatarUrl: direction === "received" ? claim.claimerAvatarUrl : claim.ownerAvatarUrl,
      linkedResourceId: claim.needId,
      linkedResourceTitle: claim.needTitle,
      linkedResourceImageUrl: claim.needImageUrl
    }
  };
}

export async function sendWorkspaceFirstMessage(
  conversation: Extract<WorkspaceConversation, { id: null }>,
  messageText: string,
  imageUrl?: string | null
): Promise<WorkspaceConversation> {
  const { draft } = conversation;
  if (!draft.linkedResourceId || !draft.otherAccountId) throw new Error("Missing conversation context");
  const message = { messageText, ...(imageUrl ? { imageUrl } : {}) };
  const id = conversation.kind === "resource"
    ? await startResourceConversation({ resourceId: draft.linkedResourceId, otherAccountId: draft.otherAccountId, ...message })
    : conversation.receivedClaimId
      ? await startClaimConversation({ needClaimId: conversation.receivedClaimId, ...message })
      : await startNeedConversation({ needId: draft.linkedResourceId, ...message });
  return { id, kind: conversation.kind };
}