import fs from "node:fs";
import path from "node:path";

describe("campaign need triage GraphQL contract", () => {
  it("keeps acceptCampaignNeed and rejectCampaignNeed aliases documented for PostGraphile", () => {
    const acceptSqlPath = path.resolve(
      process.cwd(),
      "../database/functions/campaign_need/accept_campaign_need.sql"
    );
    const rejectSqlPath = path.resolve(
      process.cwd(),
      "../database/functions/campaign_need/reject_campaign_need.sql"
    );
    const acceptSql = fs.readFileSync(acceptSqlPath, "utf8");
    const rejectSql = fs.readFileSync(rejectSqlPath, "utf8");

    expect(acceptSql).toContain("@name acceptCampaignNeed");
    expect(rejectSql).toContain("@name rejectCampaignNeed");
  });
});
