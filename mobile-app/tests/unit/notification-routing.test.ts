import { notificationDestinationForEvent } from "../../src/services/notifications/notificationRouting";

describe("mobile notification routing", () => {
  it.each(["campaign_created_pending", "support_report_created"])("keeps %s in the inbox without an admin surface", eventType => {
    expect(notificationDestinationForEvent(eventType, { campaignId: "campaign-123", reportId: "report-123", url: "https://untrusted.invalid" }))
      .toEqual({ surface: "notifications" });
    expect(notificationDestinationForEvent(eventType, {})).toEqual({ surface: "notifications" });
  });

  it("routes pending submissions to campaign moderation, ignoring payload URLs", () => {
    expect(notificationDestinationForEvent("campaign_listing_pending", { campaignId: "campaign-123", url: "https://untrusted.invalid" }))
      .toEqual({ surface: "campaigns", campaignId: "campaign-123", moderation: true });
    expect(notificationDestinationForEvent("campaign_listing_accepted", { campaignId: "campaign-123" }))
      .toEqual({ surface: "campaigns", campaignId: "campaign-123" });
  });

  it.each(["need", "resource"] as const)("routes rejected %s submissions to the owner editor, never a public detail", kind => {
    expect(notificationDestinationForEvent("campaign_listing_rejected", { listingKind: kind, listingId: "listing-123", submissionId: "not-the-listing", url: "/needs/wrong" }))
      .toEqual({ surface: "myHub", drawer: kind === "need" ? "myNeeds" : "myResources", editListing: { kind, id: "listing-123" } });
  });

  it.each([{}, { listingId: "123" }, { listingId: "123", listingKind: "other" }, { listingKind: "need", listingId: 123 }])(
    "does not guess an editor for a malformed payload %j", payload => {
      expect(notificationDestinationForEvent("campaign_listing_rejected", payload)).toEqual({ surface: "notifications" });
    }
  );

  it.each(["claim_created", "claim_withdrawn", "need_expired_claims_declined"])(
    "routes %s to received claims using the need ID, not the claim ID",
    eventType => {
      expect(notificationDestinationForEvent(eventType, { needId: "need-123", needClaimId: "claim-456" }))
        .toEqual({ surface: "myHub", drawer: "receivedClaims", needId: "need-123" });
      expect(notificationDestinationForEvent(eventType, { needClaimId: "claim-456" }))
        .toEqual({ surface: "myHub", drawer: "receivedClaims" });
    }
  );

  it.each(["claim_settled", "claim_declined", "claim_expired", "claim_need_deactivated"])(
    "routes %s to the claimer's sent claims",
    eventType => {
      expect(notificationDestinationForEvent(eventType, { needId: "need-123", needClaimId: "claim-456" }))
        .toEqual({ surface: "myHub", drawer: "sentClaims", needId: "need-123" });
      expect(notificationDestinationForEvent(eventType, {}))
        .toEqual({ surface: "myHub", drawer: "sentClaims" });
    }
  );

  it.each(["resource_bid_created", "resource_bid_expiring_soon"])(
    "routes %s to received bids",
    eventType => {
      expect(notificationDestinationForEvent(eventType, {}))
        .toEqual({ surface: "myHub", drawer: "receivedBids" });
    }
  );

  it("routes bid responses and closures to the bidder's sent bids", () => {
    for (const eventType of [
      "resource_bid_accepted",
      "resource_bid_declined",
      "resource_bid_cancelled",
      "resource_bid_expired"
    ]) {
      expect(notificationDestinationForEvent(eventType, {})).toEqual({
        surface: "myHub",
        drawer: "sentBids"
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