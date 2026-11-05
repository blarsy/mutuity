import type { ErrorEvent, Event } from "@sentry/node";
type TransactionEvent = Event & { type: "transaction" };
type SpanJSON = NonNullable<Event["spans"]>[number];

// Rebuild payloads, rather than trying to enumerate every SDK/request secret.
// Never retain request data, user, extra, breadcrumbs, SQL, GraphQL or source context.
export function safeMessage(value: string): string {
  if (/\b(select|insert|update|delete|mutation|query|password|token|cookie|session|chat|message body|variables)\b/i.test(value)) {
    return "Application error (sensitive details removed)";
  }
  const cleaned = value
    .replace(/https?:\/\/\S+/gi, "[url]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/(["'`]).*?\1/g, "[value]")
    .replace(/\b[A-Za-z0-9_=-]{24,}\b/g, "[identifier]")
    .replace(/\b\d+\b/g, "#")
    .split(/[\r\n]/)[0].slice(0, 200);
  // Arbitrary exception text can itself be a chat message or a server response.
  // Retain only recognizable runtime diagnostics, never arbitrary application text.
  return /^(?:[A-Za-z]*Error|Cannot (?:read|set) properties of (?:undefined|null)(?: \(.*\))?|[A-Za-z_$][\w$]* is (?:not defined|not a function)|Maximum call stack size exceeded|(?:fetch failed|Failed to fetch|Load failed)|connect E(?:CONNREFUSED|TIMEDOUT)(?: .*?)?)$/.test(cleaned)
    ? cleaned : "Application error (details removed)";
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
      type: value.type && safeMessage(value.type),
      value: value.value && safeMessage(value.value),
      stacktrace: safeFrames(value.stacktrace),
      mechanism: value.mechanism && { type: "generic", handled: value.mechanism.handled }
    })) } } : {}),
    ...(event.message ? { message: safeMessage(event.message) } : {}),
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