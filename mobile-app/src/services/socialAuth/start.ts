import { appSettings } from "../../config/appSettings";
import { getCurrentAppPlatform, getCurrentAppVersion } from "../app/versionGate";

export type SocialProvider = "google" | "apple";

export function buildSocialAuthStartUrl(provider: SocialProvider, nextDestination: string): string {
  const startUrl = `${appSettings.apiUrl}/auth/${provider}/start`;
  const normalized = nextDestination.startsWith("/") ? nextDestination : "/";
  const query = new URLSearchParams({
    next: normalized,
    appVersion: getCurrentAppVersion(),
    appPlatform: getCurrentAppPlatform()
  });

  return `${startUrl}?${query.toString()}`;
}
