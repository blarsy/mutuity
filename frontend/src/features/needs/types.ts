export type TriStateFilter = "neutral" | "set" | "unset";

export type NeedSearchLocation = {
  latitude: number;
  longitude: number;
  source?: "explicit" | "account" | "browser" | "fallback";
};

export type NeedSearchFilters = {
  searchText: string;
  multiplePeopleRequired: TriStateFilter;
  toolingRequired: TriStateFilter;
  competenceRequired: TriStateFilter;
  objectRequired: TriStateFilter;
};

export type NeedRankingScores = {
  closenessScore: number;
  easeOfSetupScore: number;
  expirationScore: number;
  weightedScore: number;
  queryLatitude: number;
  queryLongitude: number;
};

export type PublicNeedCard = {
  id: string;
  creatorAccountId: string;
  creatorDisplayName: string;
  title: string;
  description: string | null;
  location: string;
  latitude: number;
  longitude: number;
  intensity: "leg_up" | "sharing" | "commitment" | "rare_contribution";
  proposedTopesAmount: number | null;
  objectRequired: boolean;
  competenceRequired: boolean;
  toolingRequired: boolean;
  multiplePeopleRequired: boolean;
  requiredCompetenceText: string | null;
  requiredToolingText: string | null;
  requiredPeopleCount: number | null;
  expiresAt: string | null;
  createdAt: string;
} & NeedRankingScores;

export type NeedClaimStatus = "open" | "settled" | "declined" | "withdrawn" | "expired";

export type NeedClaimSummary = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: NeedClaimStatus;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
};

export type ClaimConversationMessage = {
  id: string;
  senderAccountId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
  imageUrls: string[];
};

export type ClaimConversationThread = {
  claimId: string;
  conversationId: string;
  needId: string;
  creatorAccountId: string;
  claimerAccountId: string;
  messages: ClaimConversationMessage[];
};

export const DEFAULT_NEED_SEARCH_FILTERS: NeedSearchFilters = {
  searchText: "",
  multiplePeopleRequired: "neutral",
  toolingRequired: "neutral",
  competenceRequired: "neutral",
  objectRequired: "neutral"
};
