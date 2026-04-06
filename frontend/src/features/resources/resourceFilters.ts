import type { ResourceSearchFilters, ResourceSearchLocation, TriStateFilter } from "./types";

export type GraphQLTriStateFilter = "NEUTRAL" | "SET" | "UNSET";

export type ResourceSearchQueryVariables = {
  latitude: number | null;
  longitude: number | null;
  browserLatitude: number | null;
  browserLongitude: number | null;
  searchText?: string;
  categoryCodes?: number[];
  isProduct: GraphQLTriStateFilter;
  isService: GraphQLTriStateFilter;
  canBeGiven: GraphQLTriStateFilter;
  canBeExchanged: GraphQLTriStateFilter;
  canBeTakenAway: GraphQLTriStateFilter;
  canBeDelivered: GraphQLTriStateFilter;
  limitCount: number;
};

const NEXT_TRI_STATE: Record<TriStateFilter, TriStateFilter> = {
  neutral: "set",
  set: "unset",
  unset: "neutral"
};

const GRAPHQL_TRI_STATE: Record<TriStateFilter, GraphQLTriStateFilter> = {
  neutral: "NEUTRAL",
  set: "SET",
  unset: "UNSET"
};

export function cycleTriStateFilter(current: TriStateFilter): TriStateFilter {
  return NEXT_TRI_STATE[current];
}

export function describeTriStateFilter(current: TriStateFilter) {
  switch (current) {
    case "set":
      return "yes";
    case "unset":
      return "no";
    default:
      return "any";
  }
}

export function buildResourceSearchVariables(input: {
  filters: ResourceSearchFilters;
  location?: ResourceSearchLocation;
  limitCount?: number;
}): ResourceSearchQueryVariables {
  const { filters, location, limitCount = 50 } = input;
  const trimmedSearchText = filters.searchText.trim();

  const variables: ResourceSearchQueryVariables = {
    latitude: null,
    longitude: null,
    browserLatitude: null,
    browserLongitude: null,
    searchText: trimmedSearchText.length > 0 ? trimmedSearchText : undefined,
    categoryCodes: filters.categoryCodes.length > 0 ? filters.categoryCodes : undefined,
    isProduct: GRAPHQL_TRI_STATE[filters.isProduct],
    isService: GRAPHQL_TRI_STATE[filters.isService],
    canBeGiven: GRAPHQL_TRI_STATE[filters.canBeGiven],
    canBeExchanged: GRAPHQL_TRI_STATE[filters.canBeExchanged],
    canBeTakenAway: GRAPHQL_TRI_STATE[filters.canBeTakenAway],
    canBeDelivered: GRAPHQL_TRI_STATE[filters.canBeDelivered],
    limitCount
  };

  if (!location) {
    return variables;
  }

  if (location.source === "browser") {
    variables.browserLatitude = location.latitude;
    variables.browserLongitude = location.longitude;
    return variables;
  }

  variables.latitude = location.latitude;
  variables.longitude = location.longitude;
  return variables;
}
