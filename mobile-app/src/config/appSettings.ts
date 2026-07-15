import Constants from "expo-constants";

type TargetEnv = "local" | "test" | "prod";

export interface AppSettings {
  targetEnv: TargetEnv;
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
}

function assertString(value: unknown, key: keyof AppSettings): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Invalid app settings: ${key} must be a non-empty string.`);
  }

  return value;
}

function assertBoolean(value: unknown, key: keyof AppSettings): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`Invalid app settings: ${key} must be a boolean.`);
  }

  return value;
}

function assertTargetEnv(value: unknown): TargetEnv {
  if (value === "local" || value === "test" || value === "prod") {
    return value;
  }

  throw new Error("Invalid app settings: targetEnv must be one of local, test, prod.");
}

export function getAppSettings(): AppSettings {
  const extra = Constants.expoConfig?.extra;
  const rawSettings = extra?.appSettings as Record<string, unknown> | undefined;

  if (!rawSettings) {
    throw new Error("Missing app settings: expoConfig.extra.appSettings is not defined.");
  }

  const targetEnv = assertTargetEnv(rawSettings.targetEnv);
  const apiUrl = assertString(rawSettings.apiUrl, "apiUrl");
  const graphQlApiUrl = assertString(rawSettings.graphQlApiUrl, "graphQlApiUrl");
  const subscriptionsUrl = assertString(rawSettings.subscriptionsUrl, "subscriptionsUrl");
  const diagnostic = assertBoolean(rawSettings.diagnostic, "diagnostic");

  return {
    targetEnv,
    apiUrl,
    graphQlApiUrl,
    subscriptionsUrl,
    diagnostic
  };
}

export const appSettings = getAppSettings();
