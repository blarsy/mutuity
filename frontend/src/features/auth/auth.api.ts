import { CombinedGraphQLErrors } from "@apollo/client/errors";

import {
  AUTH_CHANGE_PASSWORD_MUTATION,
  AUTH_LOGIN_MUTATION,
  AUTH_LOGOUT_MUTATION,
  AUTH_SESSION_QUERY,
  CONFIRM_EMAIL_VERIFICATION_MUTATION,
  CONFIRM_PASSWORD_RESET_WITH_PASSWORD_MUTATION,
  REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION,
  REGISTER_LOCAL_ACCOUNT_WITH_SOCIAL_IDENTITY_MUTATION,
  REQUEST_EMAIL_VERIFICATION_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION
} from "./auth.queries";
import { apolloClient } from "../../services/graphql/client";
import i18n from "../../i18n";
import type { AuthSession, LoginInput } from "./types";

function normalizeAuthSession(payload: Partial<AuthSession> | null | undefined): AuthSession {
  return {
    authenticated: Boolean(payload?.authenticated),
    account: payload?.account ?? null,
    role: payload?.role ?? "anonymous",
    expiresAt: payload?.expiresAt ?? null
  };
}

function toGraphQLErrorMessage(error: unknown, fallback: string) {
  if (!error) {
    return fallback;
  }

  if (CombinedGraphQLErrors.is(error) && error.errors[0]?.message) {
    return error.errors[0].message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getCurrentSession() {
  return apolloClient
    .query<{ authSession?: Partial<AuthSession> | null }>({
      query: AUTH_SESSION_QUERY,
      fetchPolicy: "no-cache"
    })
    .then(result => normalizeAuthSession(result.data?.authSession))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function login(input: LoginInput) {
  return apolloClient
    .mutate<{ authLogin?: { authSession?: Partial<AuthSession> | null } }>({
      mutation: AUTH_LOGIN_MUTATION,
      variables: {
        identifier: input.identifier,
        password: input.password
      }
    })
    .then(result => normalizeAuthSession(result.data?.authLogin?.authSession))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function logout() {
  return apolloClient
    .mutate<{ authLogout?: { authSession?: Partial<AuthSession> | null } }>({
      mutation: AUTH_LOGOUT_MUTATION
    })
    .then(result => normalizeAuthSession(result.data?.authLogout?.authSession))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function registerLocalAccount(input: {
  identifier: string;
  displayName: string;
  password: string;
  preferredLanguage?: "en" | "fr";
}) {
  return apolloClient
    .mutate<{ registerLocalAccountWithPassword?: { boolean?: boolean | null } }>({
      mutation: REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION,
      variables: {
        identifier: input.identifier,
        displayName: input.displayName,
        password: input.password,
        verificationTtlMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000),
        preferredLanguage: input.preferredLanguage
      }
    })
    .then(() => ({
      message: "Account created. Please verify your email."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function registerLocalAccountWithSocialIdentity(input: {
  identifier: string;
  displayName: string;
  password?: string;
  provider: "google" | "apple";
  providerSubject: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  preferredLanguage?: "en" | "fr";
}) {
  return apolloClient
    .mutate<{ registerLocalAccountWithSocialIdentity?: { boolean?: boolean | null } }>({
      mutation: REGISTER_LOCAL_ACCOUNT_WITH_SOCIAL_IDENTITY_MUTATION,
      variables: {
        identifier: input.identifier,
        displayName: input.displayName,
        password: input.password,
        provider: input.provider,
        providerSubject: input.providerSubject,
        providerEmail: input.providerEmail,
        providerEmailVerified: input.providerEmailVerified ?? Boolean(input.providerEmail),
        verificationTtlMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000),
        preferredLanguage: input.preferredLanguage
      }
    })
    .then(() => ({
      message: "Account created successfully."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function requestEmailVerification(input: { identifier: string }) {
  return apolloClient
    .mutate<{ requestEmailVerification?: { boolean?: boolean | null } }>({
      mutation: REQUEST_EMAIL_VERIFICATION_MUTATION,
      variables: {
        identifier: input.identifier,
        verificationTtlMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000),
        throttleMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_RESEND_THROTTLE_MS ?? 60 * 1000)
      }
    })
    .then(() => ({
      message: "If an account exists for that email, verification instructions have been sent."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function confirmEmailVerification(input: { token: string }) {
  return apolloClient
    .mutate<{ confirmEmailVerification?: { boolean?: boolean | null } }>({
      mutation: CONFIRM_EMAIL_VERIFICATION_MUTATION,
      variables: {
        token: input.token
      }
    })
    .then(() => ({
      message: "Email verified."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function requestPasswordReset(input: { identifier: string }) {
  return apolloClient
    .mutate<{ requestPasswordReset?: { boolean?: boolean | null } }>({
      mutation: REQUEST_PASSWORD_RESET_MUTATION,
      variables: {
        identifier: input.identifier,
        resetTtlMs: Number(process.env.NEXT_PUBLIC_PASSWORD_RESET_TOKEN_TTL_MS ?? 60 * 60 * 1000),
        throttleMs: Number(process.env.NEXT_PUBLIC_PASSWORD_RESET_REQUEST_THROTTLE_MS ?? 60 * 1000)
      }
    })
    .then(() => ({
      message: i18n.t("restoreAccess.resetRequestedFallback", {
        ns: "auth",
        defaultValue: "If an account exists for that email, password reset instructions have been sent."
      })
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function confirmPasswordReset(input: { token: string; password: string }) {
  return apolloClient
    .mutate<{ confirmPasswordResetWithPassword?: { boolean?: boolean | null } }>({
      mutation: CONFIRM_PASSWORD_RESET_WITH_PASSWORD_MUTATION,
      variables: {
        token: input.token,
        nextPassword: input.password
      }
    })
    .then(() => ({
      message: "Password updated. You can now sign in."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return apolloClient
    .mutate<{ authChangePassword?: { authSession?: Partial<AuthSession> | null } }>({
      mutation: AUTH_CHANGE_PASSWORD_MUTATION,
      variables: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword
      }
    })
    .then(result => normalizeAuthSession(result.data?.authChangePassword?.authSession))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export async function confirmPendingLink(pendingLinkToken: string): Promise<void> {
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${backendBaseUrl}/auth/social/confirm-link`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pendingLinkToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to link social identity");
  }
}

export async function completeSocialRegistration(pendingRegistrationToken: string): Promise<{ next: string }> {
  const backendBaseUrl = (process.env.NEXT_PUBLIC_BACKEND_URL ?? "").replace(/\/$/, "");
  const response = await fetch(`${backendBaseUrl}/auth/social/complete-registration`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ pendingRegistrationToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to complete social registration");
  }

  const payload = (await response.json()) as { next?: string };
  return { next: typeof payload.next === "string" ? payload.next : "/" };
}