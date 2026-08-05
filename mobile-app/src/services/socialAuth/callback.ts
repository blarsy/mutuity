import { Linking } from "react-native";

import { appSettings } from "../../config/appSettings";

export type SocialProvider = "google" | "apple";
export type SocialCallbackStatus = "success" | "register_required" | "link_confirmation_required" | "password_reset_required" | "cancelled" | "error";

export interface SocialCallbackPayload {
  provider: SocialProvider;
  status: SocialCallbackStatus;
  nextDestination: string;
  email?: string | undefined;
  name?: string | undefined;
  providerSubject?: string | undefined;
  pendingRegistrationToken?: string | undefined;
  pendingLinkToken?: string | undefined;
  sessionToken?: string | undefined;
  accountId?: string | undefined;
  error?: string | undefined;
}

const SAFE_ROUTE_MAP: Record<string, string> = {
  "/my-hub": "MyHub",
  "/campaigns": "Campaigns",
  "/chat": "Chat",
  "/notifications": "Notifications",
  "/explore": "Explore"
};

function normalizeRoute(rawValue: string | undefined): string {
  const candidate = typeof rawValue === "string" ? rawValue.trim() : "";

  if (!candidate) {
    return "/";
  }

  if (!candidate.startsWith("/")) {
    return "/";
  }

  return candidate;
}

function normalizeRouteDestination(nextValue: string | undefined): string {
  const normalized = normalizeRoute(nextValue);
  const safeRoute = SAFE_ROUTE_MAP[normalized];

  if (safeRoute) {
    return safeRoute;
  }

  return normalized === "/" ? "Explore" : normalized;
}

export function parseSocialCallbackPayload(input?: Partial<SocialCallbackPayload>): SocialCallbackPayload {
  const provider = input?.provider === "apple" ? "apple" : "google";
  const status = input?.status ?? "error";
  const normalizedStatus = status === "success" || status === "register_required" || status === "link_confirmation_required" || status === "password_reset_required" || status === "cancelled" || status === "error"
    ? status
    : "error";
  const nextDestinationValue = input?.nextDestination ?? (input as { next?: string } | undefined)?.next;

  return {
    provider,
    status: normalizedStatus,
    nextDestination: normalizeRouteDestination(nextDestinationValue),
    email: typeof input?.email === "string" ? input.email : undefined,
    name: typeof input?.name === "string" ? input.name : undefined,
    providerSubject: typeof input?.providerSubject === "string" ? input.providerSubject : undefined,
    pendingRegistrationToken: typeof input?.pendingRegistrationToken === "string" ? input.pendingRegistrationToken : undefined,
    pendingLinkToken: typeof input?.pendingLinkToken === "string" ? input.pendingLinkToken : undefined,
    sessionToken: typeof input?.sessionToken === "string" ? input.sessionToken : undefined,
    accountId: typeof input?.accountId === "string" ? input.accountId : undefined,
    error: typeof input?.error === "string" ? input.error : undefined
  } satisfies SocialCallbackPayload;
}

export function parseSocialCallbackPayloadFromUrl(url: string): SocialCallbackPayload | null {
  try {
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    const pathProvider = parsedUrl.pathname.includes("/apple/") || parsedUrl.pathname.includes("/apple") ? "apple" : parsedUrl.pathname.includes("/google/") || parsedUrl.pathname.includes("/google") ? "google" : null;
    const provider = params.get("provider") === "apple" ? "apple" : params.get("provider") === "google" ? "google" : pathProvider ?? "google";
    const status = params.get("status") ?? "error";
    const next = params.get("next") ?? "/";

    return parseSocialCallbackPayload({
      provider: provider as SocialProvider,
      status: status as SocialCallbackStatus,
      nextDestination: next,
      email: params.get("email") ?? undefined,
      name: params.get("name") ?? undefined,
      providerSubject: params.get("providerSubject") ?? undefined,
      pendingRegistrationToken: params.get("pendingRegistrationToken") ?? undefined,
      pendingLinkToken: params.get("pendingLinkToken") ?? undefined,
      sessionToken: params.get("sessionToken") ?? undefined,
      accountId: params.get("accountId") ?? undefined,
      error: params.get("error") ?? undefined
    });
  } catch {
    return null;
  }
}

export async function openSocialAuthStart(provider: SocialProvider, destination: string): Promise<void> {
  const startUrl = new URL(`${appSettings.apiUrl}/auth/${provider}/start`);
  startUrl.searchParams.set("next", destination.startsWith("/") ? destination : "/");
  startUrl.searchParams.set("context", "mobile");
  await Linking.openURL(startUrl.toString());
}

export function getSocialCallbackPath(): string {
  return "/auth/:provider/callback";
}
