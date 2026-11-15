import { apolloClient } from "./client";
import { isCurrentCampaignRelation, isUnendedCampaignRelation, type CampaignListingRelation } from "./campaignListing";
import {
  ACCEPT_CAMPAIGN_NEED_MUTATION,
  ACCEPT_CAMPAIGN_RESOURCE_MUTATION,
  CAMPAIGN_MODERATION_HISTORY_QUERY,
  CAMPAIGN_NEED_TRIAGE_QUERY,
  CAMPAIGN_RESOURCE_TRIAGE_QUERY,
  REJECT_CAMPAIGN_NEED_MUTATION,
  REJECT_CAMPAIGN_RESOURCE_MUTATION
} from "./operations";

export interface CampaignModerationEventItem {
  eventType: string;
  body: string | null;
  createdAt: string;
}

interface ListingCardMetadata {
  actedAt?: string | null;
  imageUrls?: string[];
  createdAt?: string | null;
  creatorDisplayName?: string | null;
}

/** Rejections remain readable; replaced applications are no longer reviewable. */
export function isVisibleModerationRelation(relation: CampaignListingRelation): boolean {
  return isCurrentCampaignRelation(relation) ||
    (relation.status === "REJECTED" && isUnendedCampaignRelation(relation));
}

type ListingCardFields = {
  imageUrls: Array<string | null> | null;
  createdAt: unknown;
  accountByCreatorAccountId: { displayName: string | null } | null;
};

function cardMetadata(listing: ListingCardFields | null): ListingCardMetadata {
  return {
    imageUrls: (listing?.imageUrls ?? []).filter((url): url is string => typeof url === "string" && url.length > 0),
    createdAt: listing?.createdAt == null ? null : String(listing.createdAt),
    creatorDisplayName: listing?.accountByCreatorAccountId?.displayName ?? null
  };
}

export interface CampaignNeedTriageItem extends CampaignListingRelation, ListingCardMetadata {
  needId: string;
  campaignTitle: string | null;
  title: string | null;
  intensity: string | null;
  proposedTokens: number | null;
}

export interface CampaignResourceTriageItem extends CampaignListingRelation, ListingCardMetadata {
  resourceId: string;
  campaignTitle: string | null;
  title: string | null;
  location: string | null;
  defaultTokens: number | null;
  canBeExchanged?: boolean;
  canBeGifted?: boolean;
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchCampaignModerationHistory(campaignId: string): Promise<CampaignModerationEventItem[]> {
  const { data } = await apolloClient.query<{
    campaignModerationEvents: { nodes: CampaignModerationEventItem[] } | null;
  }>({
    query: CAMPAIGN_MODERATION_HISTORY_QUERY,
    variables: { campaignId },
    fetchPolicy: "network-only"
  });

  return (data?.campaignModerationEvents?.nodes ?? [])
    .map((event) => ({
      eventType: event.eventType ?? "",
      body: event.body ?? null,
      createdAt: event.createdAt == null ? "" : String(event.createdAt)
    }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function fetchCampaignNeedTriage(campaignId: string): Promise<CampaignNeedTriageItem[]> {
  const { data } = await apolloClient.query<{
    allCampaignNeeds: { nodes: Array<CampaignListingRelation & {
      needId: string;
      actedAt?: string | null;
      needByNeedId: (ListingCardFields & { title: string; intensity: string; proposedTopesAmount: number | null }) | null;
    }> } | null;
  }>({
    query: CAMPAIGN_NEED_TRIAGE_QUERY,
    variables: { campaignId },
    fetchPolicy: "network-only"
  });

  return (data?.allCampaignNeeds?.nodes ?? []).filter(isVisibleModerationRelation).map((node) => ({
    ...node,
    ...cardMetadata(node.needByNeedId),
    campaignId: String(node.campaignId),
    needId: String(node.needId),
    status: node.status,
    campaignTitle: node.campaignByCampaignId?.title ?? null,
    title: node.needByNeedId?.title ?? null,
    intensity: node.needByNeedId?.intensity ?? null,
    proposedTokens: nullableNumber(node.needByNeedId?.proposedTopesAmount)
  }));
}

export async function fetchCampaignResourceTriage(campaignId: string): Promise<CampaignResourceTriageItem[]> {
  const { data } = await apolloClient.query<{
    allCampaignResources: { nodes: Array<CampaignListingRelation & {
      resourceId: string;
      actedAt?: string | null;
      resourceByResourceId: (ListingCardFields & { title: string; location: string | null; defaultTokenAmount: number | null; canBeExchanged: boolean; canBeGiven: boolean }) | null;
    }> } | null;
  }>({
    query: CAMPAIGN_RESOURCE_TRIAGE_QUERY,
    variables: { campaignId },
    fetchPolicy: "network-only"
  });

  return (data?.allCampaignResources?.nodes ?? []).filter(isVisibleModerationRelation).map((node) => ({
    ...node,
    ...cardMetadata(node.resourceByResourceId),
    campaignId: String(node.campaignId),
    resourceId: String(node.resourceId),
    status: node.status,
    campaignTitle: node.campaignByCampaignId?.title ?? null,
    title: node.resourceByResourceId?.title ?? null,
    location: node.resourceByResourceId?.location ?? null,
    defaultTokens: nullableNumber(node.resourceByResourceId?.defaultTokenAmount),
    canBeExchanged: node.resourceByResourceId?.canBeExchanged ?? false,
    canBeGifted: node.resourceByResourceId?.canBeGiven ?? false
  }));
}

export async function triageCampaignNeed(
  campaignId: string,
  needId: string,
  action: "accept" | "reject",
  expectedSubmissionId: string,
  rejectionNote?: string
): Promise<void> {
  if (!expectedSubmissionId) throw new Error("Submission ID is required");
  await apolloClient.mutate({
    mutation: action === "accept" ? ACCEPT_CAMPAIGN_NEED_MUTATION : REJECT_CAMPAIGN_NEED_MUTATION,
    variables: { campaignId, needId, expectedSubmissionId, ...(action === "reject" ? { rejectionNote: rejectionNote?.trim() || null } : {}) }
  });
}

export async function triageCampaignResource(
  campaignId: string,
  resourceId: string,
  action: "accept" | "reject",
  expectedSubmissionId: string,
  rejectionNote?: string
): Promise<void> {
  if (!expectedSubmissionId) throw new Error("Submission ID is required");
  await apolloClient.mutate({
    mutation: action === "accept" ? ACCEPT_CAMPAIGN_RESOURCE_MUTATION : REJECT_CAMPAIGN_RESOURCE_MUTATION,
    variables: { campaignId, resourceId, expectedSubmissionId, ...(action === "reject" ? { rejectionNote: rejectionNote?.trim() || null } : {}) }
  });
}
