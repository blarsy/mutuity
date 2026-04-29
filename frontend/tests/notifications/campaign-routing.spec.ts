import { resolveCampaignModerationPrefill } from "../../src/features/admin/adminCampaignFilters";
import { notificationUrlForEvent } from "../../src/features/notifications/notificationRouting";

describe("campaign moderation notification routing", () => {
  it("routes creator campaign notifications to the moderation page", () => {
    expect(
      notificationUrlForEvent("campaign_moderation_note_received", {
        campaignId: "campaign-123"
      })
    ).toBe("/campaigns/campaign-123/moderation");

    expect(
      notificationUrlForEvent("campaign_approved", {
        campaignId: "campaign-123"
      })
    ).toBe("/campaigns/campaign-123/moderation");
  });

  it("routes creator adaptation notifications to filtered admin campaigns", () => {
    expect(
      notificationUrlForEvent("campaign_creator_adaptation_submitted", {
        creatorName: "Alice Example"
      })
    ).toBe("/admin/campaigns?search=Alice%20Example&status=AWAITING_ADAPTATION");

    expect(notificationUrlForEvent("campaign_creator_adaptation_submitted", {})).toBe(
      "/admin/campaigns?status=AWAITING_ADAPTATION"
    );
  });

  it("parses admin campaign search and status prefill from notification query params", () => {
    expect(
      resolveCampaignModerationPrefill({
        search: "  Alice Example  ",
        status: "awaiting_adaptation"
      })
    ).toEqual({
      prefilledSearch: "Alice Example",
      prefilledStatus: "AWAITING_ADAPTATION"
    });
  });

  it("rejects invalid admin campaign status prefill values", () => {
    expect(
      resolveCampaignModerationPrefill({
        search: ["Alice Example"],
        status: "unknown"
      })
    ).toEqual({
      prefilledSearch: "",
      prefilledStatus: null
    });
  });
});