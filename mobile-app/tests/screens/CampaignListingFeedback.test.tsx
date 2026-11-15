import { act, renderHook } from "@testing-library/react-native";
import { useCampaignListingRules } from "../../src/screens/campaigns/CampaignListingFeedback";
import type { CampaignListingRelation } from "../../src/services/graphql/campaignListing";

const now = Date.parse("2026-11-14T12:00:00Z");
const day = 24 * 60 * 60 * 1000;
const relation = (patch: Partial<CampaignListingRelation> = {}): CampaignListingRelation => ({
  campaignId: "campaign-1", submissionId: "submission-1", status: "PENDING", isCurrent: true,
  submittedAt: new Date(now - day + 1000).toISOString(), rejectionNote: null,
  campaignByCampaignId: { title: "Winter drive", startAt: "2026-11-01", endAt: "2026-12-01" }, ...patch
});

beforeEach(() => { jest.useFakeTimers(); jest.setSystemTime(now); });
afterEach(() => jest.useRealTimers());

it("unlocks switching at 24h without inventing a timeout status or detaching the pending application", () => {
  const pending = relation();
  const screen = renderHook(() => useCampaignListingRules(pending));
  expect(screen.result.current).toEqual({ canSwitch: false, requiresCampaign: true, canResubmit: false });
  act(() => { jest.advanceTimersByTime(1001); });
  expect(screen.result.current).toEqual({ canSwitch: true, requiresCampaign: true, canResubmit: false });
  expect(pending.status).toBe("PENDING");
  screen.unmount();
  expect(jest.getTimerCount()).toBe(0);
});

it("evaluates refreshed relations against the current clock rather than mount time", () => {
  const screen = renderHook(({ value }: { value: CampaignListingRelation | null }) => useCampaignListingRules(value), {
    initialProps: { value: null as CampaignListingRelation | null }
  });
  act(() => { jest.setSystemTime(now + 2000); });
  screen.rerender({ value: relation() });
  expect(screen.result.current).toEqual({ canSwitch: true, requiresCampaign: true, canResubmit: false });
});

it.each(["ACCEPTED", "REJECTED"] as const)("reconciles %s permissions at campaign end", status => {
  const value = relation({ status, isCurrent: status === "ACCEPTED",
    campaignByCampaignId: { title: "Ending", startAt: "2026-11-01", endAt: new Date(now + 1000).toISOString() } });
  const screen = renderHook(() => useCampaignListingRules(value));
  expect(screen.result.current).toEqual({
    canSwitch: status === "REJECTED", requiresCampaign: status === "ACCEPTED", canResubmit: status === "REJECTED"
  });
  act(() => { jest.advanceTimersByTime(1001); });
  expect(screen.result.current).toEqual({ canSwitch: true, requiresCampaign: false, canResubmit: false });
});