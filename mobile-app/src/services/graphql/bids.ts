import { apolloClient } from "./client";
import {
  type Query,
  type QueryReceivedResourceBidsArgs,
  type QuerySentResourceBidsArgs,
  type ResourceBid
} from "./generated";
import { RECEIVED_RESOURCE_BIDS_QUERY, SENT_RESOURCE_BIDS_QUERY } from "./operations";
import type { BidWorkspaceItem } from "../../screens/bids/MyBidsScreen";

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

function toBidWorkspaceItem(node: ResourceBid, direction: "sent" | "received"): BidWorkspaceItem | null {
  if (!node.id) {
    return null;
  }

  const counterpartyDisplayName =
    direction === "sent"
      ? node.accountByRespondedByAccountId?.displayName ?? "Unknown"
      : node.accountByBidderAccountId?.displayName ?? "Unknown";

  return {
    id: String(node.id),
    direction,
    title: node.resourceByResourceId?.title ?? node.message ?? "Untitled bid",
    counterpartyDisplayName,
    tokenAmount: node.proposedTokenAmount ?? 0,
    isActive: node.isActive ?? false,
    updatedAt: typeof node.updatedAt === "string" ? node.updatedAt : null
  };
}

export async function fetchMyBids(includeInactive: boolean): Promise<BidWorkspaceItem[]> {
  const sentVariables: QuerySentResourceBidsArgs = {
    first: DEFAULT_PAGE_SIZE,
    activeOnly: includeInactive ? false : true
  };

  const receivedVariables: QueryReceivedResourceBidsArgs = {
    first: DEFAULT_PAGE_SIZE,
    activeOnly: includeInactive ? false : true
  };

  const [sentResult, receivedResult] = await Promise.all([
    apolloClient.query<SentBidsQueryResult, QuerySentResourceBidsArgs>({
      query: SENT_RESOURCE_BIDS_QUERY,
      variables: sentVariables,
      fetchPolicy: "network-only"
    }),
    apolloClient.query<ReceivedBidsQueryResult, QueryReceivedResourceBidsArgs>({
      query: RECEIVED_RESOURCE_BIDS_QUERY,
      variables: receivedVariables,
      fetchPolicy: "network-only"
    })
  ]);

  const sent = (sentResult.data?.sentResourceBids?.nodes ?? [])
    .map((node) => toBidWorkspaceItem(node, "sent"))
    .filter((node): node is BidWorkspaceItem => node !== null);

  const received = (receivedResult.data?.receivedResourceBids?.nodes ?? [])
    .map((node) => toBidWorkspaceItem(node, "received"))
    .filter((node): node is BidWorkspaceItem => node !== null);

  return [...sent, ...received].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}
