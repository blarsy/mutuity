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
  registerPrefillHref: string;
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

  const shouldRedirectToRegister =
    callbackStatus === "register_required"
    || callbackStatus === "link_confirmation_required"
    || (!errorMessage && callbackStatus === "no_account");

  const params = new URLSearchParams();
  params.set("provider", normalizedProvider);
  if (suggestedEmail) {
    params.set("email", suggestedEmail);
  }
  if (suggestedName) {
    params.set("name", suggestedName);
  }

  return {
    nextDestination,
    provider: normalizedProvider,
    errorMessage,
    shouldRedirectToRegister,
    registerPrefillHref: `/register?${params.toString()}`
  };
}
