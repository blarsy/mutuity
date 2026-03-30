import fs from "node:fs";
import path from "node:path";

describe("campaign moderation GraphQL contract", () => {
  it("keeps addCampaignModerationNote alias documented for PostGraphile", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/campaign/add_campaign_moderation_note.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("@name addCampaignModerationNote");
  });
});
