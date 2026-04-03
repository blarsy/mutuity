import fs from "node:fs";
import path from "node:path";

describe("campaign GraphQL contract", () => {
  it("keeps createCampaign alias documented for PostGraphile", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/campaign/create_campaign.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("@name createCampaign");
  });
});
