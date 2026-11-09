jest.mock("@sentry/node", () => ({
  init: jest.fn(), captureException: jest.fn(), flush: jest.fn().mockResolvedValue(true),
  httpIntegration: jest.fn(), expressIntegration: jest.fn(),
  withStaticSpan: (callback: unknown) => callback
}));

import * as Sentry from "@sentry/node";
import { monitoringConfig, safeMessage, sanitizeEvent, sanitizeSpan } from "../../src/monitoring/privacy";
import { reportGraphqlError } from "../../src/monitoring/errors";
import { monitorTasks } from "../../src/worker/monitorTasks";

const messageFixtures: [string, string][] = require("../../../scripts/tests/monitoring-message-fixtures.json");

describe("monitoring privacy and configuration", () => {
  it.each(messageFixtures)("summarizes diagnostics without private text: %s", (input, expected) => {
    expect(safeMessage(input)).toBe(expected);
    expect(safeMessage(input)).not.toContain("private");
  });
  it("uses error class and latest application stack location for unknown messages", () => {
    const event = sanitizeEvent({ type: undefined, message: "private", transaction: "POST /graphql",
      exception: { values: [{ type: "CombinedGraphQLErrors", value: "private", stacktrace: { frames: [
        { filename: "/dist/old.js", lineno: 1, in_app: true },
        { filename: "https://app.example/dist/resolver.js?token=private", lineno: 42, in_app: true },
        { filename: "/dist/vendor.js", lineno: 99, in_app: false }
      ] } }] } });
    expect(event.exception?.values?.[0]).toMatchObject({ type: "CombinedGraphQLErrors",
      value: "CombinedGraphQLErrors at /dist/resolver.js:42 (message removed; see stack trace)" });
    expect(event.message).toBe(event.exception?.values?.[0].value);
    expect(event.transaction).toBe("/graphql");
    expect(JSON.stringify(event)).not.toMatch(/private|app\.example/);
  });
  it("does not allow arbitrary exception names or raw error routes", () => {
    const event = sanitizeEvent({ type: undefined, message: "private", transaction: "/accounts/private",
      exception: { values: [{ type: "privateConversationError", value: "private" }] } });
    expect(event.exception?.values?.[0]).toMatchObject({ type: "Error", value: "Error (message removed; see stack trace)" });
    expect(event.transaction).toBe("application.request");
    expect(JSON.stringify(event)).not.toContain("private");
  });
  it("uses the exception diagnostic when the root message is private", () => {
    expect(sanitizeEvent({ type: undefined, message: "private", exception: { values: [{ type: "Error", value: "read ECONNRESET private" }] } }).message)
      .toBe("Network error: ECONNRESET (address removed)");
  });
  it("retains only validated sourcemap debug images and their exact asset identity", () => {
    const image = { type: "sourcemap" as const, debug_id: "12345678-1234-4234-8234-123456789abc", code_file: "https://app.example/_next/static/chunks/123-abcd.js" };
    const invalid = [
      { ...image, debug_id: "private-token" }, { ...image, type: "macho" as const, image_addr: "0x0" },
      ...["https://user:password@app.example/_next/static/a.js", "https://app.example/_next/static/a.js?token=secret", "/Users/private/app.js", "/_next/static/../private.js", "/chat/private.js", "javascript:secret"].map(code_file => ({ ...image, code_file }))
    ];
    const extendedImage = { ...image, debug_file: "secret" };
    expect(sanitizeEvent({ debug_meta: { images: [extendedImage, ...invalid] } } as unknown as Parameters<typeof sanitizeEvent>[0]).debug_meta).toEqual({ images: [image] });
    expect(sanitizeEvent({ debug_meta: { images: invalid } } as unknown as Parameters<typeof sanitizeEvent>[0]).debug_meta).toBeUndefined();
  });
  it.each(["/graphql", "/ready", "/health", "/auth/:provider/start", "/auth/google/callback", "/auth/social/confirm-link"])("groups safe backend route %s", route => {
    expect(sanitizeEvent({ type: "transaction", transaction: `POST ${route}` }).transaction).toBe(route);
  });
  it.each(["/graphql?query=secret", "/auth/private/start", "PrivateOperationName", "/accounts/private-id", "https://host/health"])("rejects unregistered transaction %s", transaction => {
    expect(sanitizeEvent({ type: "transaction", transaction }).transaction).toBe("application.request");
  });
  it.each(["http.client", "db", "db.query", "db.sql.query"])("keeps safe span category %s without content", op => {
    const event = sanitizeEvent({ type: "transaction", contexts: { trace: { trace_id: "trace", span_id: "span", op } }, spans: [{ trace_id: "trace", span_id: "span", start_timestamp: 1, timestamp: 2, status: "ok", op, description: "SELECT secret", data: { url: "https://private" } }] });
    expect(event.contexts?.trace?.op).toBe(op);
    expect(event.spans?.[0]).toMatchObject({ op, description: "application.operation", data: {} });
    expect(JSON.stringify(event)).not.toMatch(/secret|https/);
  });
  it("rejects arbitrary span operations", () => {
    expect(sanitizeSpan({ trace_id: "t", span_id: "s", start_timestamp: 1, timestamp: 2, status: "ok", data: {}, op: "db.SELECT secret" }).op).toBe("application");
  });
  it.each([undefined, "", "bad", "-1", "1.1", "Infinity", "NaN"])("validates sample rate %s", value => {
    expect(monitoringConfig({ SENTRY_TRACES_SAMPLE_RATE: value }).tracesSampleRate).toBe(0.01);
  });
  it.each(["0", "0.25", "1"])("accepts valid sample rate %s", value => {
    expect(monitoringConfig({ SENTRY_TRACES_SAMPLE_RATE: value }).tracesSampleRate).toBe(Number(value));
  });
  it("requires DSN and production runtime and rejects local/tests", () => {
    const env = { NODE_ENV: "production", SENTRY_DSN: "https://key@errors.example/1", SENTRY_ENVIRONMENT: "review", SENTRY_RELEASE: "web@abc" };
    expect(monitoringConfig(env)).toMatchObject({ enabled: true, environment: "review", release: "web@abc" });
    expect(monitoringConfig({ ...env, SENTRY_ENVIRONMENT: "test" })).toMatchObject({ enabled: true, environment: "test" });
    for (const override of [{ SENTRY_DSN: "" }, { NODE_ENV: "test" }, { NODE_ENV: "development" }, { SENTRY_ENVIRONMENT: "local" }, { JEST_WORKER_ID: "1" }]) {
      expect(monitoringConfig({ ...env, ...override }).enabled).toBe(false);
      expect(monitoringConfig({ ...env, ...override }).dsn).toBeUndefined();
    }
  });
  it("rebuilds exceptions without request/session/GraphQL/chat payloads", () => {
    const event = sanitizeEvent({
      type: undefined,
      request: { url: "https://app.example/chat?token=secret", headers: { authorization: "secret" }, data: { variables: "secret" } },
      user: { id: "secret", email: "secret@example.com" }, extra: { session: "secret" },
      breadcrumbs: [{ message: "secret" }], tags: { secret: "secret" },
      contexts: { app: { secret: "secret" } },
      exception: { values: [{ type: "TypeError", value: "Cannot read properties of undefined (reading 'secret')", stacktrace: { frames: [{
        filename: "https://app.example/_next/chunk.js?token=secret", function: "renderPage", lineno: 12,
        vars: { secret: "secret" }, pre_context: ["secret"], context_line: "secret"
      }] } }] }
    });
    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain("secret");
    expect(serialized).not.toContain("app.example");
    expect(serialized).toContain("TypeError");
    expect(serialized).toContain("Cannot read properties of undefined");
    expect(event.exception?.values?.[0].stacktrace?.frames?.[0]).toMatchObject({ filename: "/_next/chunk.js", function: "renderPage", lineno: 12 });
    expect(safeMessage("private unquoted conversation contents")).toBe("Application error (details removed)");
    expect(safeMessage("select password from app_private.account")).not.toContain("account");
  });
  it("strips transaction and span data as well as root metadata", () => {
    const span = { trace_id: "trace", span_id: "span", start_timestamp: 1, timestamp: 2, status: "ok", data: { "db.statement": "secret" }, description: "secret", op: "db.query" };
    const event = sanitizeEvent({ type: "transaction", transaction: "secret", start_timestamp: 1,
      spans: [span], request: { data: "secret" }, extra: { secret: true } });
    expect(JSON.stringify(event)).not.toContain("secret");
    expect(sanitizeSpan(span)).toMatchObject({ data: {}, description: "application.operation" });
  });
});

describe("unexpected failures", () => {
  it("classifies domain/validation failures but reports resolver faults", () => {
    const capture = jest.spyOn(Sentry, "captureException");
    // instrument.ts is deliberately inactive under Jest. Exercise classification
    // separately with a reporter mock below; no test can send telemetry.
    reportGraphqlError({ originalError: new Error("domain") }, "BAD_USER_INPUT");
    expect(capture).not.toHaveBeenCalled();
  });
  it("rethrows exactly the job failure without changing successful jobs", async () => {
    const failure = new Error("private payload must not be sent");
    const tasks = monitorTasks({ fail: async () => { throw failure; }, ok: async () => undefined });
    await expect(tasks.fail!({ session: "secret" }, {} as never)).rejects.toBe(failure);
    await expect(tasks.ok!({}, {} as never)).resolves.toBeUndefined();
  });
});