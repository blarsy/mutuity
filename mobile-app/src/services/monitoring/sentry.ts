import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Sentry from "@sentry/react-native";
import type { ComponentType } from "react";

import { safeLogCode, sanitizeErrorEvent, sanitizeTransactionEvent } from "./privacy";

export function getMonitoringSettings() {
  const config = Constants.expoConfig;
  const extra = config?.extra;
  const raw = extra?.monitoring;
  const dsn = typeof raw?.dsn === "string" ? raw.dsn.trim() : "";
  const environment = extra?.targetEnv;
  const build = Platform.OS === "ios"
    ? Constants.platform?.ios?.buildNumber ?? config?.ios?.buildNumber
    : Constants.platform?.android?.versionCode ?? config?.android?.versionCode;
  return {
    dsn,
    environment,
    // The native Release integration takes precedence; this is only a manifest fallback.
    release: `com.topela@${config?.version ?? "unknown"}+${build ?? "unknown"}`,
    dist: String(build ?? "unknown"),
    enabled: Boolean(dsn) && (environment === "test" || environment === "review" || environment === "prod") &&
      !__DEV__ && process.env.NODE_ENV !== "test" && raw?.storybook !== true &&
      process.env.EXPO_PUBLIC_STORYBOOK_ENABLED !== "true" && Constants.appOwnership !== "expo"
  };
}

let initialized = false;
let navigation: ReturnType<typeof Sentry.reactNavigationIntegration> | undefined;

export function initializeMonitoring(): boolean {
  if (initialized) return true;
  const settings = getMonitoringSettings();
  if (!settings.enabled) return false;

  navigation = Sentry.reactNavigationIntegration({
    enableTimeToInitialDisplay: false,
    useDispatchedActionData: false
  });
  Sentry.init({
    dsn: settings.dsn,
    environment: settings.environment,
    enableNative: true,
    enableNativeCrashHandling: true,
    enableAutoSessionTracking: false,
    enableLogs: false,
    sendDefaultPii: false,
    maxBreadcrumbs: 0,
    beforeBreadcrumb: () => null,
    attachScreenshot: false,
    attachViewHierarchy: false,
    attachThreads: false,
    enableCaptureFailedRequests: false,
    enableAutoPerformanceTracing: false,
    enableAppStartTracking: false,
    enableNativeFramesTracking: false,
    enableStallTracking: false,
    enableUserInteractionTracing: false,
    enableAppHangTracking: false,
    enableWatchdogTerminationTracking: false,
    tracesSampleRate: 0.01,
    tracePropagationTargets: [],
    // No HTTP/console breadcrumbs, Expo manifests, device IDs, replay or profiling integrations.
    integrations: defaults => defaults.filter(integration => [
      "ReactNativeErrorHandlers", "Dedupe", "Release", "RewriteFrames", "EventOrigin", "SdkInfo"
    ].includes(integration.name)).concat(navigation!),
    beforeSend: (event, hint) => {
      // Attachments are envelope items, not event fields, and need a separate guard.
      hint.attachments = [];
      return sanitizeErrorEvent({
        ...event, release: event.release ?? settings.release, dist: event.dist ?? settings.dist
      });
    },
    beforeSendTransaction: event => sanitizeTransactionEvent({
      ...event, release: event.release ?? settings.release, dist: event.dist ?? settings.dist
    })
  });
  initialized = true;
  return true;
}

export function registerMonitoringNavigation(ref: unknown): void {
  navigation?.registerNavigationContainer(ref);
}

const capturedErrors = new WeakSet<Error>();

export function captureAppError(message: string, details?: unknown): void {
  if (!initialized) return;
  // Never send the original error: Apollo/native errors can contain requests, variables and chat text.
  if (details instanceof Error) {
    if (capturedErrors.has(details)) return;
    capturedErrors.add(details);
  }
  const error = new Error("[Redacted error message]");
  if (details instanceof Error && details.stack) {
    error.stack = `Error: [Redacted error message]\n${details.stack.split("\n").slice(1).join("\n")}`;
  }
  Sentry.captureException(error, { tags: { mobile_error_code: safeLogCode(message) } });
}

export function wrapMonitoredApp<T extends ComponentType<any>>(App: T): T {
  return (initializeMonitoring() ? Sentry.wrap(App) : App) as T;
}