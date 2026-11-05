import Constants from "expo-constants";
import * as Sentry from "@sentry/react-native";

describe("mobile monitoring lifecycle", () => {
  const env = { ...process.env };
  const originalConfig = Constants.expoConfig;
  const originalDev = __DEV__;
  const originalOwnership = Constants.appOwnership;
  let monitoring: typeof import("../src/services/monitoring/sentry");
  let logger: typeof import("../src/services/monitoring/logger");

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...env, NODE_ENV: "production", EXPO_PUBLIC_STORYBOOK_ENABLED: "false" };
    Object.defineProperty(global, "__DEV__", { value: false, configurable: true });
    Constants.expoConfig = {
      ...originalConfig!, name: "Tope Là", slug: "tope-la", version: "1.0.7",
      ios: { buildNumber: "182" }, android: { versionCode: 182 },
      extra: { targetEnv: "review", monitoring: { dsn: "https://public@errors.example.com/1", storybook: false } }
    };
    jest.isolateModules(() => {
      // Share this test's mutable constants object across the isolation boundary.
      jest.doMock("expo-constants", () => ({ __esModule: true, default: Constants }));
      monitoring = require("../src/services/monitoring/sentry");
      logger = require("../src/services/monitoring/logger");
    });
  });

  afterEach(() => {
    process.env = { ...env };
    Constants.expoConfig = originalConfig;
    Constants.appOwnership = originalOwnership;
    Object.defineProperty(global, "__DEV__", { value: originalDev, configurable: true });
    jest.restoreAllMocks();
  });

  it.each(["missing DSN", "development", "Jest", "Storybook env", "Storybook config", "local", "Expo Go"])(
    "does not initialize, wrap, capture or register navigation in %s", reason => {
      if (reason === "missing DSN") Constants.expoConfig!.extra!.monitoring.dsn = "";
      if (reason === "development") Object.defineProperty(global, "__DEV__", { value: true });
      if (reason === "Jest") process.env.NODE_ENV = "test";
      if (reason === "Storybook env") process.env.EXPO_PUBLIC_STORYBOOK_ENABLED = "true";
      if (reason === "Storybook config") Constants.expoConfig!.extra!.monitoring.storybook = true;
      if (reason === "local") Constants.expoConfig!.extra!.targetEnv = "local";
      if (reason === "Expo Go") Constants.appOwnership = "expo" as typeof Constants.appOwnership;
      const App = () => null;
      expect(monitoring.wrapMonitoredApp(App)).toBe(App);
      monitoring.captureAppError("graphql-error", new Error("secret"));
      monitoring.registerMonitoringNavigation({});
      expect(Sentry.init).not.toHaveBeenCalled();
      expect(Sentry.wrap).not.toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    }
  );

  it("initializes once with native errors, 1% navigation traces and privacy controls", () => {
    const App = () => null;
    monitoring.wrapMonitoredApp(App);
    monitoring.initializeMonitoring();
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.wrap).toHaveBeenCalledWith(App);
    const options = jest.mocked(Sentry.init).mock.calls[0]![0]!;
    expect(options).toMatchObject({
      environment: "review", enableNative: true, enableNativeCrashHandling: true,
      tracesSampleRate: 0.01, tracePropagationTargets: [], enableLogs: false,
      enableAutoSessionTracking: false, sendDefaultPii: false, maxBreadcrumbs: 0,
      enableAutoPerformanceTracing: false, attachScreenshot: false, attachViewHierarchy: false
    });
    expect(options).not.toHaveProperty("profilesSampleRate");
    expect(options).not.toHaveProperty("replaysSessionSampleRate");
    const defaults = ["Breadcrumbs", "HttpContext", "ExpoContext", "MobileReplay", "HermesProfiling", "ReactNativeErrorHandlers", "Release", "Dedupe"]
      .map(name => ({ name }));
    const integrations = typeof options.integrations === "function" ? options.integrations(defaults) : [];
    expect(integrations.map(integration => integration.name)).toEqual(["ReactNativeErrorHandlers", "Release", "Dedupe", "ReactNavigation"]);
    const ref = {};
    monitoring.registerMonitoringNavigation(ref);
    expect(jest.mocked(Sentry.reactNavigationIntegration).mock.results[0]!.value.registerNavigationContainer).toHaveBeenCalledWith(ref);
    const hint = { attachments: [{ filename: "chat.txt", data: "secret" }] };
    const safe = options.beforeSend?.({ type: undefined, message: "secret" }, hint);
    expect(hint.attachments).toEqual([]);
    expect(safe).toMatchObject({ release: "com.topela@1.0.7+182", dist: "182" });
    const nativeRelease = options.beforeSend?.({ type: undefined, release: "native@2.0+200", dist: "200" }, {});
    expect(nativeRelease).toMatchObject({ release: "native@2.0+200", dist: "200" });
  });

  it("captures only sanitized logger errors, deduplicates error objects, never captures info/debug/warn", () => {
    monitoring.initializeMonitoring();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "debug").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    const original = Object.assign(new Error("PRIVATE_CHAT"), { variables: { token: "PRIVATE_TOKEN" } });
    logger.logAppEvent({ level: "error", message: "graphql-error", details: original });
    logger.logAppEvent({ level: "error", message: "graphql-error", details: original });
    for (const level of ["info", "debug", "warn"] as const) logger.logAppEvent({ level, message: "PRIVATE_CHAT", details: original });
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [captured, context] = jest.mocked(Sentry.captureException).mock.calls[0]!;
    expect(captured).not.toBe(original);
    expect((captured as Error).message).toBe("[Redacted error message]");
    expect((captured as Error).stack).not.toContain("PRIVATE_CHAT");
    expect(captured).not.toHaveProperty("variables");
    expect(context).toEqual({ tags: { mobile_error_code: "graphql-error" } });
  });
});