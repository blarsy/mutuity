import { apolloClient } from "./client";
import {
  type MutationSubmitResourceBidArgs,
  type QueryReceivedResourceBidsArgs,
  type QuerySentResourceBidsArgs,
  type ResourceBid
} from "./generated";
import { RECEIVED_RESOURCE_BIDS_QUERY, SENT_RESOURCE_BIDS_QUERY, SUBMIT_RESOURCE_BID_MUTATION } from "./operations";
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

function toBidWorkspaceItem(node: ResourceBid, direction: BidDirection): BidWorkspaceItem | null {
  if (!node.id) {
    return null;
  }

  const listingAuthor = node.resourceByResourceId?.accountByCreatorAccountId;
  const listingImageUrl =
    node.resourceByResourceId?.imageUrls?.find(
      (value): value is string => typeof value === "string" && value.trim().length > 0
    ) ?? null;

  const counterpartyDisplayName =
    direction === "sent"
      ? node.accountByRespondedByAccountId?.displayName ?? "Unknown"
      : node.accountByBidderAccountId?.displayName ?? "Unknown";

  return {
    id: String(node.id),
    direction,
    title: node.resourceByResourceId?.title ?? node.message ?? "Untitled bid",
    counterpartyDisplayName,
    listingAuthorDisplayName: listingAuthor?.displayName ?? null,
    listingAuthorAvatarUrl: listingAuthor?.avatarUrl ?? null,
    listingImageUrl,
    tokenAmount: node.proposedTokenAmount ?? 0,
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
