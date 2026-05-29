export type SocialProvider = "google" | "apple";

export const SOCIAL_AUTH_PROVIDERS: ReadonlyArray<SocialProvider> = ["google", "apple"];

function backendDerivedStartUrl(provider: SocialProvider) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim() ?? "";
  if (!backendBaseUrl) {
    return "";
  }

  const normalizedBase = backendBaseUrl.replace(/\/$/, "");
  return `${normalizedBase}/auth/${provider}/start`;
}

function getConfiguredStartUrl(provider: SocialProvider) {
  if (provider === "google") {
    return process.env.NEXT_PUBLIC_GOOGLE_AUTH_START_URL?.trim() || backendDerivedStartUrl(provider);
  }

  return process.env.NEXT_PUBLIC_APPLE_AUTH_START_URL?.trim() || backendDerivedStartUrl(provider);
}

function getConfiguredCallbackUrl(provider: SocialProvider) {
  if (provider === "google") {
    return (
      process.env.NEXT_PUBLIC_GOOGLE_AUTH_CALLBACK_URL?.trim()
      || process.env.NEXT_PUBLIC_GOOGLE_AUTH_REDIRECT_URI?.trim()
      || ""
    );
  }

  return (
    process.env.NEXT_PUBLIC_APPLE_AUTH_CALLBACK_URL?.trim()
    || process.env.NEXT_PUBLIC_APPLE_AUTH_REDIRECT_URI?.trim()
    || ""
  );
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

export function getSocialAuthCallbackUrl(provider: SocialProvider) {
  const configuredCallback = getConfiguredCallbackUrl(provider);

  if (!configuredCallback) {
    return null;
  }

  const isAbsolute = /^https?:\/\//i.test(configuredCallback);
  if (!isAbsolute && typeof window === "undefined") {
    return null;
  }

  return isAbsolute ? configuredCallback : new URL(configuredCallback, window.location.origin).toString();
}
