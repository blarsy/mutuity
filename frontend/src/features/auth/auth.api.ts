import { CombinedGraphQLErrors } from "@apollo/client/errors";

import {
  AUTH_CHANGE_PASSWORD_MUTATION,
  AUTH_LOGIN_MUTATION,
  AUTH_LOGOUT_MUTATION,
  AUTH_SESSION_QUERY,
  CONFIRM_EMAIL_VERIFICATION_MUTATION,
  CONFIRM_PASSWORD_RESET_WITH_PASSWORD_MUTATION,
  REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION,
  REQUEST_EMAIL_VERIFICATION_MUTATION,
  REQUEST_PASSWORD_RESET_MUTATION
} from "./auth.queries";
import { apolloClient } from "../../services/graphql/client";
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
}) {
  return apolloClient
    .mutate<{ registerLocalAccountWithPassword?: { string?: string | null } }>({
      mutation: REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION,
      variables: {
        identifier: input.identifier,
        displayName: input.displayName,
        password: input.password,
        verificationTtlMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000)
      }
    })
    .then(result => ({
      message: "Account created. Please verify your email before signing in.",
      verificationToken: result.data?.registerLocalAccountWithPassword?.string ?? undefined
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function requestEmailVerification(input: { identifier: string }) {
  return apolloClient
    .mutate<{ requestEmailVerification?: { string?: string | null } }>({
      mutation: REQUEST_EMAIL_VERIFICATION_MUTATION,
      variables: {
        identifier: input.identifier,
        verificationTtlMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_TOKEN_TTL_MS ?? 24 * 60 * 60 * 1000),
        throttleMs: Number(process.env.NEXT_PUBLIC_EMAIL_VERIFICATION_RESEND_THROTTLE_MS ?? 60 * 1000)
      }
    })
    .then(result => ({
      message: "If an account exists for that email, verification instructions have been sent.",
      verificationToken: result.data?.requestEmailVerification?.string ?? undefined
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
      message: "Email verified. You can now sign in."
    }))
    .catch(error => {
      throw new Error(toGraphQLErrorMessage(error, "Something went wrong. Please try again."));
    });
}

export function requestPasswordReset(input: { identifier: string }) {
  return apolloClient
    .mutate<{ requestPasswordReset?: { string?: string | null } }>({
      mutation: REQUEST_PASSWORD_RESET_MUTATION,
      variables: {
        identifier: input.identifier,
        resetTtlMs: Number(process.env.NEXT_PUBLIC_PASSWORD_RESET_TOKEN_TTL_MS ?? 60 * 60 * 1000),
        throttleMs: Number(process.env.NEXT_PUBLIC_PASSWORD_RESET_REQUEST_THROTTLE_MS ?? 60 * 1000)
      }
    })
    .then(result => ({
      message: "If an account exists for that email, password reset instructions have been sent.",
      passwordResetToken: result.data?.requestPasswordReset?.string ?? undefined
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
