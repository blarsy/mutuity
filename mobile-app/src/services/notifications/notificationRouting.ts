// Mobile adaptation of the web client's notification routing
// (frontend/src/features/notifications/notificationRouting.ts).
//
// The web client maps a notification event to a URL; here we map the same
// event to a mobile navigation destination expressed in terms of the app's
// tab + drawer surfaces instead of URL paths.

export type NotificationDrawerDestination =
  | "myResources"
  | "receivedBids"
  | "sentBids"
  | "myNeeds"
  | "receivedClaims"
  | "sentClaims"
  | "profile"
  | "preferences"
  | "contribution";

export type NotificationDestination =
  | { surface: "notifications" }
  | { surface: "explore" }
  | { surface: "chat" }
  | { surface: "myHub"; drawer: NotificationDrawerDestination; needId?: string }
  | { surface: "campaigns"; campaignId?: string; moderation?: boolean };

function asText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function notificationDestinationForEvent(
  eventType: string,
  payload: Record<string, unknown>
): NotificationDestination {
  const campaignId = asText(payload.campaignId);
  const needId = asText(payload.needId);

  switch (eventType) {
    case "claim_created":
    case "claim_withdrawn":
    case "need_expired_claims_declined":
      // These events notify the need creator. Detail screens require a need ID, not a claim ID.
      return needId
        ? { surface: "myHub", drawer: "receivedClaims", needId }
        : { surface: "myHub", drawer: "receivedClaims" };
    case "claim_settled":
    case "claim_declined":
    case "claim_expired":
    case "claim_need_deactivated":
      // These events notify the claimer about an offer they sent.
      return needId
        ? { surface: "myHub", drawer: "sentClaims", needId }
        : { surface: "myHub", drawer: "sentClaims" };
    case "resource_bid_created":
    case "resource_bid_expiring_soon":
      return { surface: "myHub", drawer: "receivedBids" };
    case "resource_bid_accepted":
    case "resource_bid_declined":
    case "resource_bid_cancelled":
    case "resource_bid_expired":
      // Responses and closure events notify the bidder, not the resource owner.
      return { surface: "myHub", drawer: "sentBids" };
    case "campaign_airdrop_done":
    case "gift_tokens_received":
      // Web: /contribution -> My Hub contribution.
      return { surface: "myHub", drawer: "contribution" };
    case "campaign_airdrop_coming_soon":
      // Web: /campaigns/{campaignId} -> Campaigns tab, public campaign.
      return campaignId
        ? { surface: "campaigns", campaignId }
        : { surface: "campaigns" };
    case "welcome_profile_reward":
      // Web: /profile -> My Hub profile.
      return { surface: "myHub", drawer: "profile" };
    case "campaign_moderation_note_received":
    case "campaign_approved":
      // Web: /campaigns/{campaignId}/moderation -> Campaigns tab, campaign.
      return campaignId
        ? { surface: "campaigns", campaignId, moderation: true }
        : { surface: "campaigns", moderation: true };
    case "campaign_creator_adaptation_submitted":
      // Web: /admin/campaigns?... -> Campaigns tab (no dedicated admin surface in mobile).
      return { surface: "campaigns", moderation: true };
    default:
      return { surface: "notifications" };
  }
}