import fs from "node:fs";
import path from "node:path";

describe("campaign approval GraphQL contract", () => {
  it("keeps approveCampaign alias documented for PostGraphile", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/campaign/approve_campaign.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("@name approveCampaign");
  });
});
