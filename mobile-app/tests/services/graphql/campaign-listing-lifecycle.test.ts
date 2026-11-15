import { print } from "graphql";
import { apolloClient } from "../../../src/services/graphql/client";
import {
  canSwitchListingCampaign, selectCampaignListingRelation, type CampaignListingRelation
} from "../../../src/services/graphql/campaignListing";
import { fetchMyNeeds, resubmitNeedToCampaign, updateNeedById, type UpsertNeedInput } from "../../../src/services/graphql/needs";
import { fetchMyResources, resubmitResourceToCampaign, updateResourceById, type UpsertResourceInput } from "../../../src/services/graphql/resources";
import { fetchCampaignNeedTriage, fetchCampaignResourceTriage, triageCampaignNeed, triageCampaignResource } from "../../../src/services/graphql/campaignModeration";
import * as operations from "../../../src/services/graphql/operations";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn(), mutate: jest.fn() } }));
jest.mock("../../../src/services/images", () => ({ uploadListingImages: jest.fn(async (images: string[]) => images) }));

const now = Date.parse("2026-11-14T12:00:00Z");
const hour = 60 * 60 * 1000;
const relation = (patch: Partial<CampaignListingRelation> = {}): CampaignListingRelation => ({
  campaignId: "campaign-1", submissionId: "submission-1", status: "PENDING", isCurrent: true,
  submittedAt: new Date(now - hour).toISOString(), rejectionNote: null,
  campaignByCampaignId: { title: "Winter drive", startAt: "2026-11-01", endAt: "2099-01-01" }, ...patch
});

describe("effective campaign listing lifecycle", () => {
  it("prefers current unended relations over newer rejections and ignores superseded and ended applications", () => {
    const current = relation();
    const rejected = relation({ campaignId: "rejected", status: "REJECTED", isCurrent: false, submittedAt: new Date(now).toISOString() });
    const ended = relation({ campaignId: "ended", status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2025-01-01", endAt: "2026-11-14T12:00:00Z" } });
    const superseded = relation({ campaignId: "superseded", status: "SUPERSEDED" });
    expect(selectCampaignListingRelation([rejected, ended, superseded, current], now)).toBe(current);
    expect(selectCampaignListingRelation([ended, superseded], now)).toBeNull();
  });
  it("retains the latest rejection as feedback, including after campaign end", () => {
    const latest = relation({ status: "REJECTED", isCurrent: false, rejectionNote: "Please clarify", submittedAt: new Date(now).toISOString() });
    expect(selectCampaignListingRelation([relation({ status: "REJECTED", isCurrent: false }), latest], now)).toBe(latest);
  });
  it.each([
    ["PENDING", 24 * hour - 1, false], ["PENDING", 24 * hour, true],
    ["PENDING", 25 * hour, true], ["ACCEPTED", 50 * hour, false], ["REJECTED", hour, true]
  ] as const)("%s after %i ms: can switch = %s", (status, elapsed, allowed) => {
    expect(canSwitchListingCampaign(relation({ status, submittedAt: new Date(now - elapsed).toISOString() }), now)).toBe(allowed);
  });
  it("releases accepted applications exactly at campaign end", () => {
    expect(canSwitchListingCampaign(relation({ status: "ACCEPTED", campaignByCampaignId: { title: "Ended", startAt: "2026-01-01", endAt: new Date(now).toISOString() } }), now)).toBe(true);
  });
});

const needInput: UpsertNeedInput = {
  title: "Edited listing", description: "Details", imageUrls: [], location: null,
  proposedTokenAmount: 10, objectRequired: true, competenceRequired: false, toolingRequired: false,
  multiplePeopleRequired: false, requiredCompetenceText: "", requiredToolingText: "", requiredPeopleCount: null,
  campaignId: "campaign-1", expiresAt: null
};
const resourceInput: UpsertResourceInput = {
  title: "Edited listing", description: "Details", defaultTokenAmount: 10, imageUrls: [], expiresAt: null,
  isProduct: true, isService: false, canBeTakenAway: true, canBeDelivered: false,
  canBeExchanged: false, canBeGifted: true, location: null, categoryCodes: [], campaignId: "campaign-1"
};

describe.each(["need", "resource"] as const)("%s service lifecycle", (kind) => {
  const isNeed = kind === "need";
  const record = (relations: CampaignListingRelation[]) => ({
    id: "listing-1", title: "A listing", resourceCategoryAssignmentsByResourceId: { nodes: [] },
    [isNeed ? "campaignNeedsByNeedId" : "campaignResourcesByResourceId"]: { nodes: relations }
  });
  const updatedRoot = isNeed ? "updateNeedById" : "updateResourceById";
  const linkedRoot = isNeed ? "linkCampaignNeed" : "linkCampaignResource";
  const payloadKey = isNeed ? "campaignNeed" : "campaignResource";
  const update = (campaignId: string | null) => isNeed
    ? updateNeedById("listing-1", { ...needInput, campaignId })
    : updateResourceById("listing-1", { ...resourceInput, campaignId });
  const resubmit = () => isNeed ? resubmitNeedToCampaign("listing-1", "campaign-1") : resubmitResourceToCampaign("listing-1", "campaign-1");

  beforeEach(() => jest.clearAllMocks());

  it("normalizes the effective relation and rejection note instead of taking the first row", async () => {
    const rejected = relation({ status: "REJECTED", isCurrent: false, rejectionNote: "Please clarify" });
    jest.mocked(apolloClient.query).mockResolvedValue({ data: {
      [isNeed ? "allNeeds" : "allResources"]: { nodes: [record([relation({ status: "SUPERSEDED" }), rejected])] }
    } });
    const items = isNeed ? await fetchMyNeeds("owner") : await fetchMyResources({ creatorAccountId: "owner" });
    expect(items[0]).toMatchObject({ campaignId: "campaign-1", campaignRelation: rejected });
  });

  it.each(["PENDING", "ACCEPTED", "REJECTED"] as const)("editing the same %s relation never resubmits", async (status) => {
    jest.mocked(apolloClient.mutate).mockResolvedValue({ data: { [updatedRoot]: { [kind]: record([relation({ status })]) } } });
    await update("campaign-1");
    expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
  });

  it("switches by linking directly and returns the fresh submission, never unlinking", async () => {
    const next = relation({ campaignId: "campaign-2", submissionId: "submission-2" });
    jest.mocked(apolloClient.mutate)
      .mockResolvedValueOnce({ data: { [updatedRoot]: { [kind]: record([relation()]) } } })
      .mockResolvedValueOnce({ data: { [linkedRoot]: { [payloadKey]: next } } });
    expect(await update("campaign-2")).toMatchObject({ campaignId: "campaign-2", campaignRelation: next });
    expect(apolloClient.mutate).toHaveBeenCalledTimes(2);
    const link = jest.mocked(apolloClient.mutate).mock.calls[1]![0];
    expect(print(link.mutation)).toContain(linkedRoot);
    expect(link.variables).toEqual({ campaignId: "campaign-2", [isNeed ? "needId" : "resourceId"]: "listing-1" });
  });

  it("never unlinks when an empty choice is passed", async () => {
    jest.mocked(apolloClient.mutate).mockResolvedValue({ data: { [updatedRoot]: { [kind]: record([relation()]) } } });
    expect(await update(null)).toMatchObject({ campaignId: "campaign-1" });
    expect(apolloClient.mutate).toHaveBeenCalledTimes(1);
  });

  it("resubmits explicitly using the same composite key and receives a new submission ID", async () => {
    const next = relation({ submissionId: "submission-2" });
    jest.mocked(apolloClient.mutate).mockResolvedValue({ data: { [linkedRoot]: { [payloadKey]: next } } });
    expect(await resubmit()).toEqual(next);
    expect(jest.mocked(apolloClient.mutate).mock.calls[0]![0].variables).toEqual({ campaignId: "campaign-1", [isNeed ? "needId" : "resourceId"]: "listing-1" });
  });

  it("filters superseded, non-current, and ended applications from triage", async () => {
    const nodes = [relation(), relation({ status: "SUPERSEDED" }), relation({ isCurrent: false }),
      relation({ campaignByCampaignId: { title: "Ended", startAt: "2025-01-01", endAt: "2025-12-31" } })]
      .map((item, index) => ({ ...item, [isNeed ? "needId" : "resourceId"]: `listing-${index}` }));
    jest.mocked(apolloClient.query).mockResolvedValue({ data: { [isNeed ? "allCampaignNeeds" : "allCampaignResources"]: { nodes } } });
    const items = isNeed ? await fetchCampaignNeedTriage("campaign-1") : await fetchCampaignResourceTriage("campaign-1");
    expect(items).toHaveLength(1);
    expect(items[0]?.submissionId).toBe("submission-1");
  });

  it.each(["accept", "reject"] as const)("passes expectedSubmissionId for %s and optional trimmed rejection note", async (action) => {
    jest.mocked(apolloClient.mutate).mockResolvedValue({ data: {} });
    const triage = isNeed ? triageCampaignNeed : triageCampaignResource;
    await triage("campaign-1", "listing-1", action, "submission-1", "  Please clarify  ");
    expect(jest.mocked(apolloClient.mutate).mock.calls[0]![0].variables).toEqual({
      campaignId: "campaign-1", [isNeed ? "needId" : "resourceId"]: "listing-1", expectedSubmissionId: "submission-1",
      ...(action === "reject" ? { rejectionNote: "Please clarify" } : {})
    });
  });
});

it.each([
  operations.MY_NEEDS_QUERY, operations.NEED_BY_ID_QUERY, operations.UPDATE_NEED_BY_ID_MUTATION,
  operations.MY_RESOURCES_QUERY, operations.UPDATE_RESOURCE_BY_ID_MUTATION
])("reads lifecycle relations in submission order without limiting to an arbitrary first row", (document) => {
  const query = print(document);
  expect(query).toContain("orderBy: SUBMITTED_AT_DESC");
  expect(query).toContain("isCurrent");
  expect(query).toContain("rejectionNote");
  expect(query).toContain("endAt");
  expect(query).not.toMatch(/campaign(?:NeedsByNeedId|ResourcesByResourceId)\(first: 1/);
});