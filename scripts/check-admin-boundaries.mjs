import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import pg from "pg";

const connectionString = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Set TEST_DATABASE_URL or DATABASE_URL to the database to verify.");
  process.exitCode = 1;
} else {
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    await client.query("begin read only");
    await client.query("set local statement_timeout = '15s'");
    const sql = await readFile(fileURLToPath(new URL("../database/verify_admin_privilege_boundaries.sql", import.meta.url)), "utf8");
    const { rows } = await client.query(sql);
    if (rows.length) {
      console.error("Authorization boundary violations:");
      console.table(rows);
      process.exitCode = 1;
    } else {
      console.log("Authorization boundary catalog checks passed (read-only).");
    }
  } catch (error) {
    console.error("Authorization boundary verification failed:", error.message);
    process.exitCode = 1;
  } finally {
    try { await client.query("rollback"); } catch { /* Connection may have failed. */ }
    await client.end();
  }
}