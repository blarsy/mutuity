import { print } from "graphql";
import { apolloClient } from "../../../src/services/graphql/client";
import { NeedIntensity } from "../../../src/services/graphql/generated";
import { fetchNeedForEdit } from "../../../src/services/graphql/needs";
import { fetchResourceForEdit } from "../../../src/services/graphql/resources";
import { NEED_BY_ID_QUERY, RESOURCE_BY_ID_QUERY } from "../../../src/services/graphql/operations";

jest.mock("../../../src/services/graphql/client", () => ({ apolloClient: { query: jest.fn(), mutate: jest.fn() } }));
jest.mock("../../../src/services/images", () => ({ uploadListingImages: jest.fn() }));

const rejected = {
  campaignId: "campaign-1", submissionId: "submission-1", status: "REJECTED", isCurrent: false,
  submittedAt: "2026-11-14T12:00:00Z", rejectionNote: "Please clarify the description",
  campaignByCampaignId: { title: "Winter drive", startAt: "2026-11-01", endAt: "2099-01-01" }
};
const common = {
  id: "old-listing", creatorAccountId: "owner", title: "Older listing", description: "Original details",
  createdAt: "2020-01-01", expiresAt: "2020-02-01", isActive: false,
  imageUrls: ["https://example.test/one.jpg", null, ""], location: "Brussels", latitude: "50.85", longitude: "4.35"
};

beforeEach(() => jest.resetAllMocks());

describe.each(["need", "resource"] as const)("%s editor ID lookup", kind => {
  const isNeed = kind === "need";
  const root = isNeed ? "needById" : "resourceById";
  const document = isNeed ? NEED_BY_ID_QUERY : RESOURCE_BY_ID_QUERY;
  const fetchEditor = isNeed ? fetchNeedForEdit : fetchResourceForEdit;
  const record = {
    ...common,
    [isNeed ? "campaignNeedsByNeedId" : "campaignResourcesByResourceId"]: { nodes: [
      { ...rejected, campaignId: "superseded", status: "SUPERSEDED", isCurrent: false, submittedAt: "2026-11-15" },
      rejected
    ] },
    ...(isNeed ? {
      proposedTopesAmount: 420, intensity: NeedIntensity.Sharing, objectRequired: false,
      competenceRequired: true, toolingRequired: true, multiplePeopleRequired: true,
      requiredCompetenceText: "Repair", requiredToolingText: "Drill", requiredPeopleCount: 3,
      accountByCreatorAccountId: { displayName: "Owner" }, needClaimsByNeedId: { nodes: [] }
    } : {
      defaultTokenAmount: 420, updatedAt: "2026-11-14", isProduct: false, isService: true,
      canBeTakenAway: true, canBeDelivered: true, canBeExchanged: true, canBeGiven: true,
      resourceCategoryAssignmentsByResourceId: { nodes: [{ categoryCode: 3 }, { categoryCode: 8 }] }
    })
  };

  it("loads an old, expired/inactive listing without pagination and preserves the complete editor model", async () => {
    jest.mocked(apolloClient.query).mockResolvedValue({ data: { [root]: record } });
    const item = await fetchEditor("old-listing", "owner");
    expect(apolloClient.query).toHaveBeenCalledTimes(1);
    expect(apolloClient.query).toHaveBeenCalledWith({ query: document, variables: { id: "old-listing" }, fetchPolicy: "network-only" });
    expect(item).toMatchObject({
      id: common.id, title: common.title, description: common.description, expiresAt: common.expiresAt,
      imageUrls: ["https://example.test/one.jpg"], location: { label: "Brussels", latitude: 50.85, longitude: 4.35 },
      campaignId: rejected.campaignId, campaignRelation: rejected,
      ...(isNeed ? {
        proposedTokenAmount: 420, intensity: NeedIntensity.Sharing, objectRequired: false,
        competenceRequired: true, toolingRequired: true, multiplePeopleRequired: true,
        requiredCompetenceText: "Repair", requiredToolingText: "Drill", requiredPeopleCount: 3,
        creatorAccountId: "owner", createdAt: common.createdAt
      } : {
        defaultTokenAmount: 420, updatedAt: "2026-11-14", isActive: false, isProduct: false, isService: true,
        canBeTakenAway: true, canBeDelivered: true, canBeExchanged: true, canBeGifted: true, categoryCodes: [3, 8]
      })
    });
  });

  it.each([null, { creatorAccountId: "another-owner" }, { creatorAccountId: null }, { id: "different-id" }])(
    "rejects deleted, non-owned, or mismatched records: %j", async patch => {
      jest.mocked(apolloClient.query).mockResolvedValue({ data: { [root]: patch === null ? null : { ...record, ...patch } } });
      expect(await fetchEditor("old-listing", "owner")).toBeNull();
    }
  );

  it("propagates offline failures to the navigation error state", async () => {
    jest.mocked(apolloClient.query).mockRejectedValue(new Error("offline"));
    await expect(fetchEditor("old-listing", "owner")).rejects.toThrow("offline");
  });

  it("requests complete editing fields and ordered lifecycle relations, not a bounded owner list", () => {
    const query = print(document);
    expect(query).toContain(`${root}(id: $id)`);
    expect(query).not.toMatch(/allResources|allNeeds|isActive: true/);
    for (const field of ["creatorAccountId", "imageUrls", "location", "latitude", "longitude", "expiresAt",
      "submissionId", "status", "rejectionNote", "submittedAt", "isCurrent", "startAt", "endAt",
      ...(isNeed ? ["objectRequired", "competenceRequired", "toolingRequired", "multiplePeopleRequired",
        "requiredCompetenceText", "requiredToolingText", "requiredPeopleCount", "proposedTopesAmount", "intensity"]
        : ["updatedAt", "categoryCode", "isActive", "isProduct", "isService", "canBeTakenAway", "canBeDelivered", "canBeExchanged", "canBeGiven", "defaultTokenAmount"])]) {
      expect(query).toContain(field);
    }
    expect(query).toContain("orderBy: SUBMITTED_AT_DESC");
  });
});