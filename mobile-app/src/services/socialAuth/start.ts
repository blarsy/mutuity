import { appSettings } from "../../config/appSettings";

export type SocialProvider = "google" | "apple";

export function buildSocialAuthStartUrl(provider: SocialProvider, nextDestination: string): string {
  const startUrl = `${appSettings.apiUrl}/auth/${provider}/start`;
  const normalized = nextDestination.startsWith("/") ? nextDestination : "/";
  const separator = startUrl.includes("?") ? "&" : "?";

  return `${startUrl}${separator}next=${encodeURIComponent(normalized)}`;
}
