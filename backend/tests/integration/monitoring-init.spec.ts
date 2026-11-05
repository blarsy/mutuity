jest.mock("@sentry/node", () => ({
  init: jest.fn(), captureException: jest.fn(), flush: jest.fn().mockResolvedValue(true),
  httpIntegration: jest.fn(() => ({ name: "Http" })),
  expressIntegration: jest.fn(() => ({ name: "Express" })),
  onUncaughtExceptionIntegration: jest.fn(() => ({ name: "OnUncaughtException" })),
  onUnhandledRejectionIntegration: jest.fn(() => ({ name: "OnUnhandledRejection" })),
  withStaticSpan: (callback: unknown) => callback
}));

const previous = process.env;
afterEach(() => { process.env = previous; jest.resetModules(); });

it("does not initialize or flush SDK in local/tests even if a DSN is present", async () => {
  process.env = { ...previous, NODE_ENV: "test", SENTRY_DSN: "https://key@errors.invalid/1" };
  const monitoring = await import("../../src/monitoring/instrument");
  const sentry = await import("@sentry/node");
  monitoring.captureUnexpectedError(new Error("test"));
  await monitoring.flushMonitoring();
  expect(sentry.init).not.toHaveBeenCalled();
  expect(sentry.captureException).not.toHaveBeenCalled();
  expect(sentry.flush).not.toHaveBeenCalled();
});

it("initializes only approved integrations with v11 privacy controls and flushes boundedly", async () => {
  process.env = { ...previous, NODE_ENV: "production", SENTRY_DSN: "https://key@errors.invalid/1", SENTRY_ENVIRONMENT: "review" };
  delete process.env.JEST_WORKER_ID;
  const monitoring = await import("../../src/monitoring/instrument");
  const sentry = await import("@sentry/node");
  expect(sentry.init).toHaveBeenCalledWith(expect.objectContaining({
    defaultIntegrations: false, traceLifecycle: "static", tracesSampleRate: 0.01,
    integrations: [{ name: "Http" }, { name: "Express" }, { name: "OnUncaughtException" }, { name: "OnUnhandledRejection" }],
    shutdownTimeout: 2000,
    dataCollection: expect.objectContaining({ userInfo: false, cookies: false, httpBodies: [], graphQL: { document: false, variables: false } })
  }));
  expect(sentry.onUncaughtExceptionIntegration).toHaveBeenCalledWith({ exitEvenIfOtherHandlersAreRegistered: true });
  expect(sentry.onUnhandledRejectionIntegration).toHaveBeenCalledWith({ mode: "strict" });
  const error = new Error("fault");
  monitoring.captureUnexpectedError(error);
  await monitoring.flushMonitoring();
  expect(sentry.captureException).toHaveBeenCalledWith(error);
  expect(sentry.flush).toHaveBeenCalledWith(2000);
});