import type { NeedSearchLocation, TriStateFilter } from "../needs/types";

export type { TriStateFilter } from "../needs/types";

export type ResourceSearchLocation = NeedSearchLocation;

export type ResourceSearchFilters = {
  searchText: string;
  categoryText: string;
  isProduct: TriStateFilter;
  isService: TriStateFilter;
  canBeGiven: TriStateFilter;
  canBeExchanged: TriStateFilter;
  canBeTakenAway: TriStateFilter;
  canBeDelivered: TriStateFilter;
};

export type PublicResourceCard = {
  id: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  title: string;
  description: string | null;
  location: string;
  latitude: number;
  longitude: number;
  intensity: "leg_up" | "sharing" | "commitment" | "rare_contribution";
  defaultTokenAmount: number | null;
  categoryLabels: string[];
  isProduct: boolean;
  isService: boolean;
  canBeGiven: boolean;
  canBeExchanged: boolean;
  canBeTakenAway: boolean;
  canBeDelivered: boolean;
  expiresAt: string | null;
  createdAt: string;
  distanceKm: string;
  queryLatitude: string;
  queryLongitude: string;
};

export const DEFAULT_RESOURCE_SEARCH_FILTERS: ResourceSearchFilters = {
  searchText: "",
  categoryText: "",
  isProduct: "neutral",
  isService: "neutral",
  canBeGiven: "neutral",
  canBeExchanged: "neutral",
  canBeTakenAway: "neutral",
  canBeDelivered: "neutral"
};
