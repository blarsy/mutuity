import { notificationDestinationForEvent } from "../../src/services/notifications/notificationRouting";

describe("mobile notification routing", () => {
  it("routes claim notifications to My Hub received claims, opening the need", () => {
    expect(
      notificationDestinationForEvent("claim_created", { needClaimId: "claim-123" })
    ).toEqual({ surface: "myHub", drawer: "receivedClaims", needId: "claim-123" });

    expect(
      notificationDestinationForEvent("claim_settled", { needClaimId: "claim-123" })
    ).toEqual({ surface: "myHub", drawer: "receivedClaims", needId: "claim-123" });

    expect(notificationDestinationForEvent("claim_created", {})).toEqual({
      surface: "myHub",
      drawer: "receivedClaims"
    });
  });

  it("routes resource bid notifications to My Hub received bids", () => {
    for (const eventType of [
      "resource_bid_created",
      "resource_bid_expiring_soon",
      "resource_bid_accepted",
      "resource_bid_declined",
      "resource_bid_cancelled",
      "resource_bid_expired"
    ]) {
      expect(notificationDestinationForEvent(eventType, {})).toEqual({
        surface: "myHub",
        drawer: "receivedBids"
      });
    }
  });

  it("routes token/contribution notifications to My Hub contribution", () => {
    expect(notificationDestinationForEvent("campaign_airdrop_done", {})).toEqual({
      surface: "myHub",
      drawer: "contribution"
    });
    expect(notificationDestinationForEvent("gift_tokens_received", {})).toEqual({
      surface: "myHub",
      drawer: "contribution"
    });
  });

  it("routes campaign airdrop notifications to the Campaigns tab", () => {
    expect(
      notificationDestinationForEvent("campaign_airdrop_coming_soon", { campaignId: "campaign-123" })
    ).toEqual({ surface: "campaigns", campaignId: "campaign-123" });

    expect(notificationDestinationForEvent("campaign_airdrop_coming_soon", {})).toEqual({
      surface: "campaigns"
    });
  });

  it("routes welcome reward notifications to My Hub profile", () => {
    expect(notificationDestinationForEvent("welcome_profile_reward", {})).toEqual({
      surface: "myHub",
      drawer: "profile"
    });
  });

  it("routes campaign moderation notifications to the Campaigns tab", () => {
    expect(
      notificationDestinationForEvent("campaign_moderation_note_received", { campaignId: "campaign-123" })
    ).toEqual({ surface: "campaigns", campaignId: "campaign-123", moderation: true });

    expect(
      notificationDestinationForEvent("campaign_approved", { campaignId: "campaign-123" })
    ).toEqual({ surface: "campaigns", campaignId: "campaign-123", moderation: true });

    expect(notificationDestinationForEvent("campaign_moderation_note_received", {})).toEqual({
      surface: "campaigns",
      moderation: true
    });
  });

  it("routes creator adaptation notifications to the Campaigns tab", () => {
    expect(notificationDestinationForEvent("campaign_creator_adaptation_submitted", {})).toEqual({
      surface: "campaigns",
      moderation: true
    });
  });

  it("falls back to the notifications surface for unknown event types", () => {
    expect(notificationDestinationForEvent("some_unknown_event", {})).toEqual({
      surface: "notifications"
    });
  });
});