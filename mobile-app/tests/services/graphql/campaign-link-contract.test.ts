import { print } from "graphql";
import { CREATE_CAMPAIGN_RESOURCE_MUTATION, DELETE_CAMPAIGN_RESOURCE_MUTATION } from "../../../src/services/graphql/operations";

describe("campaign-resource function contracts", () => {
  it("uses validated linking rather than generated table creation", () => {
    const operation = print(CREATE_CAMPAIGN_RESOURCE_MUTATION);
    expect(operation).toMatch(/linkCampaignResource\(\s*input:/);
    expect(operation).toContain("pCampaignId: $campaignId");
    expect(operation).toContain("pResourceId: $resourceId");
    expect(operation).not.toMatch(/createCampaignResource\(\s*input:/);
    expect(operation).not.toContain("status:");
  });
  it("uses authorized unlink rather than generated table deletion", () => {
    const operation = print(DELETE_CAMPAIGN_RESOURCE_MUTATION);
    expect(operation).toMatch(/unlinkCampaignResource\(\s*input:/);
    expect(operation).not.toContain("deleteCampaignResourceByCampaignIdAndResourceId");
  });
});