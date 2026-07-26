import { apolloClient } from "./client";
import {
  type CreateNeedInput,
  type Mutation,
  NeedClaimStatus,
  NeedIntensity,
  type Need,
  type NeedPatch,
  type Query
} from "./generated";
import {
  CLAIM_NEED_MUTATION,
  CREATE_NEED_MUTATION,
  MY_NEEDS_QUERY,
  RECEIVED_NEED_CLAIMS_QUERY,
  SEARCH_NEEDS_QUERY,
  SENT_NEED_CLAIMS_QUERY,
  UPDATE_NEED_BY_ID_MUTATION
} from "./operations";

const DEFAULT_PAGE_SIZE = 50;

export interface SearchNeedsFilters {
  searchTerm: string;
  intensityFilters: NeedIntensity[];
  maxProposedTokenAmount: number | null;
  hideClaimedNeeds: boolean;
  currentAccountId?: string | null;
}

export interface NeedItem {
  id: string;
  title: string;
  description: string;
  imageUrls?: string[];
  location?: {
    label: string;
    latitude?: number;
    longitude?: number;
  } | null;
  proposedTokenAmount: number;
  intensity: NeedIntensity;
  objectRequired?: boolean;
  competenceRequired?: boolean;
  toolingRequired?: boolean;
  multiplePeopleRequired?: boolean;
  requiredCompetenceText?: string;
  requiredToolingText?: string;
  requiredPeopleCount?: number | null;
  campaignId?: string | null;
  expiresAt?: string | null;
  createdAt: string | null;
  creatorAccountId: string | null;
  claimCount: number;
  isClaimedByCurrentAccount: boolean;
}

export interface UpsertNeedInput {
  title: string;
  description: string;
  imageUrls: string[];
  location: {
    label: string;
    latitude?: number;
    longitude?: number;
  } | null;
  proposedTokenAmount: number;
  intensity: NeedIntensity;
  objectRequired: boolean;
  competenceRequired: boolean;
  toolingRequired: boolean;
  multiplePeopleRequired: boolean;
  requiredCompetenceText: string;
  requiredToolingText: string;
  requiredPeopleCount: number | null;
  campaignId: string | null;
  expiresAt: string | null;
}

export interface NeedClaimItem {
  id: string;
  needId: string;
  needTitle: string;
  createdAt: string | null;
  status: NeedClaimStatus;
  claimerAccountId: string | null;
  ownerAccountId: string | null;
}

interface SearchNeedsQueryResult {
  allNeeds: {
    nodes: Need[];
  } | null;
}

interface SearchNeedsQueryVariables {
  first?: number;
  after?: string | null;
}

interface MyNeedsQueryResult {
  allNeeds: {
    nodes: Need[];
  } | null;
}

interface MyNeedsQueryVariables {
  creatorAccountId: string;
  first?: number;
  after?: string | null;
}

interface CreateNeedMutationResult {
  createNeed: Pick<Mutation, "createNeed">["createNeed"];
}

interface UpdateNeedByIdMutationResult {
  updateNeedById: Pick<Mutation, "updateNeedById">["updateNeedById"];
}

interface ClaimNeedMutationResult {
  claimNeed: Pick<Mutation, "claimNeed">["claimNeed"];
}

interface NeedClaimsQueryResult {
  allNeedClaims: {
    nodes: Array<NonNullable<Query["allNeedClaims"]>["nodes"][number]>;
  } | null;
}

interface ReceivedNeedClaimsQueryResult {
  allNeeds: {
    nodes: Array<{
      id: string;
      title: string;
      needClaimsByNeedId: {
        nodes: Array<{
          id: string;
          needId: string;
          claimerAccountId: string;
          status: NeedClaimStatus;
          createdAt: string;
        }>;
      } | null;
    }>;
  } | null;
}

interface NeedClaimsQueryVariables {
  condition: {
    claimerAccountId?: string;
  };
  first?: number;
  after?: string | null;
}

interface ReceivedNeedClaimsQueryVariables {
  creatorAccountId: string;
  first?: number;
  after?: string | null;
}

function parseTokenAmount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function parseBigFloat(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toSafeImageUrls(imageUrls: Array<string | null | undefined> | null | undefined): string[] {
  return (imageUrls ?? []).filter((value): value is string => typeof value === "string" && value.length > 0);
}

function normalizeNeed(node: Need, currentAccountId: string | null): NeedItem | null {
  if (!node.id || !node.title) {
    return null;
  }

  const activeClaims = (node.needClaimsByNeedId?.nodes ?? []).filter(
    (claim) => claim.status === NeedClaimStatus.Open || claim.status === NeedClaimStatus.Settled
  );

  return {
    id: String(node.id),
    title: node.title,
    description: node.description ?? "",
    imageUrls: toSafeImageUrls(node.imageUrls),
    location: (() => {
      if (!(typeof node.location === "string" && node.location.trim().length > 0)) {
        return null;
      }

      const latitude = parseBigFloat(node.latitude);
      const longitude = parseBigFloat(node.longitude);
      const nextLocation: {
        label: string;
        latitude?: number;
        longitude?: number;
      } = {
        label: node.location
      };

      if (latitude !== null) {
        nextLocation.latitude = latitude;
      }

      if (longitude !== null) {
        nextLocation.longitude = longitude;
      }

      return nextLocation;
    })(),
    proposedTokenAmount: parseTokenAmount(node.proposedTopesAmount),
    intensity: node.intensity ?? NeedIntensity.Sharing,
    objectRequired: node.objectRequired ?? true,
    competenceRequired: node.competenceRequired ?? false,
    toolingRequired: node.toolingRequired ?? false,
    multiplePeopleRequired: node.multiplePeopleRequired ?? false,
    requiredCompetenceText: node.requiredCompetenceText ?? "",
    requiredToolingText: node.requiredToolingText ?? "",
    requiredPeopleCount: typeof node.requiredPeopleCount === "number" ? node.requiredPeopleCount : null,
    campaignId:
      typeof node.campaignNeedsByNeedId?.nodes?.[0]?.campaignId === "string"
        ? node.campaignNeedsByNeedId.nodes[0].campaignId
        : null,
    expiresAt: typeof node.expiresAt === "string" ? node.expiresAt : null,
    createdAt: typeof node.createdAt === "string" ? node.createdAt : null,
    creatorAccountId: typeof node.creatorAccountId === "string" ? node.creatorAccountId : null,
    claimCount: activeClaims.length,
    isClaimedByCurrentAccount:
      currentAccountId !== null &&
      activeClaims.some((claim) => claim.claimerAccountId === currentAccountId)
  };
}

export interface ClaimedNeedRecord {
  id: string;
  needId: string;
  status: NeedClaimStatus;
  claimerAccountId: string | null;
}

interface MinimalNeedClaimPayload {
  needClaim?: {
    id?: unknown;
    needId?: unknown;
    status?: NeedClaimStatus | null;
    claimerAccountId?: unknown;
    [key: string]: unknown;
  } | null;
  [key: string]: unknown;
}

export function normalizeNeedClaimPayload(
  payload: MinimalNeedClaimPayload | null | undefined
): ClaimedNeedRecord | null {
  const needClaim = payload?.needClaim;

  if (!needClaim?.id || !needClaim.needId || !needClaim.status) {
    return null;
  }

  return {
    id: String(needClaim.id),
    needId: String(needClaim.needId),
    status: needClaim.status,
    claimerAccountId: typeof needClaim.claimerAccountId === "string" ? needClaim.claimerAccountId : null
  };
}

export async function fetchSearchNeeds(filters: SearchNeedsFilters): Promise<NeedItem[]> {
  const variables: SearchNeedsQueryVariables = {
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<SearchNeedsQueryResult, SearchNeedsQueryVariables>({
    query: SEARCH_NEEDS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const normalizedSearch = filters.searchTerm.trim().toLowerCase();
  const sourceNeeds = (data?.allNeeds?.nodes ?? [])
    .map((need) => normalizeNeed(need, filters.currentAccountId ?? null))
    .filter((need): need is NeedItem => need !== null);

  return sourceNeeds.filter((need) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${need.title} ${need.description}`.toLowerCase().includes(normalizedSearch);
    const matchesIntensity =
      filters.intensityFilters.length === 0 || filters.intensityFilters.includes(need.intensity);
    const matchesTokenAmount =
      filters.maxProposedTokenAmount === null || need.proposedTokenAmount <= filters.maxProposedTokenAmount;
    const matchesClaimedVisibility = !filters.hideClaimedNeeds || !need.isClaimedByCurrentAccount;

    return matchesSearch && matchesIntensity && matchesTokenAmount && matchesClaimedVisibility;
  });
}

export async function fetchMyNeeds(creatorAccountId: string): Promise<NeedItem[]> {
  const variables: MyNeedsQueryVariables = {
    creatorAccountId,
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<MyNeedsQueryResult, MyNeedsQueryVariables>({
    query: MY_NEEDS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.allNeeds?.nodes ?? [])
    .map((need) => normalizeNeed(need, creatorAccountId))
    .filter((need): need is NeedItem => need !== null)
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}

export async function createNeedForAccount(creatorAccountId: string, input: UpsertNeedInput): Promise<NeedItem | null> {
  const optionalCreateInput: Partial<CreateNeedInput> = {
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    ...(input.imageUrls.length > 0 ? { imageUrls: input.imageUrls } : {}),
    ...(input.location?.label?.trim() ? { location: input.location.label.trim() } : {}),
    ...(input.location?.latitude !== undefined ? { latitude: input.location.latitude } : {}),
    ...(input.location?.longitude !== undefined ? { longitude: input.location.longitude } : {}),
    ...(input.requiredCompetenceText.trim() ? { requiredCompetenceText: input.requiredCompetenceText.trim() } : {}),
    ...(input.requiredToolingText.trim() ? { requiredToolingText: input.requiredToolingText.trim() } : {}),
    ...(input.requiredPeopleCount !== null ? { requiredPeopleCount: input.requiredPeopleCount } : {}),
    ...(input.campaignId ? { campaignId: input.campaignId } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
  };

  const variables: { input: CreateNeedInput } = {
    input: {
      title: input.title.trim(),
      proposedTopesAmount: Math.max(0, Math.round(input.proposedTokenAmount)),
      intensity: input.intensity,
      objectRequired: input.objectRequired,
      competenceRequired: input.competenceRequired,
      toolingRequired: input.toolingRequired,
      multiplePeopleRequired: input.multiplePeopleRequired,
      ...optionalCreateInput
    }
  };

  const { data } = await apolloClient.mutate<CreateNeedMutationResult, { input: CreateNeedInput }>({
    mutation: CREATE_NEED_MUTATION,
    variables
  });

  const createdNeedId = data?.createNeed?.need?.id;
  if (!createdNeedId) {
    return null;
  }

  const allNeeds = await fetchMyNeeds(creatorAccountId);
  return allNeeds.find((need) => need.id === String(createdNeedId)) ?? null;
}

export async function updateNeedById(needId: string, input: UpsertNeedInput): Promise<NeedItem | null> {
  const optionalNeedPatch: Partial<NeedPatch> = {
    ...(input.description.trim() ? { description: input.description.trim() } : {}),
    ...(input.imageUrls.length > 0 ? { imageUrls: input.imageUrls } : {}),
    ...(input.location?.label?.trim() ? { location: input.location.label.trim() } : {}),
    ...(input.location?.latitude !== undefined ? { latitude: input.location.latitude } : {}),
    ...(input.location?.longitude !== undefined ? { longitude: input.location.longitude } : {}),
    ...(input.requiredCompetenceText.trim() ? { requiredCompetenceText: input.requiredCompetenceText.trim() } : {}),
    ...(input.requiredToolingText.trim() ? { requiredToolingText: input.requiredToolingText.trim() } : {}),
    ...(input.requiredPeopleCount !== null ? { requiredPeopleCount: input.requiredPeopleCount } : {}),
    ...(input.expiresAt ? { expiresAt: input.expiresAt } : {})
  };

  const variables: { id: string; needPatch: NeedPatch } = {
    id: needId,
    needPatch: {
      title: input.title.trim(),
      proposedTopesAmount: Math.max(0, Math.round(input.proposedTokenAmount)),
      intensity: input.intensity,
      objectRequired: input.objectRequired,
      competenceRequired: input.competenceRequired,
      toolingRequired: input.toolingRequired,
      multiplePeopleRequired: input.multiplePeopleRequired,
      ...optionalNeedPatch
    }
  };

  const { data } = await apolloClient.mutate<UpdateNeedByIdMutationResult, { id: string; needPatch: NeedPatch }>({
    mutation: UPDATE_NEED_BY_ID_MUTATION,
    variables
  });

  const updatedNeed = data?.updateNeedById?.need;
  if (!updatedNeed?.id) {
    return null;
  }

  return normalizeNeed(updatedNeed as Need, null);
}

export async function claimNeedById(needId: string, message: string | null = null): Promise<ClaimedNeedRecord | null> {
  const { data } = await apolloClient.mutate<
    ClaimNeedMutationResult,
    { input: { needId: string; message?: string } }
  >({
    mutation: CLAIM_NEED_MUTATION,
    variables: {
      input: {
        needId,
        ...(message ? { message: message.trim() } : {})
      }
    }
  });

  return normalizeNeedClaimPayload(data?.claimNeed);
}

function normalizeNeedClaim(
  node: NonNullable<NonNullable<NeedClaimsQueryResult["allNeedClaims"]>["nodes"][number]>
): NeedClaimItem | null {
  if (!node.id || !node.needId) {
    return null;
  }

  return {
    id: String(node.id),
    needId: String(node.needId),
    needTitle: node.needByNeedId?.title ?? "",
    createdAt: typeof node.createdAt === "string" ? node.createdAt : null,
    status: node.status,
    claimerAccountId: typeof node.claimerAccountId === "string" ? node.claimerAccountId : null,
    ownerAccountId: null
  };
}

export async function fetchNeedClaimsForAccount(input: {
  accountId: string;
  direction: "sent" | "received";
}): Promise<NeedClaimItem[]> {
  const sentVariables: NeedClaimsQueryVariables = {
    condition: { claimerAccountId: input.accountId },
    first: DEFAULT_PAGE_SIZE
  };

  if (input.direction === "sent") {
    const { data } = await apolloClient.query<NeedClaimsQueryResult, NeedClaimsQueryVariables>({
      query: SENT_NEED_CLAIMS_QUERY,
      variables: sentVariables,
      fetchPolicy: "network-only"
    });

    return (data?.allNeedClaims?.nodes ?? [])
      .map((claim) => normalizeNeedClaim(claim))
      .filter((claim): claim is NeedClaimItem => claim !== null)
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
  }

  const receivedVariables: ReceivedNeedClaimsQueryVariables = {
    creatorAccountId: input.accountId,
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<ReceivedNeedClaimsQueryResult, ReceivedNeedClaimsQueryVariables>({
    query: RECEIVED_NEED_CLAIMS_QUERY,
    variables: receivedVariables,
    fetchPolicy: "network-only"
  });

  const flattened = (data?.allNeeds?.nodes ?? []).flatMap((need) =>
    (need.needClaimsByNeedId?.nodes ?? []).map((claim) => ({
      id: String(claim.id),
      needId: String(claim.needId),
      needTitle: need.title,
      createdAt: claim.createdAt,
      status: claim.status,
      claimerAccountId: claim.claimerAccountId,
      ownerAccountId: input.accountId
    }))
  );

  return flattened.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
}
