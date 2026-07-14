import type { ConfigContext, ExpoConfig } from "expo/config";

type TargetEnv = "dev" | "test" | "prod";

interface EnvDefaults {
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
}

const APP_VERSION = "1.0.0";
const APP_VERSION_CODE = 175;

const ENV_DEFAULTS: Record<TargetEnv, EnvDefaults> = {
  dev: {
    apiUrl: "http://127.0.0.1:5000",
    graphQlApiUrl: "http://127.0.0.1:5000/graphql",
    subscriptionsUrl: "ws://127.0.0.1:5000/graphql",
    diagnostic: true
  },
  test: {
    apiUrl: "https://test.tope-la.com",
    graphQlApiUrl: "https://test.tope-la.com/graphql",
    subscriptionsUrl: "wss://test.tope-la.com/graphql",
    diagnostic: true
  },
  prod: {
    apiUrl: "https://www.tope-la.com",
    graphQlApiUrl: "https://www.tope-la.com/graphql",
    subscriptionsUrl: "wss://www.tope-la.com/graphql",
    diagnostic: false
  }
};

function resolveTargetEnv(value: string | undefined): TargetEnv {
  const normalized = value?.toLowerCase();

  if (normalized === "test") {
    return "test";
  }

  if (normalized === "prod") {
    return "prod";
  }

  return "dev";
}

export default function appConfig(_: ConfigContext): ExpoConfig {
  const targetEnv = resolveTargetEnv(process.env.TARGET_ENV ?? process.env.EXPO_PUBLIC_TARGET_ENV);
  const defaults = ENV_DEFAULTS[targetEnv];

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
      appSettings: defaults
    }
  };
}
