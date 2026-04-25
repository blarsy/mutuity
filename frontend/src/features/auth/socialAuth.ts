export type SocialProvider = "google" | "apple";

function getConfiguredStartUrl(provider: SocialProvider) {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL?.trim() ?? "";
  }

  return process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL?.trim() ?? "";
}

export function getSocialAuthStartUrl(provider: SocialProvider, nextDestination: string) {
  const configuredBaseUrl = getConfiguredStartUrl(provider);

  if (!configuredBaseUrl) {
    return null;
  }

  const isAbsolute = /^https?:\/\//i.test(configuredBaseUrl);
  if (!isAbsolute && typeof window === "undefined") {
    return null;
  }

  const url = isAbsolute
    ? new URL(configuredBaseUrl)
    : new URL(configuredBaseUrl, window.location.origin);
  if (nextDestination.startsWith("/")) {
    url.searchParams.set("next", nextDestination);
  }

  return url.toString();
}
