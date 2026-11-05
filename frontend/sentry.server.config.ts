import * as Sentry from "@sentry/nextjs";
import { monitoringOptions } from "./src/monitoring/options";

const options = monitoringOptions({
  NODE_ENV: process.env.NODE_ENV,
  JEST_WORKER_ID: process.env.JEST_WORKER_ID,
  SENTRY_DSN: process.env.SENTRY_DSN,
  SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT,
  SENTRY_RELEASE: process.env.SENTRY_RELEASE,
  SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE
});
if (options.enabled) {
  Sentry.init({ ...options, integrations: [Sentry.httpIntegration()] });
}