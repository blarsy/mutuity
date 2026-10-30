import Constants from "expo-constants";

type TargetEnv = "local" | "test" | "review" | "prod";

export interface AppSettings {
  targetEnv: TargetEnv;
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
  cloudinary: {
    cloud: string;
    uploadPreset: string;
  };
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
  if (value === "local" || value === "test" || value === "review" || value === "prod") {
    return value;
  }

  throw new Error("Invalid app settings: targetEnv must be one of local, test, review, prod.");
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
  const cloudinary = rawSettings.cloudinary as Record<string, unknown> | undefined;
  if (!cloudinary || typeof cloudinary.cloud !== "string" || typeof cloudinary.uploadPreset !== "string") {
    throw new Error("Invalid app settings: cloudinary.cloud and cloudinary.uploadPreset must be strings.");
  }

  return {
    targetEnv,
    apiUrl,
    graphQlApiUrl,
    subscriptionsUrl,
    diagnostic,
    cloudinary: {
      cloud: cloudinary.cloud.trim(),
      uploadPreset: cloudinary.uploadPreset.trim()
    }
  };
}

export const appSettings = getAppSettings();
