import { apolloClient } from "./client";
import { TriStateFilter, type QuerySearchResourcesArgs, type SearchResourcesRecord } from "./generated";
import { SEARCH_RESOURCES_QUERY } from "./operations";

const DEFAULT_PAGE_SIZE = 50;
const FALLBACK_DISTANCE_KM = 999;

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

export interface SearchResourceResultItem {
  id: string;
  title: string;
  description: string;
  category: string;
  distanceKm: number;
  type: "product" | "service";
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  canBeExchanged: boolean;
  canBeGifted: boolean;
  located: boolean;
  campaignIds: string[];
}

interface SearchResourcesQueryResult {
  searchResources: {
    nodes: SearchResourcesRecord[];
  } | null;
}

function boolToTriState(value: boolean): TriStateFilter {
  return value ? TriStateFilter.Set : TriStateFilter.Neutral;
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

  return {
    id: String(node.id),
    title: node.title,
    description: node.description ?? "",
    category: firstCategory ?? "Other",
    distanceKm: typeof node.distanceKm === "number" ? node.distanceKm : FALLBACK_DISTANCE_KM,
    type: node.isService ? "service" : "product",
    canBeTakenAway: node.canBeTakenAway ?? false,
    canBeDelivered: node.canBeDelivered ?? false,
    canBeExchanged: node.canBeExchanged ?? false,
    canBeGifted: node.canBeGiven ?? false,
    located,
    campaignIds: []
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
