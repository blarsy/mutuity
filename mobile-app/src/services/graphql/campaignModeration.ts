import { apolloClient } from "./client";
import {
  AcceptCampaignNeedDocument,
  AcceptCampaignResourceDocument,
  CampaignModerationHistoryDocument,
  CampaignNeedTriageDocument,
  CampaignResourceTriageDocument,
  RejectCampaignNeedDocument,
  RejectCampaignResourceDocument
} from "./operations.generated";

export interface CampaignModerationEventItem {
  eventType: string;
  body: string | null;
  createdAt: string;
}

export interface CampaignNeedTriageItem {
  campaignId: string;
  needId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  campaignTitle: string | null;
  title: string | null;
  intensity: string | null;
  proposedTokens: number | null;
}

export interface CampaignResourceTriageItem {
  campaignId: string;
  resourceId: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  campaignTitle: string | null;
  title: string | null;
  location: string | null;
  defaultTokens: number | null;
}

function nullableNumber(value: unknown): number | null {
  if (value == null || value === "") {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function fetchCampaignModerationHistory(campaignId: string): Promise<CampaignModerationEventItem[]> {
  const { data } = await apolloClient.query({
    query: CampaignModerationHistoryDocument,
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
  const { data } = await apolloClient.query({
    query: CampaignNeedTriageDocument,
    variables: { campaignId },
    fetchPolicy: "network-only"
  });

  return (data?.allCampaignNeeds?.nodes ?? []).map((node) => ({
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
  const { data } = await apolloClient.query({
    query: CampaignResourceTriageDocument,
    variables: { campaignId },
    fetchPolicy: "network-only"
  });

  return (data?.allCampaignResources?.nodes ?? []).map((node) => ({
    campaignId: String(node.campaignId),
    resourceId: String(node.resourceId),
    status: node.status,
    campaignTitle: node.campaignByCampaignId?.title ?? null,
    title: node.resourceByResourceId?.title ?? null,
    location: node.resourceByResourceId?.location ?? null,
    defaultTokens: nullableNumber(node.resourceByResourceId?.defaultTokenAmount)
  }));
}

export async function triageCampaignNeed(
  campaignId: string,
  needId: string,
  action: "accept" | "reject"
): Promise<void> {
  await apolloClient.mutate({
    mutation: action === "accept" ? AcceptCampaignNeedDocument : RejectCampaignNeedDocument,
    variables: { campaignId, needId }
  });
}

export async function triageCampaignResource(
  campaignId: string,
  resourceId: string,
  action: "accept" | "reject"
): Promise<void> {
  await apolloClient.mutate({
    mutation: action === "accept" ? AcceptCampaignResourceDocument : RejectCampaignResourceDocument,
    variables: { campaignId, resourceId }
  });
}
