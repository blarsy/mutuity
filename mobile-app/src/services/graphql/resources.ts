import { apolloClient } from "./client";
import {
  type CreateResourceInput,
  type Mutation,
  NeedIntensity,
  type Query,
  TriStateFilter,
  type QuerySearchResourcesArgs,
  type Resource,
  type ResourcePatch,
  type SearchResourcesRecord
} from "./generated";
import {
  CREATE_RESOURCE_MUTATION,
  DELETE_RESOURCE_BY_ID_MUTATION,
  MY_RESOURCES_QUERY,
  SEARCH_RESOURCES_QUERY,
  UPDATE_RESOURCE_BY_ID_MUTATION
} from "./operations";

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_DISTANCE_KM = 999;

interface MyResourcesQueryResult {
  allResources: {
    nodes: Resource[];
  } | null;
}

interface MyResourcesQueryVariables {
  creatorAccountId: string;
  first?: number;
  after?: string | null;
}

interface CreateResourceMutationResult {
  createResource: Pick<Mutation, "createResource">["createResource"];
}

interface UpdateResourceByIdMutationResult {
  updateResourceById: Pick<Mutation, "updateResourceById">["updateResourceById"];
}

interface DeleteResourceByIdMutationResult {
  deleteResourceById: Pick<Mutation, "deleteResourceById">["deleteResourceById"];
}

interface DeleteResourceByIdMutationVariables {
  id: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SearchResourcesFilters {
  searchTerm: string;
  hasReferenceLocation: boolean;
  distanceKm: number;
  natureOptions: {
    isProduct: boolean;
    isService: boolean;
  };
  transportOptions: {
    canBeTakenAway: boolean;
    canBeDelivered: boolean;
  };
  exchangeOptions: {
    canBeExchanged: boolean;
    canBeGifted: boolean;
  };
}

export interface MyResourceItem {
  id: string;
  title: string;
  description: string;
  defaultTokenAmount: number;
  imageUrls: string[];
  isActive: boolean;
  isProduct: boolean;
  isService: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  location: {
    label: string;
    latitude?: number;
    longitude?: number;
  } | null;
  expiresAt: string | null;
  updatedAt: string | null;
}

export interface FetchMyResourcesFilters {
  creatorAccountId: string;
}

export interface UpsertResourceInput {
  title: string;
  description: string;
  defaultTokenAmount: number;
  imageUrls: string[];
  expiresAt: string | null;
  isProduct: boolean;
  isService: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  location: {
    label: string;
    latitude?: number;
    longitude?: number;
  } | null;
}

export interface SearchResourceResultItem {
  id: string;
  title: string;
  description: string;
  createdAt: string | null;
  creatorAccountId: string | null;
  creatorDisplayName: string | null;
  category: string;
  distanceKm: number;
  type: "product" | "service";
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  located: boolean;
  campaignIds: string[];
  imageUrls: string[];
}

function toSafeImageUrls(imageUrls: Array<string | null | undefined> | null | undefined): string[] {
  return (imageUrls ?? []).filter((value): value is string => typeof value === "string" && value.length > 0);
}

function toMyResourceItem(resource: Resource): MyResourceItem | null {
  if (!resource.id || !resource.title) {
    return null;
  }

  return {
    id: String(resource.id),
    title: resource.title,
    description: resource.description ?? "",
    defaultTokenAmount: typeof resource.defaultTokenAmount === "number" ? resource.defaultTokenAmount : 0,
    imageUrls: toSafeImageUrls(resource.imageUrls),
    isActive: resource.isActive ?? true,
    isProduct: resource.isProduct ?? true,
    isService: resource.isService ?? false,
    canBeTakenAway: resource.canBeTakenAway ?? false,
    canBeDelivered: resource.canBeDelivered ?? false,
    canBeExchanged: resource.canBeExchanged ?? false,
    canBeGifted: resource.canBeGiven ?? false,
    location: (() => {
      if (!(typeof resource.location === "string" && resource.location.trim().length > 0)) {
        return null;
      }

      const latitude = parseBigFloat(resource.latitude);
      const longitude = parseBigFloat(resource.longitude);
      const nextLocation: { label: string; latitude?: number; longitude?: number } = {
        label: resource.location
      };

      if (latitude !== null) {
        nextLocation.latitude = latitude;
      }

      if (longitude !== null) {
        nextLocation.longitude = longitude;
      }

      return nextLocation;
    })(),
    expiresAt: typeof resource.expiresAt === "string" ? resource.expiresAt : null,
    updatedAt: typeof resource.updatedAt === "string" ? resource.updatedAt : null
  };
}

interface SearchResourcesQueryResult {
  searchResources: {
    nodes: SearchResourcesRecord[];
  } | null;
}

function boolToTriState(value: boolean): TriStateFilter {
  return value ? TriStateFilter.Set : TriStateFilter.Neutral;
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

export function buildSearchResourcesVariables(filters: SearchResourcesFilters): QuerySearchResourcesArgs {
  const normalizedSearchTerm = filters.searchTerm.trim();

  const variables: QuerySearchResourcesArgs = {
    first: DEFAULT_PAGE_SIZE,
    favorLocalResources: filters.hasReferenceLocation,
    isProduct: boolToTriState(filters.natureOptions.isProduct),
    isService: boolToTriState(filters.natureOptions.isService),
    canBeTakenAway: boolToTriState(filters.transportOptions.canBeTakenAway),
    canBeDelivered: boolToTriState(filters.transportOptions.canBeDelivered),
    canBeExchanged: boolToTriState(filters.exchangeOptions.canBeExchanged),
    canBeGiven: boolToTriState(filters.exchangeOptions.canBeGifted)
  };

  if (normalizedSearchTerm.length > 0) {
    variables.searchText = normalizedSearchTerm;
  }

  if (filters.hasReferenceLocation) {
    variables.maxDistanceKm = filters.distanceKm;
  }

  return variables;
}

export function normalizeSearchResource(node: SearchResourcesRecord): SearchResourceResultItem | null {
  if (!node.id || !node.title) {
    return null;
  }

  const firstCategory = node.categoryLabels?.find((label): label is string => typeof label === "string" && label.length > 0);
  const located = typeof node.latitude === "number" && typeof node.longitude === "number";
  const distanceKm = parseBigFloat(node.distanceKm) ?? FALLBACK_DISTANCE_KM;

  return {
    id: String(node.id),
    title: node.title,
    description: node.description ?? "",
    createdAt: typeof node.createdAt === "string" ? node.createdAt : null,
    creatorAccountId: typeof node.creatorAccountId === "string" ? node.creatorAccountId : null,
    creatorDisplayName: typeof node.creatorDisplayName === "string" ? node.creatorDisplayName : null,
    category: firstCategory ?? "Other",
    distanceKm,
    type: node.isService ? "service" : "product",
    canBeTakenAway: node.canBeTakenAway ?? false,
    canBeDelivered: node.canBeDelivered ?? false,
    canBeExchanged: node.canBeExchanged ?? false,
    canBeGifted: node.canBeGiven ?? false,
    located,
    campaignIds: [],
    imageUrls: (node.imageUrls ?? []).filter((value): value is string => typeof value === "string" && value.length > 0)
  };
}

export async function fetchSearchResources(filters: SearchResourcesFilters): Promise<SearchResourceResultItem[]> {
  const variables = buildSearchResourcesVariables(filters);

  const { data } = await apolloClient.query<SearchResourcesQueryResult, QuerySearchResourcesArgs>({
    query: SEARCH_RESOURCES_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const nodes = data?.searchResources?.nodes ?? [];

  return nodes
    .map((node) => normalizeSearchResource(node))
    .filter((node): node is SearchResourceResultItem => node !== null);
}

export async function fetchMyResources(filters: FetchMyResourcesFilters): Promise<MyResourceItem[]> {
  const variables: MyResourcesQueryVariables = {
    creatorAccountId: filters.creatorAccountId,
    first: DEFAULT_PAGE_SIZE
  };

  const { data } = await apolloClient.query<MyResourcesQueryResult, MyResourcesQueryVariables>({
    query: MY_RESOURCES_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  return (data?.allResources?.nodes ?? [])
    .map((resource) => toMyResourceItem(resource))
    .filter((resource): resource is MyResourceItem => resource !== null);
}

export async function createResourceForAccount(
  creatorAccountId: string,
  input: UpsertResourceInput
): Promise<MyResourceItem | null> {
  const variables: { input: CreateResourceInput } = {
    input: {
      resource: {
        creatorAccountId,
        title: input.title.trim(),
        description: input.description.trim(),
        defaultTokenAmount: Math.max(0, Math.round(input.defaultTokenAmount)),
        imageUrls: input.imageUrls,
        ...(input.expiresAt ? { expiresAt: input.expiresAt } : {}),
        intensity: NeedIntensity.Sharing,
        isProduct: input.isProduct,
        isService: input.isService,
        canBeTakenAway: input.canBeTakenAway,
        canBeDelivered: input.canBeDelivered,
        canBeExchanged: input.canBeExchanged,
        canBeGiven: input.canBeGifted,
        location: input.location?.label ?? null,
        latitude: input.location?.latitude,
        longitude: input.location?.longitude,
        isActive: true
      }
    }
  };

  const { data } = await apolloClient.mutate<CreateResourceMutationResult, { input: CreateResourceInput }>({
    mutation: CREATE_RESOURCE_MUTATION,
    variables
  });

  const createdId = data?.createResource?.resource?.id;
  if (!createdId) {
    return null;
  }

  const items = await fetchMyResources({ creatorAccountId });
  return items.find((item) => item.id === String(createdId)) ?? null;
}

export async function updateResourceById(resourceId: string, input: UpsertResourceInput): Promise<MyResourceItem | null> {
  const variables: { id: string; resourcePatch: ResourcePatch } = {
    id: resourceId,
    resourcePatch: {
      title: input.title.trim(),
      description: input.description.trim(),
      defaultTokenAmount: Math.max(0, Math.round(input.defaultTokenAmount)),
      imageUrls: input.imageUrls,
      expiresAt: input.expiresAt,
      isProduct: input.isProduct,
      isService: input.isService,
      canBeTakenAway: input.canBeTakenAway,
      canBeDelivered: input.canBeDelivered,
      canBeExchanged: input.canBeExchanged,
      canBeGiven: input.canBeGifted,
      location: input.location?.label ?? null,
      latitude: input.location?.latitude,
      longitude: input.location?.longitude
    }
  };

  const { data } = await apolloClient.mutate<UpdateResourceByIdMutationResult, { id: string; resourcePatch: ResourcePatch }>({
    mutation: UPDATE_RESOURCE_BY_ID_MUTATION,
    variables
  });

  return toMyResourceItem(data?.updateResourceById?.resource as Resource) ?? null;
}

export async function deleteResourceById(resourceId: string): Promise<boolean> {
  if (!UUID_PATTERN.test(resourceId)) {
    return false;
  }

  const { data } = await apolloClient.mutate<DeleteResourceByIdMutationResult, DeleteResourceByIdMutationVariables>({
    mutation: DELETE_RESOURCE_BY_ID_MUTATION,
    variables: { id: resourceId }
  });

  return data?.deleteResourceById?.deletedResourceId !== null;
}
