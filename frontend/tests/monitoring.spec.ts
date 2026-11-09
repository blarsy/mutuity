jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(), captureUnderscoreErrorException: jest.fn().mockResolvedValue(undefined),
  globalHandlersIntegration: jest.fn(), browserApiErrorsIntegration: jest.fn(), browserTracingIntegration: jest.fn(), httpIntegration: jest.fn(),
  withStaticSpan: (callback: unknown) => callback
}));

import * as Sentry from "@sentry/nextjs";
import { monitoringConfig, safeMessage, sanitizeEvent, sanitizeSpan } from "../src/monitoring/privacy";
import { monitoringOptions } from "../src/monitoring/options";
import ErrorPage from "../src/pages/_error";
import type { NextPageContext } from "next";

const messageFixtures: [string, string][] = require("../../scripts/tests/monitoring-message-fixtures.json");

it.each(messageFixtures)("preserves technical text with targeted redaction: %s", (input, expected) => {
  expect(safeMessage(input)).toBe(expected);
  expect(safeMessage(input)).not.toContain("personal");
});

it("keeps unfamiliar explanations alongside the application stack", () => {
  const event = sanitizeEvent({ type: undefined, message: "ListingHeader requires a resource identifier", transaction: "/resources/[resourceId]",
    exception: { values: [{ type: "ResourcePublishingError", value: "ListingHeader requires a resource identifier", stacktrace: { frames: [
      { filename: "/_next/old.js", lineno: 1, in_app: true },
      { filename: "https://app.example/_next/page.js?token=private", lineno: 42, in_app: true },
      { filename: "/_next/vendor.js", lineno: 99, in_app: false }
    ] } }] } });
  expect(event.exception?.values?.[0]).toMatchObject({ type: "ResourcePublishingError",
    value: "ListingHeader requires a resource identifier" });
  expect(event.message).toBe(event.exception?.values?.[0].value);
  expect(event.transaction).toBe("/resources/[resourceId]");
  expect(JSON.stringify(event)).not.toMatch(/private|app\.example/);
});

it("rejects data-bearing exception names and raw error routes", () => {
  const event = sanitizeEvent({ type: undefined, message: "Unexpected account state", transaction: "/accounts/private",
    exception: { values: [{ type: "private@example.com", value: "Unexpected account state" }] } });
  expect(event.exception?.values?.[0]).toMatchObject({ type: "Error", value: "Unexpected account state" });
  expect(event.transaction).toBe("application.request");
  expect(JSON.stringify(event)).not.toContain("private");
});

it("uses the exception diagnostic when the root message was already removed", () => {
  expect(sanitizeEvent({ type: undefined, message: "Application error (details removed)", exception: { values: [{ type: "Error", value: "read ECONNRESET" }] } }).message)
    .toBe("read ECONNRESET");
});

it("limits messages and removes oversized quoted values", () => {
  expect(safeMessage(`Validation failed: "${"personal ".repeat(2000)}"`)).not.toContain("personal");
  const message = safeMessage("Unexpected account state. ".repeat(100));
  expect(message.length).toBeLessThanOrEqual(1000);
  expect(message).toContain("[truncated]");
});

it("retains the original technical explanation after repeated sanitization", () => {
  const event = { type: undefined, message: "Cannot read properties of undefined (reading 'account')",
    exception: { values: [{ type: "AccountStateError", value: "Expected ACTIVE account; received SUSPENDED" }] } };
  expect(sanitizeEvent(sanitizeEvent(event))).toEqual(sanitizeEvent(event));
});

it("keeps validated debug images but no arbitrary image metadata or credential-bearing URLs", () => {
  const image = { type: "sourcemap" as const, debug_id: "12345678-1234-4234-8234-123456789abc", code_file: "https://app.example/_next/static/chunks/app-abcd.js" };
  const invalid = [
    { ...image, debug_id: "secret" }, { ...image, type: "macho" as const, image_addr: "0x0" },
    ...["https://user:secret@host/_next/static/app.js", "https://host/_next/static/app.js?token=secret", "/_next/static/../secret.js", "/accounts/secret.js", "/Users/secret/app.js"].map(code_file => ({ ...image, code_file }))
  ];
  const extendedImage = { ...image, debug_file: "secret" };
  expect(sanitizeEvent({ debug_meta: { images: [extendedImage, ...invalid] } } as unknown as Parameters<typeof sanitizeEvent>[0]).debug_meta).toEqual({ images: [image] });
  expect(sanitizeEvent({ debug_meta: { images: invalid } } as unknown as Parameters<typeof sanitizeEvent>[0]).debug_meta).toBeUndefined();
});

it.each(["/", "/login", "/resources/[resourceId]", "/campaigns/[campaignId]/moderation", "/app/accounts/[accountId]"])("groups only known Next template %s", route => {
  expect(sanitizeEvent({ type: "transaction", transaction: route }).transaction).toBe(route);
});

it.each(["/resources/private-id", "/accounts/me@example.com", "/login?token=secret", "/private/[id]", "https://host/login"])("rejects raw/unregistered route %s", transaction => {
  expect(sanitizeEvent({ type: "transaction", transaction }).transaction).toBe("application.request");
});

it("keeps known performance categories without SQL, URLs or custom op text", () => {
  for (const op of ["http.client", "db.query", "navigation", "pageload", "db.SELECT secret"]) {
    const span = sanitizeSpan({ trace_id: "t", span_id: "s", start_timestamp: 1, timestamp: 2, status: "ok", op, description: "secret", data: { url: "https://secret" } });
    expect(span.op).toBe(op.includes("secret") ? "application" : op);
    expect(span).toMatchObject({ description: "application.operation", data: {} });
    expect(JSON.stringify(span)).not.toContain("secret");
  }
});

it("validates opt-in, environment, release and sample rate", () => {
  const env = { NODE_ENV: "production", SENTRY_DSN: "https://key@errors.example/1", SENTRY_ENVIRONMENT: "review", SENTRY_RELEASE: "web@abc" };
  expect(monitoringConfig(env)).toMatchObject({ enabled: true, environment: "review", release: "web@abc", tracesSampleRate: 0.01 });
  expect(monitoringConfig({ ...env, SENTRY_ENVIRONMENT: "test" })).toMatchObject({ enabled: true, environment: "test" });
  for (const override of [{ SENTRY_DSN: "" }, { NODE_ENV: "test" }, { NODE_ENV: "development" }, { SENTRY_ENVIRONMENT: "local" }, { JEST_WORKER_ID: "1" }]) {
    expect(monitoringConfig({ ...env, ...override }).enabled).toBe(false);
  }
  for (const rate of ["no", "-1", "2", "Infinity"]) expect(monitoringConfig({ ...env, SENTRY_TRACES_SAMPLE_RATE: rate }).tracesSampleRate).toBe(0.01);
  expect(monitoringConfig({ ...env, SENTRY_TRACES_SAMPLE_RATE: "0" }).tracesSampleRate).toBe(0);
});

it("strips sensitive errors, requests, source context and trace data", () => {
  const event = sanitizeEvent({ type: "transaction", transaction: "secret", start_timestamp: 1,
    request: { url: "https://example.com?session=secret", data: "secret", headers: { authorization: "secret" } },
    user: { email: "secret@example.com" }, extra: { variables: "secret" }, breadcrumbs: [{ message: "secret" }],
    spans: [{ trace_id: "trace", span_id: "span", start_timestamp: 1, timestamp: 2, status: "ok", description: "secret", data: { query: "secret" } }],
    exception: { values: [{ type: "TypeError", value: "Cannot read properties of undefined (reading 'account')", stacktrace: { frames: [{ filename: "https://example.com/chunk.js?token=secret", function: "render", lineno: 12, context_line: "secret", vars: { secret: true } }] } }] }
  });
  expect(JSON.stringify(event)).not.toContain("secret");
  expect(JSON.stringify(event)).not.toContain("example.com");
  expect(event.exception?.values?.[0].value).toContain("Cannot read properties");
  expect(event.exception?.values?.[0].stacktrace?.frames?.[0].filename).toBe("/chunk.js");
  expect(safeMessage("Failed to send message body: arbitrary private conversation contents")).toBe("Failed to send message body: [payload removed]");
});

it("disables automatic integrations, log events, PII and breadcrumbs by default", () => {
  const options = monitoringOptions({});
  expect(options).toMatchObject({ enabled: false, dataCollection: { userInfo: false, httpBodies: [], graphQL: { document: false, variables: false } }, defaultIntegrations: false, tracePropagationTargets: [] });
  expect(options.beforeBreadcrumb()).toBeNull();
  expect(options.beforeSendLog()).toBeNull();
  expect(options.beforeSendMetric()).toBeNull();
});

it("captures the Pages Router error page through the SDK", async () => {
  const context = { err: new Error("failure"), res: { statusCode: 500 } } as NextPageContext;
  expect(await ErrorPage.getInitialProps(context)).toMatchObject({ statusCode: 500 });
  expect(Sentry.captureUnderscoreErrorException).toHaveBeenCalledWith(context);
});