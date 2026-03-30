import fs from "node:fs";
import path from "node:path";

describe("campaign moderation note SQL", () => {
  it("restricts moderation notes to managers and pending campaigns", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/campaign/add_campaign_moderation_note.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("Only managers can add moderation notes");
    expect(sql).toContain("pending campaigns");
    expect(sql).toContain("Moderation note body is required");
  });
});
