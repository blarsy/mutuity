import type { Task } from "graphile-worker";
import { Client } from "pg";

import { logWorkerInfo } from "../../logging/operationalLogger.js";

type ExpireNeedsPayload = {
  nowIso?: string;
};

type ExpireNeedsResult = {
  expired_need_count: number;
  expired_claim_count: number;
};

const EXPIRE_OVERDUE_NEEDS_AND_CLAIMS_SQL =
  "select * from app_private.expire_overdue_needs_and_claims();";

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

    await logWorkerInfo(
      `[worker] expire_needs tick at ${now.toISOString()} (needs=${counts.expired_need_count}, claims=${counts.expired_claim_count})`,
      {
        task: "expire_needs",
        expiredNeeds: counts.expired_need_count,
        expiredClaims: counts.expired_claim_count
      }
    );
  } finally {
    await client.end();
  }
};
