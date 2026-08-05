export type MobileSocialCallbackStatus = "success" | "register_required" | "link_confirmation_required" | "password_reset_required" | "error";
export type SocialAuthCallbackContext = "web" | "mobile";

export interface MobileSocialCallbackInput {
  status: MobileSocialCallbackStatus;
  nextDestination: string;
  email?: string;
  name?: string;
  providerSubject?: string;
  error?: string;
  pendingLinkToken?: string;
  pendingRegistrationToken?: string;
  sessionToken?: string;
  accountId?: string;
}

export function normalizeMobileSocialCallbackNextDestination(candidate: string | undefined): string {
  const value = typeof candidate === "string" ? candidate.trim() : "/";

  if (!value.startsWith("/")) {
    return "/";
  }

  return value;
}

export function resolveDefaultFrontendBaseUrl(env: { FRONTEND_URL?: string | undefined } = process.env): string {
  const configured = env.FRONTEND_URL?.trim();

  return configured || "http://localhost:3000";
}

export function resolveDefaultMobileAppBaseUrl(
  env: {
    MOBILE_APP_URL?: string | undefined;
    SOCIAL_AUTH_MOBILE_CALLBACK_URL?: string | undefined;
  } = process.env
): string {
  const configured = env.SOCIAL_AUTH_MOBILE_CALLBACK_URL?.trim() || env.MOBILE_APP_URL?.trim();
  return configured || "topela://";
}

export function normalizeSocialAuthCallbackContext(candidate: string | undefined): SocialAuthCallbackContext {
  return candidate === "mobile" ? "mobile" : "web";
}

export function resolveLocalUrl(candidate: string | undefined, fallbackUrl: string, env: { NODE_ENV?: string | undefined } = process.env): string {
  const configured = candidate?.trim();

  if (!configured) {
    return env.NODE_ENV === "production" ? fallbackUrl.replace("10.0.2.2", "localhost") : fallbackUrl;
  }

  try {
    const parsed = new URL(configured);

    if (env.NODE_ENV !== "production" && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) {
      return configured;
    }

    return configured;
  } catch {
    return fallbackUrl;
  }
}

export function buildMobileSocialCallbackUrl(
  provider: "google" | "apple",
  input: MobileSocialCallbackInput,
  frontendBaseUrl: string
): URL {
  const callbackUrl = new URL(`/auth/${provider}/callback`, frontendBaseUrl);
  callbackUrl.searchParams.set("status", input.status);
  callbackUrl.searchParams.set("next", normalizeMobileSocialCallbackNextDestination(input.nextDestination));

  if (input.email) {
    callbackUrl.searchParams.set("email", input.email);
  }

  if (input.name) {
    callbackUrl.searchParams.set("name", input.name);
  }

  if (input.providerSubject) {
    callbackUrl.searchParams.set("providerSubject", input.providerSubject);
  }

  if (input.error) {
    callbackUrl.searchParams.set("error", input.error);
  }

  if (input.pendingLinkToken) {
    callbackUrl.searchParams.set("pendingLinkToken", input.pendingLinkToken);
  }

  if (input.pendingRegistrationToken) {
    callbackUrl.searchParams.set("pendingRegistrationToken", input.pendingRegistrationToken);
  }

  if (input.sessionToken) {
    callbackUrl.searchParams.set("sessionToken", input.sessionToken);
  }

  if (input.accountId) {
    callbackUrl.searchParams.set("accountId", input.accountId);
  }

  return callbackUrl;
}
