import fs from "node:fs";
import path from "node:path";

describe("campaign resource triage GraphQL contract", () => {
  it("keeps acceptCampaignResource and rejectCampaignResource aliases documented for PostGraphile", () => {
    const acceptSqlPath = path.resolve(
      process.cwd(),
      "../database/functions/campaign_resource/accept_campaign_resource.sql"
    );
    const rejectSqlPath = path.resolve(
      process.cwd(),
      "../database/functions/campaign_resource/reject_campaign_resource.sql"
    );
    const acceptSql = fs.readFileSync(acceptSqlPath, "utf8");
    const rejectSql = fs.readFileSync(rejectSqlPath, "utf8");

    expect(acceptSql).toContain("@name acceptCampaignResource");
    expect(rejectSql).toContain("@name rejectCampaignResource");
  });
});
