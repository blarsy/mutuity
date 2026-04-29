type NotificationPayload = Record<string, unknown>;

function asText(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function notificationUrlForEvent(eventType: string, payload: NotificationPayload) {
  const campaignId = asText(payload.campaignId);
  const creatorName = asText(payload.creatorName);

  switch (eventType) {
    case "claim_created":
    case "claim_settled":
      return "/claims";
    case "resource_bid_created":
    case "resource_bid_expiring_soon":
    case "resource_bid_accepted":
    case "resource_bid_declined":
    case "resource_bid_cancelled":
    case "resource_bid_expired":
      return "/bids";
    case "campaign_airdrop_done":
    case "gift_tokens_received":
      return "/contribution";
    case "campaign_airdrop_coming_soon": {
      const campaignUrl = asText(payload.url);
      return campaignUrl ?? "/";
    }
    case "welcome_profile_reward":
      return "/profile";
    case "campaign_moderation_note_received":
    case "campaign_approved":
      return campaignId ? `/campaigns/${campaignId}/moderation` : "/campaigns";
    case "campaign_creator_adaptation_submitted":
      return creatorName
        ? `/admin/campaigns?search=${encodeURIComponent(creatorName)}&status=AWAITING_ADAPTATION`
        : "/admin/campaigns?status=AWAITING_ADAPTATION";
    default: {
      const fallbackUrl = asText(payload.url);
      return fallbackUrl ?? "/notifications";
    }
  }
}