export type NotificationSource = "need-claim" | "resource-bid" | "account";

export type NotificationFixture = {
  eventType: string;
  source: NotificationSource;
  payload: Record<string, unknown>;
  read?: boolean;
};

export const MOCK_CAMPAIGN_ID = "22222222-2222-4222-8222-222222222222";
export const MOCK_NEED_CLAIM_ID = "33333333-3333-4333-8333-333333333333";
export const MOCK_RESOURCE_BID_ID = "44444444-4444-4444-8444-444444444444";

/**
 * Every event type handled by `notificationMessage` in the notifications page,
 * plus one unmapped type that exercises the fallback rendering.
 */
export const NOTIFICATION_FIXTURES: NotificationFixture[] = [
  {
    eventType: "claim_created",
    source: "need-claim",
    payload: { needName: "Repeindre la salle commune", needClaimId: MOCK_NEED_CLAIM_ID }
  },
  {
    eventType: "claim_settled",
    source: "need-claim",
    payload: { needName: "Déménagement de la ressourcerie", needClaimId: MOCK_NEED_CLAIM_ID }
  },
  {
    eventType: "resource_bid_created",
    source: "resource-bid",
    payload: { resourceName: "Perceuse à colonne" }
  },
  {
    eventType: "resource_bid_expiring_soon",
    source: "resource-bid",
    payload: { resourceName: "Remorque utilitaire" }
  },
  {
    eventType: "resource_bid_accepted",
    source: "resource-bid",
    payload: { resourceName: "Cours de guitare" }
  },
  {
    eventType: "resource_bid_declined",
    source: "resource-bid",
    payload: { resourceName: "Vélo cargo" }
  },
  {
    eventType: "resource_bid_cancelled",
    source: "resource-bid",
    payload: { resourceName: "Tondeuse thermique" }
  },
  {
    eventType: "resource_bid_expired",
    source: "resource-bid",
    payload: { resourceName: "Échafaudage roulant" }
  },
  {
    eventType: "campaign_airdrop_coming_soon",
    source: "account",
    payload: { campaignName: "Quartier Solidaire", campaignId: MOCK_CAMPAIGN_ID }
  },
  {
    eventType: "campaign_airdrop_done",
    source: "account",
    payload: { campaignName: "Quartier Solidaire", campaignId: MOCK_CAMPAIGN_ID }
  },
  {
    eventType: "welcome_profile_reward",
    source: "account",
    payload: {}
  },
  {
    eventType: "gift_tokens_received",
    source: "account",
    payload: { senderName: "Louise", amountReceived: 120 }
  },
  {
    eventType: "campaign_moderation_note_received",
    source: "account",
    payload: { campaignName: "Fête des voisins", campaignId: MOCK_CAMPAIGN_ID }
  },
  {
    eventType: "campaign_approved",
    source: "account",
    payload: { campaignName: "Fête des voisins", campaignId: MOCK_CAMPAIGN_ID },
    read: true
  },
  {
    eventType: "campaign_creator_adaptation_submitted",
    source: "account",
    payload: { creatorName: "Nadia", campaignName: "Cantine partagée", campaignId: MOCK_CAMPAIGN_ID }
  },
  {
    eventType: "some_future_event_type",
    source: "account",
    payload: { url: "/app/notifications" }
  }
];

function createdAt(index: number) {
  return new Date(Date.UTC(2026, 3, 19, 12, 0, 0) - index * 3_600_000).toISOString();
}

/** Builds the `NotificationsOverview` query result for the given fixtures. */
export function buildNotificationsOverviewData(fixtures: NotificationFixture[] = NOTIFICATION_FIXTURES) {
  const nodesFor = (source: NotificationSource) =>
    fixtures
      .map((fixture, index) => ({ fixture, index }))
      .filter(entry => entry.fixture.source === source)
      .map(({ fixture, index }) => ({
        id: `${source}-${fixture.eventType}`,
        eventType: fixture.eventType,
        payload: fixture.payload,
        createdAt: createdAt(index),
        readAt: fixture.read ? createdAt(index) : null,
        ...(source === "need-claim" ? { needClaimId: MOCK_NEED_CLAIM_ID } : {}),
        ...(source === "resource-bid" ? { resourceBidId: MOCK_RESOURCE_BID_ID } : {})
      }));

  return {
    allNeedClaimNotifications: { nodes: nodesFor("need-claim") },
    allResourceBidNotifications: { nodes: nodesFor("resource-bid") },
    allAccountNotifications: { nodes: nodesFor("account") }
  };
}
