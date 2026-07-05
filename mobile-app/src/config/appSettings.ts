import { Platform } from "react-native";

type TargetEnv = "dev" | "test" | "prod";

export interface AppSettings {
  targetEnv: TargetEnv;
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
}

interface AppSettingsDefaults {
  apiUrl: string;
  graphQlApiUrl: string;
  subscriptionsUrl: string;
  diagnostic: boolean;
}

const ENV_DEFAULTS: Record<TargetEnv, AppSettingsDefaults> = {
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

function resolveLocalGraphqlUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000/graphql";
  }

  return "http://127.0.0.1:5000/graphql";
}

function resolveLocalApiUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:5000";
  }

  return "http://127.0.0.1:5000";
}

export function getAppSettings(): AppSettings {
  const targetEnv = resolveTargetEnv(process.env.EXPO_PUBLIC_TARGET_ENV ?? process.env.TARGET_ENV);
  const defaults = ENV_DEFAULTS[targetEnv];

  const graphQlApiUrl =
    process.env.EXPO_PUBLIC_GRAPHQL_URL ?? (targetEnv === "dev" ? resolveLocalGraphqlUrl() : defaults.graphQlApiUrl);

  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? (targetEnv === "dev" ? resolveLocalApiUrl() : defaults.apiUrl);

  const subscriptionsUrl = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_URL ?? defaults.subscriptionsUrl;

  const diagnostic =
    process.env.EXPO_PUBLIC_DIAGNOSTIC === "true"
      ? true
      : process.env.EXPO_PUBLIC_DIAGNOSTIC === "false"
        ? false
        : defaults.diagnostic;

  return {
    targetEnv,
    apiUrl,
    graphQlApiUrl,
    subscriptionsUrl,
    diagnostic
  };
}

export const appSettings = getAppSettings();
