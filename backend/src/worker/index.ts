import "dotenv/config";

import { run } from "graphile-worker";
import { taskList } from "./taskList.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL.");
}

async function main() {
  const runner = await run({
    connectionString: DATABASE_URL,
    taskList,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 5),
    pollInterval: Number(process.env.WORKER_POLL_INTERVAL ?? 2000)
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
