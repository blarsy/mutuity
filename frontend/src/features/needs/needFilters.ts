import type { NeedSearchFilters, NeedSearchLocation, TriStateFilter } from "./types";

export type GraphQLTriStateFilter = "NEUTRAL" | "SET" | "UNSET";

export type NeedSearchQueryVariables = {
  latitude: number | null;
  longitude: number | null;
  browserLatitude: number | null;
  browserLongitude: number | null;
  searchText?: string;
  favorLocalResources: boolean;
  maxDistanceKm: number;
  multiplePeopleRequired: GraphQLTriStateFilter;
  toolingRequired: GraphQLTriStateFilter;
  competenceRequired: GraphQLTriStateFilter;
  objectRequired: GraphQLTriStateFilter;
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
      return "required";
    case "unset":
      return "must be absent";
    default:
      return "any";
  }
}

export function buildNeedSearchVariables(input: {
  filters: NeedSearchFilters;
  location?: NeedSearchLocation;
  limitCount?: number;
}): NeedSearchQueryVariables {
  const { filters, location, limitCount = 50 } = input;
  const trimmedSearchText = filters.searchText.trim();

  const variables: NeedSearchQueryVariables = {
    latitude: null,
    longitude: null,
    browserLatitude: null,
    browserLongitude: null,
    searchText: trimmedSearchText.length > 0 ? trimmedSearchText : undefined,
    favorLocalResources: filters.favorLocalResources,
    maxDistanceKm: filters.maxDistanceKm,
    multiplePeopleRequired: GRAPHQL_TRI_STATE[filters.multiplePeopleRequired],
    toolingRequired: GRAPHQL_TRI_STATE[filters.toolingRequired],
    competenceRequired: GRAPHQL_TRI_STATE[filters.competenceRequired],
    objectRequired: GRAPHQL_TRI_STATE[filters.objectRequired],
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
