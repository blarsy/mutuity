import { spawnSync } from "node:child_process";

// Real SDK, isolated process: never attach fatal listeners to the Jest worker,
// and never send a network request. A delayed transport proves exit waits for drain.
it.each(["exception", "rejection"])("drains the SDK and exits nonzero on fatal %s", kind => {
  const child = spawnSync(process.execPath, ["-e", `
    const Sentry = require('@sentry/node');
    let pending = Promise.resolve();
    Sentry.init({
      dsn: 'https://key@errors.invalid/1', defaultIntegrations: false,
      integrations: [
        Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: true }),
        Sentry.onUnhandledRejectionIntegration({ mode: 'strict' })
      ], shutdownTimeout: 2000,
      beforeSend: event => ({ event_id: event.event_id, message: 'Application error (details removed)' }),
      transport: () => ({
        send: () => pending = new Promise(resolve => setTimeout(() => { console.log('safe-event-drained'); resolve({ statusCode: 200 }); }, 20)),
        flush: () => pending.then(() => true)
      })
    });
    // Ensure an existing application listener cannot accidentally suppress exit.
    process.on('uncaughtException', () => {});
    ${kind === "exception" ? "setImmediate(() => { throw new Error('private'); });" : "Promise.reject(new Error('private'));"}
  `], { encoding: "utf8", timeout: 10000 });
  expect(child.error).toBeUndefined();
  expect(child.status).toBe(1);
  expect(child.stdout).toContain("safe-event-drained");
  expect(child.stdout).not.toContain("private");
});