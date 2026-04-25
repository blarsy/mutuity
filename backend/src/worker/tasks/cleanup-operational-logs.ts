import type { Task } from "graphile-worker";
import { Client } from "pg";

import { logWorkerError, logWorkerInfo } from "../../logging/operationalLogger.js";

type CleanupOperationalLogsPayload = {
  nowIso?: string;
};

type CleanupOperationalLogsResult = {
  deleted_count: number;
};

const CLEANUP_OPERATIONAL_LOGS_SQL =
  "select app_public.cleanup_operational_logs($1::timestamptz) as deleted_count;";

export const cleanupOperationalLogsTask: Task = async payload => {
  const typedPayload = (payload ?? {}) as CleanupOperationalLogsPayload;
  const nowIso = typedPayload.nowIso ?? new Date().toISOString();
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Missing DATABASE_URL.");
  }

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const result = await client.query<CleanupOperationalLogsResult>(CLEANUP_OPERATIONAL_LOGS_SQL, [nowIso]);
    const deletedCount = result.rows[0]?.deleted_count ?? 0;

    await logWorkerInfo(
      `[worker] cleanup_operational_logs removed=${deletedCount} at ${nowIso}`,
      {
        task: "cleanup_operational_logs",
        deletedCount,
        nowIso
      }
    );
  } catch (error) {
    await logWorkerError("[worker] cleanup_operational_logs task failed", error, {
      task: "cleanup_operational_logs"
    });
    throw error;
  } finally {
    await client.end();
  }
};
