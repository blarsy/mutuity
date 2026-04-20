import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const targetDir = path.join(rootDir, "backend", "src");
const violations = [];

const hasSqlKeyword = value => /\b(select|insert|update|delete|with)\b/i.test(value);

const allowedSqlFunctionCallPattern = /^\s*select\s+(?:\*\s+from\s+)?[a-z_][a-z0-9_]*\.[a-z_][a-z0-9_]*\s*\([^;]*\)(?:\s+as\s+[a-z_][a-z0-9_]*)?\s*;?\s*$/i;

function lineNumberAt(content, index) {
  return content.slice(0, index).split("\n").length;
}

function collectFilesRecursively(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      collectFilesRecursively(fullPath);
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".ts")) {
      inspectFile(fullPath);
    }
  }
}

function inspectFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");

  const multilineTemplateSqlRegex = /`([\s\S]*?)`/g;
  let templateMatch;

  while ((templateMatch = multilineTemplateSqlRegex.exec(content)) !== null) {
    const sqlCandidate = templateMatch[1];

    if (!hasSqlKeyword(sqlCandidate) || !sqlCandidate.includes("\n")) {
      continue;
    }

    violations.push({
      filePath,
      line: lineNumberAt(content, templateMatch.index),
      rule: "Multiline SQL template literals are forbidden in TypeScript"
    });
  }

  const sqlConstantRegex = /const\s+([A-Z0-9_]+_SQL)\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[\s\S]*?`)/g;
  let sqlConstantMatch;

  while ((sqlConstantMatch = sqlConstantRegex.exec(content)) !== null) {
    const constantName = sqlConstantMatch[1];
    const rawLiteral = sqlConstantMatch[2];
    const literalBody = rawLiteral.slice(1, -1);
    const normalizedSql = literalBody.replace(/\s+/g, " ").trim();

    if (!hasSqlKeyword(normalizedSql)) {
      continue;
    }

    if (!allowedSqlFunctionCallPattern.test(normalizedSql)) {
      violations.push({
        filePath,
        line: lineNumberAt(content, sqlConstantMatch.index),
        rule: `SQL constants must be simple DB function calls (violated by ${constantName})`
      });
    }
  }
}

if (!fs.existsSync(targetDir)) {
  console.error(`Target directory not found: ${targetDir}`);
  process.exit(2);
}

collectFilesRecursively(targetDir);

if (violations.length > 0) {
  console.error("SQL boundary check failed. Move business SQL from TypeScript into database functions.");
  for (const violation of violations) {
    const relativePath = path.relative(rootDir, violation.filePath);
    console.error(`- ${relativePath}:${violation.line} ${violation.rule}`);
  }
  process.exit(1);
}

console.log("SQL boundary check passed.");
