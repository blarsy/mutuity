import { execFileSync } from "node:child_process";
import path from "node:path";

export default function globalSetup() {
  const seedScript = path.join(__dirname, "seed-smoke-users.mjs");
  execFileSync(process.execPath, [seedScript], {
    stdio: "inherit",
    env: process.env
  });
}
