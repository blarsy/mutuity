import fs from "node:fs";
import path from "node:path";

describe("campaign create SQL", () => {
  it("enforces pending moderation and date validation in create_campaign", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/campaign/create_campaign.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("validate_campaign_dates");
    expect(sql).toContain("'pending'");
    expect(sql).toContain("Authentication required");
  });
});
