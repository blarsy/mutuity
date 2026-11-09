import type { ErrorEvent, Event } from "@sentry/node";
type TransactionEvent = Event & { type: "transaction" };
type SpanJSON = NonNullable<Event["spans"]>[number];

// Rebuild payloads, rather than trying to enumerate every SDK/request secret.
// Never retain request data, user, extra, breadcrumbs, SQL, GraphQL or source context.
const REDACTED_MESSAGE = "Application error (details removed)";
const SAFE_ERROR_TYPES = new Set([
  "Error", "TypeError", "ReferenceError", "SyntaxError", "RangeError", "URIError",
  "EvalError", "AggregateError", "InternalError", "DOMException", "AbortError",
  "TimeoutError", "NetworkError", "FetchError", "ChunkLoadError", "ApolloError",
  "CombinedGraphQLErrors", "GraphQLError", "ServerError", "ServerParseError",
  "DatabaseError", "ValidationError", "AssertionError", "InvariantError"
]);

function safeErrorType(value: string | undefined): string {
  return value && SAFE_ERROR_TYPES.has(value) ? value : "Error";
}

// Emit diagnostic templates, NOT cleaned arbitrary text: an exception can be an
// entire user message/response. Only fixed categories and validated enums escape.
// Keep this logic in sync with frontend/src/monitoring/privacy.ts.
export function safeMessage(value: string): string {
  if (SAFE_ERROR_TYPES.has(value)) return value;
  const text = value.slice(0, 4096);
  const property = /^(?:TypeError: )?Cannot (read|set) properties of (undefined|null)(?: \(.*\))?$/.exec(text);
  if (property) return `Cannot ${property[1]} properties of ${property[2]} (property removed)`;
  const legacyProperty = /^(?:TypeError: )?(undefined|null) is not an object\b/.exec(text);
  if (legacyProperty) return `${legacyProperty[1]} is not an object (expression removed)`;
  if (/^(?:ReferenceError: )?(?:Can't find variable: .+|.+ is not defined)$/.test(text)) return "Reference is not defined (identifier removed)";
  if (/^(?:TypeError: )?.+ is not a function$/.test(text)) return "Value is not a function (expression removed)";
  if (/^(?:TypeError: )?.+ is not iterable\b/.test(text)) return "Value is not iterable (expression removed)";
  if (/^(?:RangeError: )?(?:Maximum call stack size exceeded|too much recursion)$/.test(text)) return "Maximum call stack size exceeded";
  if (/^(?:RangeError: )?Invalid (?:array length|time value)$/.test(text)) return text.replace(/^RangeError: /, "");
  if (/^(?:SyntaxError: )?(?:Unexpected (?:token|end)|Expected property name|JSON\.parse:)/.test(text)) return "JSON or JavaScript syntax error (input removed)";
  if (/^(?:URIError: )?URI malformed$/.test(text)) return "URI malformed";
  const react = /^Minified React error #([1-9]\d{0,2});/.exec(text);
  if (react) return `React error #${react[1]} (decoder arguments removed)`;
  if (/^Maximum update depth exceeded\b/.test(text)) return "React maximum update depth exceeded";
  if (/^Too many re-renders\b/.test(text)) return "React too many re-renders";
  if (/^Rendered (?:more|fewer) hooks\b/.test(text)) return "React hook order changed between renders";
  if (/^(?:Hydration failed|Text content does not match server-rendered HTML|There was an error while hydrating)\b/.test(text)) return "React hydration failed (content removed)";
  const dom = /^Failed to execute '(appendChild|removeChild|insertBefore|replaceChild|querySelector|setAttribute)' on '(?:Node|Element|Document)':/.exec(text);
  if (dom) return `DOM ${dom[1]} failed (details removed)`;
  if (/^(?:(?:TypeError|FetchError|NetworkError): )?(?:fetch failed|Failed to fetch|Load failed|Network request failed|NetworkError when attempting to fetch resource\.?)(?:$|\n)/i.test(text)) return "Network request failed";
  const network = /^(?:(?:Error|TypeError): )?(?:(?:connect|read|write|getaddrinfo) )?(ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|EPIPE|ENETUNREACH|EHOSTUNREACH)\b/.exec(text);
  if (network) return `Network error: ${network[1]} (address removed)`;
  const tls = /^(?:Error: )?(CERT_HAS_EXPIRED|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE|ERR_TLS_CERT_ALTNAME_INVALID)\b/.exec(text);
  if (tls) return `TLS error: ${tls[1]} (certificate details removed)`;
  if (/^(?:ChunkLoadError: )?(?:Loading chunk .+ failed|Failed to fetch dynamically imported module)/.test(text)) return "JavaScript chunk loading failed (asset removed)";
  if (/^(?:AbortError: )?(?:The operation was aborted|This operation was aborted|The user aborted a request)\b/.test(text)) return "Operation aborted";
  if (/^(?:TimeoutError: )?(?:The operation was aborted due to timeout|The operation timed out|timeout exceeded)\b/i.test(text)) return "Operation timed out";
  const http = /^(?:Response not successful: Received status code|Request failed with status code|Server returned) ([45]\d{2})\b/.exec(text);
  if (http) return `HTTP request failed: ${http[1]} (response removed)`;
  if (/^(?:GraphQLError: )?(?:Cannot query field|Unknown argument|Unknown type|Variable .+ (?:got invalid value|of required type|of type)|Syntax Error:)/.test(text)) return "GraphQL validation failed (document and variables removed)";
  const databaseDiagnostics: [RegExp, string][] = [
    [/^duplicate key value violates unique constraint\b/i, "Database unique constraint violated"],
    [/^insert or update on table .+ violates foreign key constraint\b/i, "Database foreign key constraint violated"],
    [/^null value in column .+ violates not-null constraint\b/i, "Database not-null constraint violated"],
    [/^new row for relation .+ violates check constraint\b/i, "Database check constraint violated"],
    [/^permission denied for (?:table|schema|function|relation|sequence)\b/i, "Database permission denied"],
    [/^new row violates row-level security policy\b/i, "Database row-level security denied write"],
    [/^relation .+ does not exist\b/i, "Database relation does not exist"],
    [/^column .+ does not exist\b/i, "Database column does not exist"],
    [/^deadlock detected\b/i, "Database deadlock detected"],
    [/^could not serialize access\b/i, "Database serialization failure"],
    [/^canceling statement due to statement timeout\b/i, "Database statement timeout"],
    [/^remaining connection slots are reserved\b|^sorry, too many clients already\b/i, "Database connection limit reached"]
  ];
  for (const [pattern, diagnostic] of databaseDiagnostics) {
    if (pattern.test(text)) return diagnostic;
  }
  return REDACTED_MESSAGE;
}

function safeExceptionMessage(value: string | undefined, type: string | undefined,
  stacktrace: NonNullable<NonNullable<ErrorEvent["exception"]>["values"]>[number]["stacktrace"]): string {
  const message = value ? safeMessage(value) : REDACTED_MESSAGE;
  if (message !== REDACTED_MESSAGE) return message;
  // Sentry frames are oldest first. Prefer the most recent application frame.
  const frames = stacktrace?.frames ?? [];
  const frame = [...frames].reverse().find(frame => frame.in_app && safeFilename(frame.filename))
    ?? [...frames].reverse().find(frame => safeFilename(frame.filename));
  const filename = safeFilename(frame?.filename);
  const lineno = frame?.lineno;
  const line = typeof lineno === "number" && Number.isSafeInteger(lineno) && lineno > 0 ? `:${lineno}` : "";
  return `${safeErrorType(type)}${filename ? ` at ${filename.slice(-200)}${line}` : ""} (message removed; see stack trace)`;
}

function safeSymbol(value: string | undefined) {
  return value && /^[\w.$<> /:-]{1,100}$/.test(value) ? value : undefined;
}

function safeFilename(value: string | undefined) {
  const path = value?.split(/[?#]/)[0].replace(/^https?:\/\/[^/]+/i, "");
  return path && /\.[cm]?[jt]sx?$/.test(path)
    ? path.replace(/\/Users\/[^/]+/g, "/Users/[user]").replace(/\/home\/[^/]+/g, "/home/[user]") : undefined;
}

// Only build-asset paths are eligible; never treat arbitrary request URLs as code.
function safeDebugMeta(meta: Event["debug_meta"]) {
  const images = meta?.images?.flatMap(image => {
    if (image.type !== "sourcemap" || !image.debug_id ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(image.debug_id) ||
        !image.code_file || image.code_file.length > 500 ||
        !/^(?:https?:\/\/[a-z0-9.-]+(?::\d+)?\/)?(?:_next\/static\/|static\/|dist\/)[a-z0-9_./-]+\.[cm]?js$/i.test(image.code_file.replace(/^\//, ""))) return [];
    if (image.code_file.split("/").includes("..")) return [];
    return [{ type: "sourcemap" as const, debug_id: image.debug_id, code_file: image.code_file }];
  });
  return images?.length ? { images } : undefined;
}

const SAFE_ROUTES = new Set([
  "/graphql", "/v0_13/graphql", "/ready", "/health", "/auth/:provider/start",
  "/auth/google/start", "/auth/apple/start", "/auth/google/callback", "/auth/apple/callback",
  "/auth/social/confirm-link", "/auth/social/complete-registration"
]);

function safeTransaction(value: string | undefined): string {
  const route = value?.replace(/^(?:GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /, "");
  return route && SAFE_ROUTES.has(route) ? route : "application.request";
}

const SAFE_SPAN_OPS = new Set(["http", "http.server", "http.client", "db", "db.query", "db.sql.query", "db.connection", "db.transaction", "pageload", "navigation", "resource.script", "resource.css"]);
function safeSpanOp(value: string | undefined) {
  return value && SAFE_SPAN_OPS.has(value) ? value : "application";
}

function safeFrames(frames: NonNullable<NonNullable<ErrorEvent["exception"]>["values"]>[number]["stacktrace"]) {
  return frames && { frames: frames.frames?.map(frame => ({
    filename: safeFilename(frame.filename),
    function: safeSymbol(frame.function),
    lineno: frame.lineno,
    colno: frame.colno,
    in_app: frame.in_app
  })) };
}

export function sanitizeEvent<T extends ErrorEvent | TransactionEvent>(event: T): T {
  return {
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: event.platform,
    environment: event.environment,
    release: event.release,
    type: event.type,
    level: event.level,
    ...(safeDebugMeta(event.debug_meta) ? { debug_meta: safeDebugMeta(event.debug_meta) } : {}),
    ...(event.exception ? { exception: { values: event.exception.values?.map(value => ({
      type: safeErrorType(value.type),
      value: safeExceptionMessage(value.value, value.type, value.stacktrace),
      stacktrace: safeFrames(value.stacktrace),
      mechanism: value.mechanism && { type: "generic", handled: value.mechanism.handled }
    })) } } : {}),
    ...(event.message ? { message: safeMessage(event.message) !== REDACTED_MESSAGE
      ? safeMessage(event.message) : safeExceptionMessage(event.exception?.values?.[0]?.value, event.exception?.values?.[0]?.type, event.exception?.values?.[0]?.stacktrace) } : {}),
    ...(event.transaction && event.type !== "transaction" ? { transaction: safeTransaction(event.transaction) } : {}),
    ...(event.contexts?.trace ? { contexts: { trace: {
      trace_id: event.contexts.trace.trace_id,
      span_id: event.contexts.trace.span_id,
      parent_span_id: event.contexts.trace.parent_span_id,
      op: safeSpanOp(event.contexts.trace.op),
      status: event.contexts.trace.status
    } } } : {}),
    ...(event.type === "transaction" ? {
      transaction: safeTransaction(event.transaction),
      start_timestamp: event.start_timestamp,
      spans: event.spans?.map(sanitizeSpan)
    } : {})
  } as T;
}

export function sanitizeSpan(span: SpanJSON): SpanJSON {
  return {
    trace_id: span.trace_id,
    span_id: span.span_id,
    parent_span_id: span.parent_span_id,
    start_timestamp: span.start_timestamp,
    timestamp: span.timestamp,
    op: safeSpanOp(span.op),
    description: "application.operation",
    status: span.status,
    data: {}
  };
}

export function monitoringConfig(env: Record<string, string | undefined>) {
  const environment = env.SENTRY_ENVIRONMENT?.trim() || env.NODE_ENV || "development";
  const raw = env.SENTRY_TRACES_SAMPLE_RATE?.trim();
  const rate = raw ? Number(raw) : 0.01;
  const tracesSampleRate = Number.isFinite(rate) && rate >= 0 && rate <= 1 ? rate : 0.01;
   const enabled = Boolean(env.SENTRY_DSN?.trim()) && env.NODE_ENV === "production"
     && !/^(local|development)$/i.test(environment) && !env.JEST_WORKER_ID;
  return { enabled, dsn: enabled ? env.SENTRY_DSN?.trim() : undefined,
    environment, release: env.SENTRY_RELEASE?.trim() || undefined, tracesSampleRate };
}