import * as Sentry from "@sentry/nextjs";
import { monitoringOptions } from "./src/monitoring/options";

const options = monitoringOptions({
  NODE_ENV: process.env.NODE_ENV,
  JEST_WORKER_ID: process.env.JEST_WORKER_ID,
  SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  SENTRY_ENVIRONMENT: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  SENTRY_RELEASE: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  SENTRY_TRACES_SAMPLE_RATE: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
});

// Next 14 Pages Router loads this file through withSentryConfig's client entry.
if (options.enabled) {
  Sentry.init({
    ...options,
    integrations: [
      Sentry.globalHandlersIntegration(),
      Sentry.browserApiErrorsIntegration(),
      Sentry.browserTracingIntegration()
    ] // Session/replay/profiling/log integrations are not installed.
  });
}