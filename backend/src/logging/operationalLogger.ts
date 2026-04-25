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

const WRITE_OPERATIONAL_LOG_SQL =
  "select app_public.write_operational_log($1, $2, $3, $4, $5, $6) as id;";

let operationalLogPool: Pool | null = null;

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
    console.error("[operational-log] failed to persist", {
      input,
      error: serializeError(error)
    });
  }
}

export async function logWebApiInfo(message: string, metadata?: Record<string, unknown>) {
  await writeOperationalLog({
    level: "info",
    component: "web_api",
    message,
    metadata
  });
}

export async function logWebApiError(message: string, error: unknown, metadata?: Record<string, unknown>) {
  await writeOperationalLog({
    level: "error",
    component: "web_api",
    message: formatErrorMessage(message, error),
    metadata: {
      ...metadata,
      error: serializeError(error)
    }
  });
}

export async function logWorkerInfo(message: string, metadata?: Record<string, unknown>) {
  await writeOperationalLog({
    level: "info",
    component: "worker_job",
    message,
    metadata
  });
}

export async function logWorkerError(message: string, error: unknown, metadata?: Record<string, unknown>) {
  await writeOperationalLog({
    level: "error",
    component: "worker_job",
    message: formatErrorMessage(message, error),
    metadata: {
      ...metadata,
      error: serializeError(error)
    }
  });
}
