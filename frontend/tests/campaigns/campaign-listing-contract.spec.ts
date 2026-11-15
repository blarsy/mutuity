import { CAMPAIGN_NEED_TRIAGE_QUERY, ACCEPT_CAMPAIGN_NEED_MUTATION, REJECT_CAMPAIGN_NEED_MUTATION } from "../../src/features/campaigns/campaignNeedTriage.queries";
import { CAMPAIGN_RESOURCE_TRIAGE_QUERY, ACCEPT_CAMPAIGN_RESOURCE_MUTATION, REJECT_CAMPAIGN_RESOURCE_MUTATION } from "../../src/features/campaigns/campaignResourceTriage.queries";
import { CREATE_CAMPAIGN_NEED_MUTATION, NEED_EDIT_DETAIL_QUERY } from "../../src/features/needs/needs.queries";
import { CREATE_CAMPAIGN_RESOURCE_MUTATION, RESOURCE_EDIT_DETAIL_QUERY } from "../../src/features/resources/resources.queries";

describe.each([
  ["need", CAMPAIGN_NEED_TRIAGE_QUERY, ACCEPT_CAMPAIGN_NEED_MUTATION, REJECT_CAMPAIGN_NEED_MUTATION, NEED_EDIT_DETAIL_QUERY, CREATE_CAMPAIGN_NEED_MUTATION],
  ["resource", CAMPAIGN_RESOURCE_TRIAGE_QUERY, ACCEPT_CAMPAIGN_RESOURCE_MUTATION, REJECT_CAMPAIGN_RESOURCE_MUTATION, RESOURCE_EDIT_DETAIL_QUERY, CREATE_CAMPAIGN_RESOURCE_MUTATION]
] as const)("%s submission contract", (kind, triage, accept, reject, edit, link) => {
  it("requires a submission ID for both decisions and permits an optional rejection note", () => {
    for (const document of [accept, reject]) {
      expect(document.loc?.source.body).toContain("$expectedSubmissionId: UUID!");
      expect(document.loc?.source.body).toContain("expectedSubmissionId: $expectedSubmissionId");
    }
    expect(reject.loc?.source.body).toContain("$rejectionNote: String)");
    expect(reject.loc?.source.body).toContain("rejectionNote: $rejectionNote");
  });

  it("fetches rejected triage rows and every editor relation for client lifecycle filtering", () => {
    expect(triage.loc?.source.body).not.toContain("isCurrent: true");
    expect(edit.loc?.source.body).toContain("orderBy: SUBMITTED_AT_DESC");
    expect(edit.loc?.source.body).not.toContain("first: 1");
    for (const document of [triage, edit]) {
      for (const field of ["submissionId", "submittedAt", "rejectionNote", "isCurrent", "status", "startAt", "endAt"]) {
        expect(document.loc?.source.body).toContain(field);
      }
    }
  });

  it("includes the standard card's public listing and creator fields", () => {
    for (const field of ["description", "imageUrls", "expiresAt", "createdAt", "accountByCreatorAccountId", "displayName", "avatarUrl"]) {
      expect(triage.loc?.source.body).toContain(field);
    }
  });

  it("links using function inputs while retaining the campaign/listing composite key", () => {
    const suffix = kind === "need" ? "Need" : "Resource";
    expect(link.loc?.source.body).toContain(`linkCampaign${suffix}(input: { pCampaignId: $campaignId, p${suffix}Id: $${kind}Id })`);
    expect(link.loc?.source.body).toContain("campaignId");
    expect(link.loc?.source.body).toContain(`${kind}Id`);
  });
});