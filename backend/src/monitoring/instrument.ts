import "dotenv/config";
import * as Sentry from "@sentry/node";
import { monitoringConfig, sanitizeEvent, sanitizeSpan } from "./privacy.js";

const config = monitoringConfig(process.env);
if (config.enabled) {
  Sentry.init({
    ...config,
    dataCollection: {
      userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false,
      graphQL: { document: false, variables: false }, databaseQueryData: false,
      queues: false, stackFrameVariables: false, frameContextLines: 0
    },
    defaultIntegrations: false,
    // Explicit allowlist: no local variables, console/log firehose, sessions,
    // GraphQL document/variables, database query capture or profiling.
    integrations: [
      Sentry.httpIntegration(), Sentry.expressIntegration(),
      // SDK fatal handlers drain the client before exiting with status 1.
      Sentry.onUncaughtExceptionIntegration({ exitEvenIfOtherHandlersAreRegistered: true }),
      Sentry.onUnhandledRejectionIntegration({ mode: "strict" })
    ],
    shutdownTimeout: 2000,
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    // GlitchTip consumes classic transactions; v11 defaults to streamed spans.
    traceLifecycle: "static",
    tracePropagationTargets: [],
    beforeSend: sanitizeEvent,
    beforeSendTransaction: sanitizeEvent,
    beforeSendSpan: Sentry.withStaticSpan(sanitizeSpan),
    beforeBreadcrumb: () => null
  });
}

export function captureUnexpectedError(error: unknown) {
  if (config.enabled) Sentry.captureException(error);
}

export async function flushMonitoring() {
  if (config.enabled) await Sentry.flush(2000);
}