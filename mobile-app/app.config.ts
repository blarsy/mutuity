import fs from "node:fs";
import path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

type TargetEnv = "local" | "test" | "prod";

interface ExternalAppSettings {
  targetEnv: TargetEnv;
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
}

const APP_VERSION = "1.0.0";
const APP_VERSION_CODE = 175;

function resolveTargetEnv(value: string | undefined): TargetEnv {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    throw new Error("Missing TARGET_ENV. Expected one of: local, test, prod.");
  }

  if (normalized === "local") {
    return "local";
  }

  if (normalized === "test") {
    return "test";
  }

  if (normalized === "prod") {
    return "prod";
  }

  throw new Error(`Invalid TARGET_ENV value: ${value}. Expected one of: local, test, prod.`);
}

function assertValidAppSettings(value: unknown, filePath: string): asserts value is ExternalAppSettings {
  if (!value || typeof value !== "object") {
    throw new Error(`Invalid app settings in ${filePath}: expected an object.`);
  }

  const config = value as Record<string, unknown>;
  const missingKeys: string[] = [];

  const requiredStringKeys = ["targetEnv", "apiUrl", "graphQlApiUrl", "subscriptionsUrl"];
  for (const key of requiredStringKeys) {
    if (typeof config[key] !== "string" || config[key].length === 0) {
      missingKeys.push(key);
    }
  }

  if (typeof config.diagnostic !== "boolean") {
    missingKeys.push("diagnostic");
  }

  if (missingKeys.length > 0) {
    throw new Error(`Invalid app settings in ${filePath}: missing or invalid ${missingKeys.join(", ")}.`);
  }

  if (config.targetEnv !== "local" && config.targetEnv !== "test" && config.targetEnv !== "prod") {
    throw new Error(`Invalid app settings in ${filePath}: unsupported targetEnv value \"${String(config.targetEnv)}\".`);
  }
}

function loadAppSettings(targetEnv: TargetEnv): ExternalAppSettings {
  const filePath = path.join(__dirname, "config", "environments", `${targetEnv}.json`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing environment config file: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in environment config file: ${filePath}`);
  }

  assertValidAppSettings(parsed, filePath);

  return parsed;
}

export default function appConfig(_: ConfigContext): ExpoConfig {
  const targetEnv = resolveTargetEnv(process.env.TARGET_ENV);
  const appSettings = loadAppSettings(targetEnv);

  return {
    name: "Tope Là",
    slug: "tope-la",
    scheme: "topela",
    version: APP_VERSION,
    orientation: "portrait",
    userInterfaceStyle: "light",
    ios: {
      bundleIdentifier: "com.topela",
      buildNumber: String(APP_VERSION_CODE),
      supportsTablet: true,
      infoPlist: {
        CFBundleAllowMixedLocalizations: true,
        GMSApiKey: process.env.EXPO_GOOGLE_MAPS_API_KEY ?? ""
      },
      config: {
        googleMapsApiKey: process.env.EXPO_GOOGLE_MAPS_API_KEY
      }
    },
    android: {
      package: "com.topela",
      versionCode: APP_VERSION_CODE,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_GOOGLE_MAPS_API_KEY
        }
      }
    },
    locales: {
      en: "./locales/en.json",
      fr: "./locales/fr.json"
    },
    plugins: [
      "expo-secure-store",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Mutuity would like to access your location to position resources and calculate proximity."
        }
      ]
    ],
    extra: {
      targetEnv,
      appSettings
    }
  };
}
