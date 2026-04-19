import fs from "node:fs";
import path from "node:path";

describe("need creation GraphQL contract", () => {
  it("keeps createNeed alias documented for PostGraphile", () => {
    const sqlPath = path.resolve(process.cwd(), "../database/functions/need/create_need.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    expect(sql).toContain("@name createNeed");
  });
});
