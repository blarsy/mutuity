import type { ErrorEvent, Event } from "@sentry/node";
type TransactionEvent = Event & { type: "transaction" };
type SpanJSON = NonNullable<Event["spans"]>[number];

// Rebuild payloads, rather than trying to enumerate every SDK/request secret.
// Never retain request data, user, extra, breadcrumbs, SQL, GraphQL or source context.
const REDACTED_MESSAGE = "Application error (details removed)";
function safeErrorType(value: string | undefined): string {
  return value && /^[A-Za-z_$][\w$]{0,99}$/.test(value) && safeMessage(value) === value ? value : "Error";
}

// Preserve technical prose, not just recognized categories. This is best-effort
// redaction, not a guarantee for arbitrary user text: never throw user content.
// Keep this logic in sync with frontend/src/monitoring/privacy.ts.
export function safeMessage(value: string): string {
  // Drop multiline SQL DETAIL/CONTEXT, React rendered diffs and response dumps.
  let text = value.slice(0, 8192).split(/[\r\n\u2028\u2029]/)[0].trim();
  if (!text) return REDACTED_MESSAGE;
  text = text
    .replace(/\b(SQL|statement|query document|GraphQL document|variables|parameters|payload|request body|response body|message body|body|DETAIL|CONTEXT)\s*[:=].*$/i, "$1: [payload removed]")
    .replace(/^(?:SELECT\b.+\bFROM\b|INSERT\s+INTO\b|UPDATE\b.+\bSET\b|DELETE\s+FROM\b|(?:query|mutation|subscription)\b\s*(?:[\w$]+\s*)?[({]).*$/i, "[query removed]")
    .replace(/\{.*$|<\/?[A-Za-z][^>]*>.*$/, "[payload removed]")
    .replace(/\b(?:https?|wss?|postgres(?:ql)?|redis|rediss|ftp):\/\/[^\s"'`]+/gi, "[url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9+/_.=-]+/gi, "[authorization removed]")
    .replace(/\b(?:authorization|cookie|set-cookie)\s*[:=].*$/gi, "[credentials removed]")
    .replace(/\b(password|passwd|secret|(?:access|refresh|id)[_-]?token|token|api[_-]?key|client[_-]?secret|session(?:[_-]?id)?|account[_-]?id|user[_-]?id|email|phone)\s*[:=]\s*(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;]+)/gi, "$1=[redacted]")
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[identifier]")
    .replace(/\b\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?\b/g, "[address]")
    .replace(/\[?[0-9a-f]*:[0-9a-f:]*:[0-9a-f:]+\]?(?::\d+)?/gi, "[address]")
    .replace(/\+\d[\d ()-]{7,}\d\b|\b\d{10,}\b/g, "[identifier]")
    .replace(/\b[A-Za-z0-9_=-]{32,}\b/g, "[identifier]")
    .replace(/(?:\/Users\/|\/home\/)[^/\s]+/g, "/[user]")
    .replace(/\b(getaddrinfo\s+(?:ENOTFOUND|EAI_AGAIN))\s+\S+/g, "$1 [address]");
  // Only quoted values in code/schema positions are retained as identifiers.
  // A plain quoted string, even a single word, may be user content.
  text = text.replace(/(?<![\w])(["'`])((?:\\.|(?!\1)[^\\])*?)(?:\1|$)/g, (quoted, quote: string, content: string, offset: number) => {
    const prefix = text.slice(0, offset);
    const codePosition = /(?:\b(?:reading|setting|evaluating|execute|on|field|type|argument|constraint|table|column|relation|schema|function|sequence|variable)\s+)$/i.test(prefix);
    return quoted.endsWith(quote) && codePosition && /^\$?[A-Za-z_$][\w$.[\]()!]{0,99}$/.test(content) ? quoted : "[value]";
  });
  return text.length > 1000 ? `${text.slice(0, 980)} [truncated]` : text;
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