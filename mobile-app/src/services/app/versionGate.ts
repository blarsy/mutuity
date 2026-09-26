import Constants from "expo-constants";
import { Platform } from "react-native";

import { appSettings } from "../../config/appSettings";

export type AppPlatform = "ios" | "android";

export interface AppVersionFloor {
  minIosSemver: string;
  minAndroidSemver: string;
}

/** The version of the running app (from app.config.ts APP_VERSION). */
export function getCurrentAppVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

export function getCurrentAppPlatform(): AppPlatform {
  return Platform.OS === "android" ? "android" : "ios";
}

/**
 * Fetches the authoritative minimum version floor from the backend `/health`
 * endpoint. This is a plain HTTP GET, so it is never subject to the GraphQL
 * version gate and always succeeds for a too-old client.
 */
export async function fetchAppVersionFloor(): Promise<AppVersionFloor | null> {
  try {
    const response = await fetch(`${appSettings.apiUrl}/health`, {
      method: "GET",
      headers: { accept: "application/json" }
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      appVersionPolicy?: { minIosSemver?: unknown; minAndroidSemver?: unknown };
    };

    const policy = payload.appVersionPolicy;
    if (!policy) {
      return null;
    }

    const minIosSemver = typeof policy.minIosSemver === "string" ? policy.minIosSemver : "0.0.0";
    const minAndroidSemver = typeof policy.minAndroidSemver === "string" ? policy.minAndroidSemver : "0.0.0";

    return { minIosSemver, minAndroidSemver };
  } catch {
    return null;
  }
}

/** Resolves the minimum version for the current platform from a floor. */
export function minimumVersionForPlatform(
  floor: AppVersionFloor,
  platform: AppPlatform = getCurrentAppPlatform()
): string {
  return platform === "android" ? floor.minAndroidSemver : floor.minIosSemver;
}