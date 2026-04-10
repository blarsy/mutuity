import "dotenv/config";

import fs from "node:fs";
import { run } from "graphile-worker";
import { taskList } from "./taskList.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

async function main() {
  const crontabFile = process.env.WORKER_CRONTAB_FILE
    ?? (fs.existsSync("backend/crontab") ? "backend/crontab" : fs.existsSync("crontab") ? "crontab" : undefined);

  const runner = await run({
    connectionString: DATABASE_URL,
    taskList,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    pollInterval: Number(process.env.WORKER_POLL_INTERVAL ?? 2000),
    crontabFile
  });

  console.log("Graphile Worker started.");

  const shutdown = async () => {
    await runner.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
