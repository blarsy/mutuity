import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { Client } from "pg";

import {
  closeOperationalLogPool,
  logWebApiInfo,
  logWorkerError
} from "../../src/logging/operationalLogger";
import { cleanupOperationalLogsTask } from "../../src/worker/tasks/cleanup-operational-logs";
import { TEST_DATABASE_URL, seedDemoAccount } from "./auth-test-helpers";

type OperationalLogRow = {
  id: string;
  level: string;
  component: string;
  message: string;
  context: string | null;
  account_id: string | null;
  metadata: Record<string, unknown>;
};

async function withDbClient<T>(callback: (client: Client) => Promise<T>) {
  const client = new Client({ connectionString: TEST_DATABASE_URL });
  await client.connect();

  try {
    return await callback(client);
  } finally {
    await client.end();
  }
}

async function deleteLogsByContext(context: string) {
  await withDbClient(client => client.query("delete from app_public.operational_log where context = $1", [context]));
}

async function writeBackofficeLog(context: string, accountId: string) {
  await withDbClient(client => client.query(
    "select app_public.write_operational_log($1, $2, $3, $4, $5, $6::jsonb)",
    [
      "info",
      "backoffice_web",
      "Backoffice moderation loaded",
      context,
      accountId,
      JSON.stringify({ panel: "moderation" })
    ]
  ));
}

async function searchOperationalLogs(filters: {
  component?: string | null;
  context?: string | null;
  accountId?: string | null;
}) {
  return withDbClient(async client => {
    const result = await client.query<OperationalLogRow>(
      `
        select *
        from app_public.search_operational_logs(
          $1::text,
          null,
          $2::text,
          $3::uuid,
          20,
          0
        )
      `,
      [filters.component ?? null, filters.context ?? null, filters.accountId ?? null]
    );

    return result.rows;
  });
}

async function setOperationalLogRetentionDays(days: number) {
  await withDbClient(client => client.query(
    `
      insert into app_public.system_setting (key, value_text)
      values ('operational_log_retention_days', $1::text)
      on conflict (key)
      do update set
        value_text = excluded.value_text,
        updated_at = now()
    `,
    [String(days)]
  ));
}

async function insertAgedOperationalLog(input: {
  component: string;
  context: string;
  createdAtIso: string;
}) {
  await withDbClient(client => client.query(
    `
      insert into app_public.operational_log (
        level,
        component,
        message,
        context,
        created_at,
        metadata
      )
      values (
        'info',
        $1::text,
        $2::text,
        $3::text,
        $4::timestamptz,
        '{}'::jsonb
      )
    `,
    [input.component, `${input.component} log`, input.context, input.createdAtIso]
  ));
}

async function collectSourceFiles(rootDir: string): Promise<string[]> {
  const entries = await readdir(rootDir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const fullPath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === "graphql" || entry.name === "node_modules") {
        return [] as string[];
      }

      return collectSourceFiles(fullPath);
    }

    if (!/\.(ts|tsx)$/.test(entry.name)) {
      return [] as string[];
    }

    return [fullPath];
  }));

  return nested.flat();
}

describe("unified operational logging coverage", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(async () => {
    process.env.DATABASE_URL = TEST_DATABASE_URL;
    await closeOperationalLogPool();
  });

  afterEach(async () => {
    process.env.DATABASE_URL = originalDatabaseUrl;
    await closeOperationalLogPool();
  });

  it("supports component filtering and shared context correlation across components", async () => {
    const seeded = await seedDemoAccount({
      identifier: `operational-log-${Date.now()}@example.com`,
      displayName: "Operational Logger"
    });
    const context = `t064-correlation-${Date.now()}`;

    await deleteLogsByContext(context);

    await logWebApiInfo("GraphQL request completed", {
      context,
      accountId: seeded.accountId,
      requestId: "req-1"
    });
    await writeBackofficeLog(context, seeded.accountId);
    await logWorkerError("Digest delivery failed", new Error("smtp timeout"), {
      context,
      accountId: seeded.accountId,
      task: "deliver_mail_outbox"
    });

    const correlatedRows = await searchOperationalLogs({
      context,
      accountId: seeded.accountId
    });
    const workerRows = await searchOperationalLogs({
      component: "worker_job",
      context,
      accountId: seeded.accountId
    });

    expect(correlatedRows).toHaveLength(3);
    expect(correlatedRows.map(row => row.component).sort()).toEqual([
      "backoffice_web",
      "web_api",
      "worker_job"
    ]);
    expect(correlatedRows.every(row => row.context === context)).toBe(true);

    expect(workerRows).toHaveLength(1);
    expect(workerRows[0].component).toBe("worker_job");
    expect(workerRows[0].metadata).toEqual(
      expect.objectContaining({
        task: "deliver_mail_outbox",
        error: expect.objectContaining({
          message: "smtp timeout"
        })
      })
    );

    await deleteLogsByContext(context);
  });

  it("keeps application sources on unified write paths without legacy duplicate writers", async () => {
    const backendFiles = await collectSourceFiles(path.resolve(__dirname, "../../src"));
    const frontendFiles = await collectSourceFiles(path.resolve(__dirname, "../../../frontend/src"));
    const violations: string[] = [];
    let foundUnifiedWritePath = false;

    for (const filePath of [...backendFiles, ...frontendFiles]) {
      const contents = await readFile(filePath, "utf8");
      const relativePath = path.relative(path.resolve(__dirname, "../../.."), filePath);

      if (contents.includes("writeOperationalLog(") || contents.includes("write_operational_log(")) {
        foundUnifiedWritePath = true;
      }

      if (contents.includes("createOperationalLog(")) {
        violations.push(`${relativePath}: createOperationalLog`);
      }

      if (contents.includes("insert into app_public.operational_log")) {
        violations.push(`${relativePath}: direct operational_log insert`);
      }
    }

    expect(foundUnifiedWritePath).toBe(true);
    expect(violations).toEqual([]);
  });

  it("deletes logs older than the configured retention window during scheduled cleanup", async () => {
    const context = `t065-retention-${Date.now()}`;
    const now = new Date("2026-04-25T12:00:00.000Z");

    await deleteLogsByContext(context);
    await setOperationalLogRetentionDays(7);
    await insertAgedOperationalLog({
      component: "web_api",
      context,
      createdAtIso: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
    });
    await insertAgedOperationalLog({
      component: "worker_job",
      context,
      createdAtIso: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString()
    });

    await cleanupOperationalLogsTask({ nowIso: now.toISOString() }, {} as never);

    const remainingAfterDefaultCleanup = await searchOperationalLogs({ context });

    expect(remainingAfterDefaultCleanup).toHaveLength(1);
    expect(remainingAfterDefaultCleanup[0].component).toBe("worker_job");

    await setOperationalLogRetentionDays(1);
    await cleanupOperationalLogsTask({ nowIso: now.toISOString() }, {} as never);

    const remainingAfterOverrideCleanup = await searchOperationalLogs({ context });

    expect(remainingAfterOverrideCleanup).toEqual([]);

    await deleteLogsByContext(context);
    await setOperationalLogRetentionDays(7);
  });
});
