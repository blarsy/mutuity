import type { ErrorEvent, Event, TransactionEvent, StackFrame } from "@sentry/react-native";

const routes = new Set(["Explore", "MyHub", "Campaigns", "Chat", "Notifications"]);
const errorTypes = new Set(["Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError", "URIError", "EvalError"]);
const logCodes = new Set([
  "auth-clear-token-failed", "auth-persist-token-failed", "graphql-error",
  "graphql-realtime-error", "graphql-realtime-listener-error", "account-realtime-refresh-failed"
]);

export function safeLogCode(message: string): string {
  return logCodes.has(message) ? message : "mobile-error";
}

function safeFrame(frame: StackFrame): StackFrame {
  // Keep symbolication coordinates, never source text, local variables or absolute device paths.
  const result: StackFrame = {};
  for (const key of ["lineno", "colno", "in_app", "instruction_addr", "platform"] as const) {
    if (frame[key] !== undefined) Object.assign(result, { [key]: frame[key] });
  }
  for (const key of ["filename", "abs_path"] as const) {
    const value = frame[key];
    if (value) result[key] = value.split(/[?#]/, 1)[0]?.replace(/\\/g, "/").split("/").pop() ?? "app";
  }
  // Function names may include computed/user-provided values; retain only ordinary symbols.
  if (frame.function && /^[\w.$<> [\]-]{1,120}$/.test(frame.function)) result.function = frame.function;
  return result;
}

/** Fail-closed allowlist: don't recursively guess which GraphQL/chat fields are sensitive. */
export function sanitizeErrorEvent(event: ErrorEvent): ErrorEvent {
  return {
    ...baseEvent(event),
    type: undefined,
    ...(event.exception?.values ? { exception: { values: event.exception.values.map(value => ({
      type: errorTypes.has(value.type ?? "") ? value.type! : "Error",
      value: "[Redacted error message]",
      ...(value.stacktrace?.frames ? { stacktrace: { frames: value.stacktrace.frames.map(safeFrame) } } : {}),
      ...(value.mechanism ? { mechanism: {
        type: value.mechanism.handled === false ? "unhandled" : "generic",
        handled: value.mechanism.handled !== false
      } } : {})
    })) } } : {}),
    ...(event.tags?.mobile_error_code ? { tags: { mobile_error_code: safeLogCode(String(event.tags.mobile_error_code)) } } : {})
  };
}

function baseEvent(event: ErrorEvent | TransactionEvent): Event {
  // No request (including headers/query/body), user, breadcrumbs, extra, arbitrary tags,
  // contexts, logentry, attachments or source context. Native debug IDs remain for symbolication.
  const result: Event = {};
  for (const key of ["event_id", "timestamp", "platform", "release", "dist", "environment"] as const) {
    if (event[key] !== undefined) Object.assign(result, { [key]: event[key] });
  }
  if (event.debug_meta?.images) {
    result.debug_meta = { images: event.debug_meta.images.map(image => {
      const codeFile = image.code_file?.split(/[?#]/, 1)[0]?.split("/").pop() ?? "app";
      if (image.type === "macho") return {
        type: image.type, debug_id: image.debug_id, image_addr: image.image_addr,
        code_file: codeFile,
        ...(image.image_size !== undefined ? { image_size: image.image_size } : {})
      };
      return { type: image.type, debug_id: image.debug_id, code_file: codeFile };
    }) };
  }
  return result;
}

export function sanitizeTransactionEvent(event: TransactionEvent): TransactionEvent {
  const trace = event.contexts?.trace;
  return {
    ...baseEvent(event),
    type: "transaction",
    transaction: event.transaction && routes.has(event.transaction) ? event.transaction : "mobile.navigation",
    ...(event.start_timestamp !== undefined ? { start_timestamp: event.start_timestamp } : {}),
    spans: [],
    ...(trace ? { contexts: { trace: {
      trace_id: trace.trace_id,
      span_id: trace.span_id,
      op: "navigation"
    } } } : {})
  };
}