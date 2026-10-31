import fs from "node:fs";
import path from "node:path";

import type { ConfigContext, ExpoConfig } from "expo/config";

type TargetEnv = "local" | "test" | "review" | "prod";

interface ExternalAppSettings {
  targetEnv: TargetEnv;
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
  googleMaps: {
    androidApiKey: string;
    iosApiKey: string;
  };
  cloudinary: {
    cloud: string;
    uploadPreset: string;
  };
}

const APP_VERSION = "1.0.6";
const APP_VERSION_CODE = 181;

function resolveTargetEnv(value: string | undefined): TargetEnv {
  const normalized = value?.toLowerCase();

  if (!normalized) {
    throw new Error("Missing TARGET_ENV. Expected one of: local, test, review, prod.");
  }

  if (normalized === "local") {
    return "local";
  }

  if (normalized === "test") {
    return "test";
  }

  if (normalized === "review") {
    return "review";
  }

  if (normalized === "prod") {
    return "prod";
  }

  throw new Error(`Invalid TARGET_ENV value: ${value}. Expected one of: local, test, review, prod.`);
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

  // Empty strings explicitly disable optional integrations; missing/malformed fields fail the build.
  for (const [section, keys] of [
    ["googleMaps", ["androidApiKey", "iosApiKey"]],
    ["cloudinary", ["cloud", "uploadPreset"]]
  ] as const) {
    const settings = config[section];
    for (const key of keys) {
      if (!settings || typeof settings !== "object" || typeof (settings as Record<string, unknown>)[key] !== "string") {
        missingKeys.push(`${section}.${key}`);
      }
    }
  }

  if (missingKeys.length > 0) {
    throw new Error(`Invalid app settings in ${filePath}: missing or invalid ${missingKeys.join(", ")}.`);
  }

  if (
    config.targetEnv !== "local" &&
    config.targetEnv !== "test" &&
    config.targetEnv !== "review" &&
    config.targetEnv !== "prod"
  ) {
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

  if (parsed.targetEnv !== targetEnv) {
    throw new Error(`Invalid app settings in ${filePath}: targetEnv must match ${targetEnv}.`);
  }

  return parsed;
}

export default function appConfig(_: ConfigContext): ExpoConfig {
  const targetEnv = resolveTargetEnv(process.env.TARGET_ENV);
  const { googleMaps, ...appSettings } = loadAppSettings(targetEnv);
  const iosGoogleMapsApiKey = googleMaps.iosApiKey.trim();
  const androidGoogleMapsApiKey = googleMaps.androidApiKey.trim();

  return {
    name: "Tope Là",
    slug: "tope-la",
    owner: "tope_la",
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
        NSPhotoLibraryUsageDescription:
          "Tope-là would like to access your photos so you can choose images for your needs and resources.",
        NSCameraUsageDescription:
          "Tope-là would like to access your camera so you can take photos for your needs and resources.",
        GMSApiKey: iosGoogleMapsApiKey
      },
      config: {
        googleMapsApiKey: iosGoogleMapsApiKey
      }
    },
    android: {
      package: "com.topela",
      versionCode: APP_VERSION_CODE,
      config: {
        googleMaps: {
          apiKey: androidGoogleMapsApiKey
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
            "Tope-là would like to access your location to position resources and calculate proximity."
        }
      ],
      "expo-asset",
      "expo-font"
    ],
    extra: {
      targetEnv,
      appSettings,
      eas: {
        projectId: "484b7ec5-78c2-47e0-bc80-4f9182b4916a"
      }
    }
  };
}
