import { monitoringConfig, sanitizeEvent, sanitizeSpan } from "./privacy";
import { withStaticSpan } from "@sentry/nextjs";

export function monitoringOptions(env: Record<string, string | undefined>) {
  return {
    ...monitoringConfig(env),
    dataCollection: {
      userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false,
      graphQL: { document: false, variables: false }, databaseQueryData: false,
      queues: false, stackFrameVariables: false, frameContextLines: 0
    },
    defaultIntegrations: false as const,
    beforeSendLog: () => null,
    beforeSendMetric: () => null,
    traceLifecycle: "static" as const,
    beforeSend: sanitizeEvent,
    beforeSendTransaction: sanitizeEvent,
    beforeSendSpan: withStaticSpan(sanitizeSpan),
    beforeBreadcrumb: () => null,
    // Never propagate trace/baggage headers to GraphQL, auth, or third parties.
    tracePropagationTargets: [] as string[]
  };
}