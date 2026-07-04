import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const tasksPath = path.join(repoRoot, "specs/014-mutuity-mobile-rewrite/tasks.md");
const contractsDir = path.join(repoRoot, "specs/014-mutuity-mobile-rewrite/ui-contracts");

const tasksContent = fs.readFileSync(tasksPath, "utf8");
const portTaskLines = tasksContent.split("\n").filter((line) => line.includes("Port ") && line.includes("ui-contracts/"));
const blocked = [];

for (const line of portTaskLines) {
  const match = line.match(/ui-contracts\/([a-z0-9-]+\.md)/);
  if (!match) {
    continue;
  }

  const contractPath = path.join(contractsDir, match[1]);
  if (!fs.existsSync(contractPath)) {
    blocked.push(`${match[1]} missing`);
    continue;
  }

  const contractContent = fs.readFileSync(contractPath, "utf8");
  if (!/Contract status:\s*Approved/i.test(contractContent)) {
    blocked.push(`${match[1]} not approved`);
  }
}

if (blocked.length > 0) {
  console.error("UI contract gate failed:");
  for (const item of blocked) {
    console.error(`- ${item}`);
  }
  process.exit(1);
}

console.log("UI contract gate passed.");
