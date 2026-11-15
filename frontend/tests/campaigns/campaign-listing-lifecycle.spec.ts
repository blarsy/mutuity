import {
  campaignJoinStatus,
  campaignSelectionLocked,
  effectiveCampaignRelation,
  isCurrentCampaignRelation,
  shouldSubmitCampaignLink,
  type CampaignListingRelation
} from "../../src/features/campaigns/campaignListingLifecycle";

const now = Date.parse("2026-11-14T12:00:00Z");
const hour = 3_600_000;
function relation(patch: Partial<CampaignListingRelation> = {}): CampaignListingRelation {
  return {
    campaignId: "campaign-a", submissionId: "submission-a", status: "PENDING", isCurrent: true,
    submittedAt: new Date(now - hour).toISOString(), actedAt: null, rejectionNote: null,
    campaignByCampaignId: { title: "Campaign A", startAt: "2026-11-01T00:00:00Z", endAt: "2026-12-01T00:00:00Z" },
    ...patch
  };
}

describe("campaign listing lifecycle", () => {
  it("prefers the ongoing current relation even when a rejection is newer", () => {
    const current = relation();
    const rejection = relation({ campaignId: "campaign-b", status: "REJECTED", isCurrent: false, submittedAt: new Date(now).toISOString() });
    expect(effectiveCampaignRelation([rejection, current], now)).toBe(current);
  });

  it("ignores superseded and stale ended current links and chooses the most recent rejected feedback", () => {
    const rejected = relation({ isCurrent: false, status: "REJECTED", submittedAt: new Date(now).toISOString() });
    const olderRejected = relation({ isCurrent: false, status: "REJECTED", submittedAt: new Date(now - 5 * hour).toISOString() });
    const ended = relation({ status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2026-10-01", endAt: new Date(now).toISOString() } });
    expect(isCurrentCampaignRelation(ended, now)).toBe(false);
    expect(effectiveCampaignRelation([olderRejected, ended, relation({ status: "SUPERSEDED" }), rejected], now)).toBe(rejected);
    expect(effectiveCampaignRelation([ended, relation({ status: "SUPERSEDED" })], now)).toBeNull();
  });

  it("does not require startAt <= now for an existing nonended current slot", () => {
    expect(isCurrentCampaignRelation(relation({ campaignByCampaignId: { title: "Future", startAt: "2026-11-20", endAt: "2026-12-01" } }), now)).toBe(true);
  });

  it.each(["ACCEPTED", "SUPERSEDED"] as const)("does not revive old rejected feedback after a newer %s submission ends", status => {
    const rejected = relation({ status: "REJECTED", isCurrent: false, submittedAt: new Date(now - 5 * hour).toISOString() });
    const newer = relation({ status, submittedAt: new Date(now - hour).toISOString(),
      campaignByCampaignId: { title: "Ended", startAt: "2026-10-01", endAt: new Date(now).toISOString() } });
    expect(effectiveCampaignRelation([rejected, newer], now)).toBeNull();
  });

  it.each([23, 23.999, 24, 25])("unlocks pending replacement at exactly 24h (%s hours)", age => {
    expect(campaignSelectionLocked(relation({ submittedAt: new Date(now - age * hour).toISOString() }), now)).toBe(age < 24);
  });

  it("keeps accepted locked regardless of submission age, but releases rejected and ended slots", () => {
    expect(campaignSelectionLocked(relation({ status: "ACCEPTED", submittedAt: new Date(now - 100 * hour).toISOString() }), now)).toBe(true);
    expect(campaignSelectionLocked(relation({ status: "REJECTED", isCurrent: false }), now)).toBe(false);
    expect(campaignSelectionLocked(relation({ status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2026-01-01", endAt: new Date(now).toISOString() } }), now)).toBe(false);
    expect(campaignSelectionLocked(relation({ submittedAt: "invalid" }), now)).toBe(true);
  });

  it("blocks public joins to another campaign only while the existing slot is locked", () => {
    expect(campaignJoinStatus([relation()], "campaign-b", now)).toBe("PENDING");
    expect(campaignJoinStatus([relation({ status: "ACCEPTED" })], "campaign-b", now)).toBe("ACCEPTED");
    expect(campaignJoinStatus([relation({ submittedAt: new Date(now - 24 * hour).toISOString() })], "campaign-b", now)).toBeNull();
    expect(campaignJoinStatus([relation({ status: "REJECTED", isCurrent: false })], "campaign-a", now)).toBe("REJECTED");
    expect(campaignJoinStatus([relation({ status: "SUPERSEDED", isCurrent: false })], "campaign-a", now)).toBeNull();
  });

  it("saving alone never resubmits; explicit resubmit or choosing another campaign links directly", () => {
    expect(shouldSubmitCampaignLink("campaign-a", "campaign-a")).toBe(false);
    expect(shouldSubmitCampaignLink("campaign-a", "campaign-a", true)).toBe(true);
    expect(shouldSubmitCampaignLink("campaign-a", "campaign-b")).toBe(true);
    expect(shouldSubmitCampaignLink("", "campaign-b")).toBe(true);
    expect(shouldSubmitCampaignLink("campaign-a", "")).toBe(false);
  });
});