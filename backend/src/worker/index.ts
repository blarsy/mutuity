import "../monitoring/instrument.js";
import { captureUnexpectedError, flushMonitoring } from "../monitoring/instrument.js";

import fs from "node:fs";
import { run } from "graphile-worker";
import { logWorkerError, logWorkerInfo } from "../logging/operationalLogger.js";
import { taskList } from "./taskList.js";
import { monitorTasks } from "./monitorTasks.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

async function main() {
  const crontabFile = process.env.WORKER_CRONTAB_FILE
    ?? (fs.existsSync("backend/crontab") ? "backend/crontab" : fs.existsSync("crontab") ? "crontab" : undefined);

  const runner = await run({
    connectionString: DATABASE_URL,
    taskList: monitorTasks(taskList),
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    pollInterval: Number(process.env.WORKER_POLL_INTERVAL ?? 2000),
    crontabFile
  });

  console.log("Graphile Worker started.");
  await logWorkerInfo("Graphile Worker started.", {
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    pollInterval: Number(process.env.WORKER_POLL_INTERVAL ?? 2000),
    crontabFile: crontabFile ?? null
  });

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    const deadline = setTimeout(() => { void flushMonitoring().finally(() => process.exit(1)); }, 5000);
    deadline.unref();
    try {
      await runner.stop();
    } finally {
      await flushMonitoring();
      clearTimeout(deadline);
      process.exit(0);
    }
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  console.error(error);
  void logWorkerError("Graphile Worker bootstrap failed", error);
  captureUnexpectedError(error);
  await flushMonitoring();
  process.exit(1);
});
