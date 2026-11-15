type NotificationPayload = Record<string, unknown>;

function asText(value: unknown) {
  return typeof value === "string" ? value : null;
}

export function notificationUrlForEvent(eventType: string, payload: NotificationPayload) {
  const campaignId = asText(payload.campaignId);
  const creatorName = asText(payload.creatorName);
  const needClaimId = asText(payload.needClaimId);

  switch (eventType) {
    case "campaign_listing_pending":
      return campaignId ? `/campaigns/${encodeURIComponent(campaignId)}/moderation` : "/campaigns";
    case "campaign_listing_accepted":
    case "campaign_listing_rejected": {
      const listingId = asText(payload.listingId);
      const collection = payload.listingKind === "need" ? "needs" : payload.listingKind === "resource" ? "resources" : null;
      if (!listingId || !collection) return "/notifications";
      const encodedId = encodeURIComponent(listingId);
      if (eventType === "campaign_listing_rejected") {
        const idParam = collection === "needs" ? "needId" : "resourceId";
        return `/${collection}/create?${idParam}=${encodedId}`;
      }
      return `/${collection}/${encodedId}`;
    }
    case "claim_created":
    case "claim_settled":
    case "claim_declined":
    case "claim_withdrawn":
    case "claim_expired":
    case "claim_need_deactivated":
    case "need_expired_claims_declined":
      return needClaimId ? `/claims?claimId=${encodeURIComponent(needClaimId)}` : "/claims";
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
      return campaignId ? `/campaigns/${campaignId}` : "/campaigns";
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