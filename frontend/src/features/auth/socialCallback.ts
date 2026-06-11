import type { ParsedUrlQuery } from "querystring";

import type { SocialProvider } from "./socialAuth";

function asSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function normalizeNext(nextValue: string) {
  return nextValue.startsWith("/") ? nextValue : "/";
}

function normalizeProvider(provider: string): SocialProvider {
  return provider === "apple" ? "apple" : "google";
}

export type SocialCallbackOutcome = {
  nextDestination: string;
  provider: SocialProvider;
  errorMessage: string | null;
  shouldRedirectToRegister: boolean;
  shouldRedirectToLoginForLink: boolean;
  registerPrefillHref: string;
  loginLinkHref: string;
  pendingLinkToken: string;
};

export function resolveSocialCallbackOutcome(
  provider: SocialProvider,
  query: ParsedUrlQuery
): SocialCallbackOutcome {
  const normalizedProvider = normalizeProvider(provider);
  const nextDestination = normalizeNext(asSingleValue(query.next));
  const errorMessage = asSingleValue(query.error) || null;
  const callbackStatus = asSingleValue(query.status).toLowerCase();
  const suggestedEmail = asSingleValue(query.email);
  const suggestedName = asSingleValue(query.name) || asSingleValue(query.suggestedName);
  const providerSubject = asSingleValue(query.providerSubject);
  const pendingLinkToken = asSingleValue(query.pendingLinkToken);

  const shouldRedirectToRegister =
    callbackStatus === "register_required"
    || (!errorMessage && callbackStatus === "no_account");
  const shouldRedirectToLoginForLink = callbackStatus === "link_confirmation_required";

  const params = new URLSearchParams();
  params.set("provider", normalizedProvider);
  if (suggestedEmail) {
    params.set("email", suggestedEmail);
  }
  if (suggestedName) {
    params.set("name", suggestedName);
  }
  if (providerSubject) {
    params.set("providerSubject", providerSubject);
  }

  const loginParams = new URLSearchParams();
  loginParams.set("next", nextDestination);
  if (shouldRedirectToLoginForLink) {
    loginParams.set("social_link_required", "1");
    loginParams.set("provider", normalizedProvider);
    if (suggestedEmail) {
      loginParams.set("email", suggestedEmail);
    }
    if (providerSubject) {
      loginParams.set("providerSubject", providerSubject);
    }
  }
  if (pendingLinkToken) {
    loginParams.set("pendingLinkToken", pendingLinkToken);
  }

  return {
    nextDestination,
    provider: normalizedProvider,
    errorMessage,
    shouldRedirectToRegister,
    shouldRedirectToLoginForLink,
    registerPrefillHref: `/register?${params.toString()}`,
    loginLinkHref: `/login?${loginParams.toString()}`,
    pendingLinkToken
  };
}
