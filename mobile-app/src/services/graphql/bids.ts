import { apolloClient } from "./client";
import {
  type MutationCancelResourceBidArgs,
  type MutationRespondToResourceBidArgs,
  type MutationSubmitResourceBidArgs,
  type QueryReceivedResourceBidsArgs,
  type QuerySentResourceBidsArgs,
  ResourceBidStatus,
  type ResourceBid
} from "./generated";
import {
  CANCEL_RESOURCE_BID_MUTATION,
  RECEIVED_RESOURCE_BIDS_QUERY,
  RESPOND_TO_RESOURCE_BID_MUTATION,
  SENT_RESOURCE_BIDS_QUERY,
  SUBMIT_RESOURCE_BID_MUTATION
} from "./operations";
import type { BidDirection, BidWorkspaceItem } from "../../screens/bids/types";

const DEFAULT_PAGE_SIZE = 50;

interface BidsConnection {
  nodes: ResourceBid[];
}

interface SentBidsQueryResult {
  sentResourceBids: BidsConnection | null;
}

interface ReceivedBidsQueryResult {
  receivedResourceBids: BidsConnection | null;
}

interface SubmitResourceBidMutationResult {
  submitResourceBid: {
    resourceBid: {
      id: string | null;
    } | null;
  } | null;
}

interface CancelResourceBidMutationResult {
  cancelResourceBid: {
    resourceBid: {
      id: string | null;
    } | null;
  } | null;
}

interface RespondToResourceBidMutationResult {
  respondToResourceBid: {
    resourceBid: {
      id: string | null;
      status: ResourceBidStatus | null;
    } | null;
  } | null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function toBidWorkspaceItem(node: ResourceBid, direction: BidDirection): BidWorkspaceItem | null {
  if (!node.id) {
    return null;
  }

  const resourceNode = node.resourceByResourceId;
  const listingImageUrl =
    node.resourceByResourceId?.imageUrls?.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    ) ?? null;
  const conversationId = toStringOrNull(node.resourceConversationsByResourceBidId.nodes[0]?.id ?? null);

  const creatorAccountId = toStringOrNull(resourceNode?.creatorAccountId ?? null);
  const creatorDisplayName = toStringOrNull(resourceNode?.accountByCreatorAccountId?.displayName ?? null);
  const creatorAvatarUrl = toStringOrNull(resourceNode?.accountByCreatorAccountId?.avatarUrl ?? null);
  const bidderDisplayName = toStringOrNull(node.accountByBidderAccountId?.displayName ?? null);
  const bidderAvatarUrl = toStringOrNull(node.accountByBidderAccountId?.avatarUrl ?? null);
  const bidderAccountId = toStringOrNull(node.bidderAccountId);

  const counterpartyDisplayName =
    direction === "sent"
      ? creatorDisplayName ?? creatorAccountId ?? "Unknown"
      : bidderDisplayName ?? bidderAccountId ?? "Unknown";
  const counterpartyAccountId =
    direction === "sent"
      ? creatorAccountId ?? ""
      : bidderAccountId ?? "";
  const counterpartyAvatarUrl = direction === "sent" ? creatorAvatarUrl : bidderAvatarUrl;

  if (!counterpartyAccountId) {
    return null;
  }

  const resolvedResourceId = toStringOrNull(resourceNode?.id ?? node.resourceId);
  if (!resolvedResourceId) {
    return null;
  }

  return {
    id: String(node.id),
    direction,
    status: node.status,
    title: resourceNode?.title ?? node.message ?? "Untitled bid",
    counterpartyDisplayName,
    counterpartyAccountId,
    counterpartyAvatarUrl,
    resourceId: String(resolvedResourceId),
    conversationId,
    listingAuthorDisplayName: counterpartyDisplayName,
    listingAuthorAvatarUrl: counterpartyAvatarUrl,
    listingImageUrl,
    message: node.message,
    createdAt: typeof node.createdAt === "string" ? node.createdAt : null,
    respondedAt: typeof node.respondedAt === "string" ? node.respondedAt : null,
    validUntil: typeof node.validUntil === "string" ? node.validUntil : null,
    canBeExchanged: resourceNode?.canBeExchanged ?? false,
    tokenAmount: node.proposedTokenAmount ?? resourceNode?.defaultTokenAmount ?? 0,
    isActive: node.isActive ?? false,
    updatedAt: typeof node.updatedAt === "string" ? node.updatedAt : null
  };
}

export async function fetchSentBids(includeInactive: boolean): Promise<BidWorkspaceItem[]> {
  const sentVariables: QuerySentResourceBidsArgs = {
    first: DEFAULT_PAGE_SIZE,
    activeOnly: includeInactive ? false : true
  };

  const sentResult = await apolloClient.query<SentBidsQueryResult, QuerySentResourceBidsArgs>({
    query: SENT_RESOURCE_BIDS_QUERY,
    variables: sentVariables,
    fetchPolicy: "network-only"
  });

  return (sentResult.data?.sentResourceBids?.nodes ?? [])
    .map((node) => toBidWorkspaceItem(node, "sent"))
    .filter((node): node is BidWorkspaceItem => node !== null);
}

export async function fetchReceivedBids(includeInactive: boolean): Promise<BidWorkspaceItem[]> {
  const receivedVariables: QueryReceivedResourceBidsArgs = {
    first: DEFAULT_PAGE_SIZE,
    activeOnly: includeInactive ? false : true
  };

  const receivedResult = await apolloClient.query<ReceivedBidsQueryResult, QueryReceivedResourceBidsArgs>({
    query: RECEIVED_RESOURCE_BIDS_QUERY,
    variables: receivedVariables,
    fetchPolicy: "network-only"
  });

  return (receivedResult.data?.receivedResourceBids?.nodes ?? [])
    .map((node) => toBidWorkspaceItem(node, "received"))
    .filter((node): node is BidWorkspaceItem => node !== null);
}

export async function submitResourceBid(input: {
  resourceId: string;
  proposedTokenAmount: number;
  validHours: number;
  message?: string | null;
}): Promise<string> {
  const variables: MutationSubmitResourceBidArgs = {
    input: {
      resourceId: input.resourceId,
      proposedTokenAmount: input.proposedTokenAmount,
      validHours: input.validHours,
      message: input.message ?? null
    }
  };

  const result = await apolloClient.mutate<SubmitResourceBidMutationResult, MutationSubmitResourceBidArgs>({
    mutation: SUBMIT_RESOURCE_BID_MUTATION,
    variables
  });

  const bidId = result.data?.submitResourceBid?.resourceBid?.id;

  if (!bidId) {
    throw new Error("Bid submission failed");
  }

  return String(bidId);
}

export async function cancelResourceBid(resourceBidId: string): Promise<void> {
  const variables: MutationCancelResourceBidArgs = {
    input: {
      resourceBidId
    }
  };

  const result = await apolloClient.mutate<CancelResourceBidMutationResult, MutationCancelResourceBidArgs>({
    mutation: CANCEL_RESOURCE_BID_MUTATION,
    variables
  });

  if (!result.data?.cancelResourceBid?.resourceBid?.id) {
    throw new Error("Bid cancellation failed");
  }
}

export async function respondToResourceBid(resourceBidId: string, status: "ACCEPTED" | "DECLINED"): Promise<void> {
  const statusInput = status === "ACCEPTED" ? ResourceBidStatus.Accepted : ResourceBidStatus.Declined;
  const variables: MutationRespondToResourceBidArgs = {
    input: {
      resourceBidId,
      status: statusInput
    }
  };

  const result = await apolloClient.mutate<RespondToResourceBidMutationResult, MutationRespondToResourceBidArgs>({
    mutation: RESPOND_TO_RESOURCE_BID_MUTATION,
    variables
  });

  if (!result.data?.respondToResourceBid?.resourceBid?.id) {
    throw new Error("Bid response failed");
  }
}
