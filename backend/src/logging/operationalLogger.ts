import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Pool } from "pg";

type OperationalLogLevel = "debug" | "info" | "warn" | "error";
type OperationalLogComponent = "web_api" | "worker_job";

type OperationalLogInput = {
  level: OperationalLogLevel;
  component: OperationalLogComponent;
  message: string;
  context?: string;
  accountId?: string;
  metadata?: Record<string, unknown>;
};

type OperationalLogOptions = Record<string, unknown> & Omit<OperationalLogInput, "component" | "level" | "message"> & {
  task?: string;
};

const WRITE_OPERATIONAL_LOG_SQL =
  "select app_public.write_operational_log($1, $2, $3, $4, $5, $6) as id;";

let operationalLogPool: Pool | null = null;
let fallbackFileReady = false;

function getOperationalLogPool() {
  if (operationalLogPool) {
    return operationalLogPool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return null;
  }

  operationalLogPool = new Pool({ connectionString });
  return operationalLogPool;
}

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return { message: String(error) };
}

function getFallbackLogFilePath() {
  const configuredPath = process.env.OPERATIONAL_LOG_FALLBACK_FILE?.trim();
  return configuredPath && configuredPath.length > 0 ? configuredPath : null;
}

function toFallbackRecord(
  reason: "missing_database_url" | "persist_failed",
  input: OperationalLogInput,
  error?: unknown
) {
  return {
    timestamp: new Date().toISOString(),
    reason,
    input,
    error: typeof error === "undefined" ? null : serializeError(error)
  };
}

async function appendFallbackFileLine(line: string) {
  const fallbackFilePath = getFallbackLogFilePath();

  if (!fallbackFilePath) {
    return;
  }

  try {
    if (!fallbackFileReady) {
      await mkdir(dirname(fallbackFilePath), { recursive: true });
      fallbackFileReady = true;
    }

    await appendFile(fallbackFilePath, `${line}\n`, "utf8");
  } catch (fileError) {
    console.error("[operational-log] fallback file write failed", serializeError(fileError));
  }
}

async function emitFallbackDiagnostic(
  reason: "missing_database_url" | "persist_failed",
  input: OperationalLogInput,
  error?: unknown
) {
  const record = toFallbackRecord(reason, input, error);
  const line = JSON.stringify(record);

  console.error("[operational-log] fallback", record);
  await appendFallbackFileLine(line);
}

function normalizeOptions(options?: OperationalLogOptions) {
  const { context, accountId, metadata: explicitMetadata, task, ...extraMetadata } = options ?? {};
  const normalizedMetadata = {
    ...extraMetadata,
    ...((explicitMetadata as Record<string, unknown> | undefined) ?? {}),
    ...(task ? { task } : {})
  };

  return {
    context: typeof context === "string" ? context : undefined,
    accountId: typeof accountId === "string" ? accountId : undefined,
    metadata: normalizedMetadata
  };
}

export function formatErrorMessage(baseMessage: string, error: unknown) {
  if (error instanceof Error) {
    const stack = typeof error.stack === "string" ? error.stack : "";
    return stack ? `${baseMessage}: ${error.message}\n${stack}` : `${baseMessage}: ${error.message}`;
  }

  return `${baseMessage}: ${String(error)}`;
}

export async function writeOperationalLog(input: OperationalLogInput) {
  const pool = getOperationalLogPool();
  if (!pool) {
    await emitFallbackDiagnostic("missing_database_url", input);
    return;
  }

  try {
    await pool.query(WRITE_OPERATIONAL_LOG_SQL, [
      input.level,
      input.component,
      input.message,
      input.context ?? null,
      input.accountId ?? null,
      input.metadata ?? {}
    ]);
  } catch (error) {
    // Never interrupt caller flow because logging persistence failed.
    await emitFallbackDiagnostic("persist_failed", input, error);
  }
}

export async function logWebApiInfo(message: string, options?: OperationalLogOptions) {
  const normalized = normalizeOptions(options);

  await writeOperationalLog({
    level: "info",
    component: "web_api",
    message,
    context: normalized.context,
    accountId: normalized.accountId,
    metadata: normalized.metadata
  });
}

export async function logWebApiError(message: string, error: unknown, options?: OperationalLogOptions) {
  const normalized = normalizeOptions(options);

  await writeOperationalLog({
    level: "error",
    component: "web_api",
    message: formatErrorMessage(message, error),
    context: normalized.context,
    accountId: normalized.accountId,
    metadata: {
      ...normalized.metadata,
      error: serializeError(error)
    }
  });
}

export async function logWorkerInfo(message: string, options?: OperationalLogOptions) {
  const normalized = normalizeOptions(options);

  await writeOperationalLog({
    level: "info",
    component: "worker_job",
    message,
    context: normalized.context,
    accountId: normalized.accountId,
    metadata: normalized.metadata
  });
}

export async function logWorkerError(message: string, error: unknown, options?: OperationalLogOptions) {
  const normalized = normalizeOptions(options);

  await writeOperationalLog({
    level: "error",
    component: "worker_job",
    message: formatErrorMessage(message, error),
    context: normalized.context,
    accountId: normalized.accountId,
    metadata: {
      ...normalized.metadata,
      error: serializeError(error)
    }
  });
}
