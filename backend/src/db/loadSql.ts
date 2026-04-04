import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sqlCache = new Map<string, string>();

export function loadSql(source: string | URL) {
  const filePath = source instanceof URL ? fileURLToPath(source) : source;
  const cached = sqlCache.get(filePath);

  if (cached) {
    return cached;
  }

  const sql = readFileSync(filePath, "utf8").trim();
  sqlCache.set(filePath, sql);
  return sql;
}
