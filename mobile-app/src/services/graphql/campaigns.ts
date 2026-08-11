import { apolloClient } from "./client";
import {
  type CreateCampaignInput,
  CampaignModerationStatus,
  type Mutation,
  type Campaign,
  type CampaignPatch,
  type Query
} from "./generated";
import { CREATE_CAMPAIGN_MUTATION, INSPIRATION_CAMPAIGNS_QUERY, LINKABLE_CAMPAIGNS_QUERY, MY_CAMPAIGNS_QUERY, UPDATE_CAMPAIGN_BY_ID_MUTATION } from "./operations";

const DEFAULT_PAGE_SIZE = 50;

export interface LinkableCampaignItem {
  id: string;
  title: string;
}

export async function fetchLinkableCampaigns(): Promise<LinkableCampaignItem[]> {
  const { data } = await apolloClient.query<{
    linkableCampaigns?: {
      nodes?: Array<{ id: unknown; title?: string | null; startAt?: unknown; endAt?: unknown } | null> | null;
    } | null;
  }>({
    query: LINKABLE_CAMPAIGNS_QUERY,
    fetchPolicy: "network-only"
  });

  return (data?.linkableCampaigns?.nodes ?? [])
    .filter((campaign): campaign is { id: unknown; title?: string | null; startAt?: unknown; endAt?: unknown } =>
      campaign != null && campaign.id != null && typeof campaign.title === "string" && campaign.title.trim().length > 0
    )
    .map((campaign) => ({ id: String(campaign.id), title: campaign.title }));
}

export interface CampaignItem {
  id: string;
  title: string;
  theme: string;
  description: string;
  imageUrl: string | null;
  startAt: string;
  airdropAt: string;
  endAt: string;
  createdAt: string;
  creatorAccountId: string | null;
  moderationStatus: CampaignModerationStatus;
  resourceCount: number;
  needCount: number;
  rewardsMultiplier?: number;
  airdropAmount?: number;
  managerNoteFromCreator?: string;
  pendingEntries?: Array<{
    id: string;
    type: "resource" | "need";
    title: string;
    creatorAccountId: string | null;
    creatorDisplayName?: string;
  }>;
}

export interface UpsertCampaignInput {
  title: string;
  theme?: string;
  description: string;
  imageUrl?: string | null;
  startAt: string;
  airdropAt?: string;
  endAt: string;
  rewardsMultiplier?: number;
  airdropAmount?: number;
  managerNoteFromCreator?: string;
}

interface MyCampaignsQueryResult {
  allCampaigns: {
    nodes: Campaign[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
}

interface InspirationCampaignsQueryResult {
  allCampaigns: {
    nodes: Campaign[];
  } | null;
}

interface MyCampaignsQueryVariables {
  creatorAccountId: string;
  first?: number;
  after?: string | null;
}

interface CreateCampaignMutationResult {
  createCampaign: Pick<Mutation, "createCampaign">["createCampaign"];
}

interface UpdateCampaignByIdMutationResult {
  updateCampaignById: Pick<Mutation, "updateCampaignById">["updateCampaignById"];
}

function normalizeCampaign(campaign: Campaign, _creatorAccountId?: string): CampaignItem | null {
  if (!campaign.id || !campaign.title) {
    return null;
  }

  return {
    id: String(campaign.id),
    title: campaign.title,
    theme: campaign.theme ?? "",
    description: campaign.description ?? "",
    imageUrl: campaign.imageUrl ?? null,
    startAt: String(campaign.startAt) ?? "",
    airdropAt: String(campaign.airdropAt) ?? "",
    endAt: String(campaign.endAt) ?? "",
    createdAt: String(campaign.createdAt) ?? "",
    creatorAccountId: typeof campaign.creatorAccountId === "string" ? campaign.creatorAccountId : null,
    moderationStatus: campaign.moderationStatus ?? CampaignModerationStatus.Pending,
    resourceCount: (campaign as any).campaignResourcesByCampaignId?.totalCount ?? 0,
    needCount: (campaign as any).campaignNeedsByCampaignId?.totalCount ?? 0,
    rewardsMultiplier: typeof (campaign as any).rewardsMultiplier === "number" ? (campaign as any).rewardsMultiplier : undefined,
    airdropAmount: typeof (campaign as any).airdropAmount === "number" ? (campaign as any).airdropAmount : undefined,
    managerNoteFromCreator: typeof (campaign as any).managerNoteFromCreator === "string" ? (campaign as any).managerNoteFromCreator : undefined
  };
}

export function normalizeCampaignPayload(
  payload: { campaign?: Campaign | null } | null | undefined
): CampaignItem | null {
  if (!payload?.campaign) {
    return null;
  }

  return normalizeCampaign(payload.campaign);
}

export interface MyCampaignsResult {
  campaigns: CampaignItem[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export async function fetchMyCampaigns(creatorAccountId: string, after?: string | null): Promise<MyCampaignsResult> {
  const variables: MyCampaignsQueryVariables = {
    creatorAccountId,
    first: DEFAULT_PAGE_SIZE,
    after: after ?? null
  };

  const { data } = await apolloClient.query<MyCampaignsQueryResult, MyCampaignsQueryVariables>({
    query: MY_CAMPAIGNS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });
  const campaigns = (data?.allCampaigns?.nodes ?? [])
    .map((campaign) => normalizeCampaign(campaign, creatorAccountId))
    .filter((campaign): campaign is CampaignItem => campaign !== null);

  return {
    campaigns,
    pageInfo: {
      hasNextPage: data?.allCampaigns?.pageInfo?.hasNextPage ?? false,
      endCursor: data?.allCampaigns?.pageInfo?.endCursor ?? null
    }
  };
}

export async function fetchInspirationCampaigns(): Promise<CampaignItem[]> {
  const { data } = await apolloClient.query<InspirationCampaignsQueryResult>({
    query: INSPIRATION_CAMPAIGNS_QUERY,
    fetchPolicy: "network-only"
  });

  return (data?.allCampaigns?.nodes ?? [])
    .map((campaign) => normalizeCampaign(campaign))
    .filter((campaign): campaign is CampaignItem => campaign !== null);
}

export async function createCampaignForAccount(
  creatorAccountId: string,
  input: UpsertCampaignInput
): Promise<CampaignItem | null> {
  const variables: { input: CreateCampaignInput } = {
    input: {
      title: input.title.trim(),
      ...(input.theme?.trim() && { theme: input.theme.trim() }),
      ...(input.description.trim() && { description: input.description.trim() }),
      startAt: input.startAt,
      ...(input.airdropAt && { airdropAt: input.airdropAt }),
      endAt: input.endAt,
      ...(typeof input.rewardsMultiplier === "number" && { rewardsMultiplier: input.rewardsMultiplier }),
      ...(typeof input.airdropAmount === "number" && { airdropAmount: input.airdropAmount }),
      ...(input.managerNoteFromCreator?.trim() && { managerNoteFromCreator: input.managerNoteFromCreator.trim() }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl })
    }
  };

  const { data } = await apolloClient.mutate<CreateCampaignMutationResult, { input: CreateCampaignInput }>({
    mutation: CREATE_CAMPAIGN_MUTATION,
    variables
  });

  const createdCampaignId = data?.createCampaign?.campaign?.id;
  if (!createdCampaignId) {
    return null;
  }

  const { campaigns: allCampaigns } = await fetchMyCampaigns(creatorAccountId);
  return allCampaigns.find((campaign) => campaign.id === String(createdCampaignId)) ?? null;
}

export async function updateCampaignById(
  campaignId: string,
  input: UpsertCampaignInput
): Promise<CampaignItem | null> {
  const variables: { id: string; campaignPatch: CampaignPatch } = {
    id: campaignId,
    campaignPatch: {
      title: input.title.trim(),
      ...(input.theme?.trim() && { theme: input.theme.trim() }),
      ...(input.description.trim() && { description: input.description.trim() }),
      startAt: input.startAt,
      ...(input.airdropAt && { airdropAt: input.airdropAt }),
      endAt: input.endAt,
      ...(typeof input.rewardsMultiplier === "number" && { rewardsMultiplier: input.rewardsMultiplier }),
      ...(typeof input.airdropAmount === "number" && { airdropAmount: input.airdropAmount }),
      ...(input.managerNoteFromCreator?.trim() && { managerNoteFromCreator: input.managerNoteFromCreator.trim() }),
      ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl })
    }
  };

  const { data } = await apolloClient.mutate<UpdateCampaignByIdMutationResult, { id: string; campaignPatch: CampaignPatch }
  >({
    mutation: UPDATE_CAMPAIGN_BY_ID_MUTATION,
    variables
  });

  const updatedCampaign = data?.updateCampaignById?.campaign;
  if (!updatedCampaign?.id) {
    return null;
  }

  return normalizeCampaign(updatedCampaign as Campaign);
}


