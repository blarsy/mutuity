import type { Task } from "graphile-worker";
import { Client } from "pg";

import { loadSql } from "../../db/loadSql.js";

type ExpireNeedsPayload = {
  nowIso?: string;
};

type ExpireNeedsResult = {
  expired_need_count: number;
  expired_claim_count: number;
};

const EXPIRE_OVERDUE_NEEDS_AND_CLAIMS_SQL = loadSql(
  new URL("../../db/sql/worker/expire_overdue_needs_and_claims.sql", import.meta.url)
);

export const expireNeedsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as ExpireNeedsPayload;
  const now = typedPayload.nowIso ? new Date(typedPayload.nowIso) : new Date();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<ExpireNeedsResult>(EXPIRE_OVERDUE_NEEDS_AND_CLAIMS_SQL);
    const counts = result.rows[0] ?? {
      expired_need_count: 0,
      expired_claim_count: 0
    };

    console.log(
      `[worker] expire_needs tick at ${now.toISOString()} (needs=${counts.expired_need_count}, claims=${counts.expired_claim_count})`
    );
  } finally {
    await client.end();
  }
};
