const CAMPAIGN_MODERATION_STATUSES = ["PENDING", "AWAITING_ADAPTATION", "APPROVED"] as const;

export function resolveCampaignModerationPrefill(query: {
  search?: string | string[];
  status?: string | string[];
}) {
  const prefilledSearch = typeof query.search === "string" ? query.search.trim() : "";
  const rawStatus = typeof query.status === "string" ? query.status.toUpperCase() : "";
  const prefilledStatus = CAMPAIGN_MODERATION_STATUSES.includes(
    rawStatus as (typeof CAMPAIGN_MODERATION_STATUSES)[number]
  )
    ? rawStatus
    : null;

  return {
    prefilledSearch,
    prefilledStatus
  };
}