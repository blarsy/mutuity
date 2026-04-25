import { apolloClient } from "../../services/graphql/client";
import { WRITE_OPERATIONAL_LOG_MUTATION } from "./logging.queries";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogInput = {
  level: LogLevel;
  message: string;
  context?: string;
  accountId?: string;
  metadata?: Record<string, unknown>;
};

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

function formatErrorMessage(baseMessage: string, error: unknown) {
  if (error instanceof Error) {
    const stack = typeof error.stack === "string" ? error.stack : "";
    return stack ? `${baseMessage}: ${error.message}\n${stack}` : `${baseMessage}: ${error.message}`;
  }

  return `${baseMessage}: ${String(error)}`;
}

function emitFallbackDiagnostic(input: LogInput, error: unknown) {
  console.error("[operational-log] frontend fallback", {
    input,
    error: serializeError(error)
  });
}

async function writeBackofficeLog(input: LogInput) {
  try {
    await apolloClient.mutate({
      mutation: WRITE_OPERATIONAL_LOG_MUTATION,
      variables: {
        level: input.level,
        component: "backoffice_web",
        message: input.message,
        context: input.context ?? null,
        accountId: input.accountId ?? null,
        metadata: input.metadata ?? {}
      }
    });
  } catch (error) {
    // Logging failure must never block UX flows.
    emitFallbackDiagnostic(input, error);
  }
}

export function logBackofficeInfo(message: string, options?: Omit<LogInput, "level" | "message">) {
  return writeBackofficeLog({
    level: "info",
    message,
    ...options
  });
}

export function logBackofficeError(
  message: string,
  error: unknown,
  options?: Omit<LogInput, "level" | "message">
) {
  return writeBackofficeLog({
    level: "error",
    message: formatErrorMessage(message, error),
    context: options?.context,
    accountId: options?.accountId,
    metadata: {
      ...(options?.metadata ?? {}),
      error: serializeError(error)
    }
  });
}
