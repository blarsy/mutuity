import type { NeedSearchLocation, TriStateFilter } from "../needs/types";

export type { TriStateFilter } from "../needs/types";

export type ResourceSearchLocation = NeedSearchLocation;

export type ResourceSearchFilters = {
  searchText: string;
  categoryCodes: number[];
  isProduct: TriStateFilter;
  isService: TriStateFilter;
  canBeGiven: TriStateFilter;
  canBeExchanged: TriStateFilter;
  canBeTakenAway: TriStateFilter;
  canBeDelivered: TriStateFilter;
};

export type ResourceIntensity = "leg_up" | "sharing" | "commitment" | "rare_contribution";

export type ResourceCategoryOption = {
  code: number;
  slug: string;
  label: string;
  labelFr: string;
  sortOrder: number;
};

export type ResourceBidStatus = "OPEN" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";

export type ResourceBidSummary = {
  id: string;
  resourceId: string;
  bidderAccountId: string;
  message: string | null;
  proposedTokenAmount: number | null;
  status: ResourceBidStatus;
  createdAt: string;
  respondedAt: string | null;
  respondedByAccountId: string | null;
  accountByBidderAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
};

export const RESOURCE_INTENSITY_OPTIONS: Array<{
  value: ResourceIntensity;
  label: string;
  tokenRange: string;
}> = [
  { value: "leg_up", label: "Leg up", tokenRange: "10–99" },
  { value: "sharing", label: "Sharing", tokenRange: "100–999" },
  { value: "commitment", label: "Commitment", tokenRange: "1000–4999" },
  { value: "rare_contribution", label: "Rare contribution", tokenRange: "5000+" }
];

export type PublicResourceCard = {
  id: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  title: string;
  description: string | null;
  location: string;
  latitude: number;
  longitude: number;
  intensity: ResourceIntensity;
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
  imageUrls: string[];
  distanceKm: string;
  queryLatitude: string;
  queryLongitude: string;
};

export const DEFAULT_RESOURCE_SEARCH_FILTERS: ResourceSearchFilters = {
  searchText: "",
  categoryCodes: [],
  isProduct: "neutral",
  isService: "neutral",
  canBeGiven: "neutral",
  canBeExchanged: "neutral",
  canBeTakenAway: "neutral",
  canBeDelivered: "neutral"
};
