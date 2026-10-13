export type CampaignParticipationState = "running" | "upcoming" | "pending" | "awaitingAdaptation" | "ended" | "unavailable";

export function resolveCampaignParticipationState(
  campaign: { moderationStatus: string; startAt: string; endAt: string } | null,
  now = Date.now()
): CampaignParticipationState {
  if (!campaign) return "unavailable";

  const startAt = Date.parse(campaign.startAt);
  const endAt = Date.parse(campaign.endAt);
  if (!Number.isFinite(startAt) || !Number.isFinite(endAt) || startAt >= endAt) return "unavailable";
  if (now >= endAt) return "ended";
  if (campaign.moderationStatus === "AWAITING_ADAPTATION") return "awaitingAdaptation";
  if (campaign.moderationStatus === "PENDING") return "pending";
  if (campaign.moderationStatus !== "APPROVED") return "unavailable";
  return now < startAt ? "upcoming" : "running";
}