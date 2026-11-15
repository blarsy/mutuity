import { print } from "graphql";
import * as operations from "../../../src/services/graphql/operations";

describe("campaign-resource function contracts", () => {
  it("uses validated linking rather than generated table creation", () => {
    const operation = print(operations.CREATE_CAMPAIGN_RESOURCE_MUTATION);
    expect(operation).toMatch(/linkCampaignResource\(\s*input:/);
    expect(operation).toContain("pCampaignId: $campaignId");
    expect(operation).toContain("pResourceId: $resourceId");
    expect(operation).not.toMatch(/createCampaignResource\(\s*input:/);
    expect(operation).not.toContain("status:");
  });
  it("links needs through the validated function too", () => {
    const operation = print(operations.CREATE_CAMPAIGN_NEED_MUTATION);
    expect(operation).toContain("linkCampaignNeed(input:");
    expect(operation).toContain("pCampaignId: $campaignId");
    expect(operation).toContain("pNeedId: $needId");
    expect(operation).not.toContain("createCampaignNeed(input:");
  });
  it("does not expose campaign unlink or delete operations", () => {
    expect(Object.keys(operations).filter((key) => /DELETE_CAMPAIGN/.test(key))).toEqual([]);
  });
  it.each([
    operations.ACCEPT_CAMPAIGN_NEED_MUTATION, operations.REJECT_CAMPAIGN_NEED_MUTATION,
    operations.ACCEPT_CAMPAIGN_RESOURCE_MUTATION, operations.REJECT_CAMPAIGN_RESOURCE_MUTATION
  ])("requires a guarded submission ID for decisions", (document) => {
    expect(print(document)).toContain("$expectedSubmissionId: UUID!");
    expect(print(document)).toContain("expectedSubmissionId: $expectedSubmissionId");
  });
  it.each([operations.REJECT_CAMPAIGN_NEED_MUTATION, operations.REJECT_CAMPAIGN_RESOURCE_MUTATION])("supports optional rejection feedback", (document) => {
    expect(print(document)).toContain("$rejectionNote: String");
    expect(print(document)).toContain("rejectionNote: $rejectionNote");
  });
});