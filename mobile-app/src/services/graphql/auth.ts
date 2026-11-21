import { gql } from "@apollo/client";

import { apolloClient } from "./client";
import { type AuthChangePasswordInput, type AuthLoginInput, type Mutation, type Query, type QueryAccountByIdArgs, type RegisterLocalAccountWithPasswordInput, type RequestPasswordResetInput } from "./generated";
import { ACCOUNT_BY_ID_QUERY, AUTH_CHANGE_PASSWORD_MUTATION, REQUEST_PASSWORD_RESET_MUTATION } from "./operations";

export type RegisterSocialIdentityInput = {
  identifier: string;
  displayName: string;
  password?: string;
  provider: "google" | "apple";
  providerSubject: string;
  providerEmail?: string;
  providerEmailVerified?: boolean;
  preferredLanguage?: "en" | "fr";
};

const AUTH_LOGIN_MUTATION = gql`
  mutation AuthLogin($input: AuthLoginInput!) {
    authLogin(input: $input) {
      mobileSessionToken
      authSession {
        account {
          id
        }
      }
    }
  }
`;

const REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION = gql`
  mutation RegisterLocalAccountWithPassword($input: RegisterLocalAccountWithPasswordInput!) {
    registerLocalAccountWithPassword(input: $input) {
      boolean
    }
  }
`;

const REGISTER_SOCIAL_IDENTITY_MUTATION = gql`
  mutation RegisterLocalAccountWithSocialIdentity($input: RegisterLocalAccountWithSocialIdentityInput!) {
    registerLocalAccountWithSocialIdentity(input: $input) {
      boolean
    }
  }
`;

interface AuthLoginMutationResult {
  authLogin: {
    authSession: {
      account: { id: string | null } | null;
    };
    mobileSessionToken: string | null;
  } | null;
}

interface AccountByIdQueryResult {
  accountById: Pick<Query, "accountById">["accountById"];
}

export interface AuthAccountSnapshot {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
}

export async function authenticateWithPassword(input: { email: string; password: string }): Promise<{ accountId: string; sessionToken: string }> {
  const variables: { input: AuthLoginInput } = {
    input: {
      identifier: input.email.trim(),
      password: input.password
    }
  };

  const { data } = await apolloClient.mutate<AuthLoginMutationResult, { input: AuthLoginInput }>({
    mutation: AUTH_LOGIN_MUTATION,
    variables
  });

  const accountId = data?.authLogin?.authSession?.account?.id;
  const sessionToken = data?.authLogin?.mobileSessionToken;

  if (!accountId || !sessionToken) {
    throw new Error("Login succeeded without a mobile session");
  }

  return { accountId, sessionToken };
}

export async function registerWithPassword(input: {
  email: string;
  fullName: string;
  password: string;
  preferredLanguage?: "en" | "fr";
}): Promise<void> {
  const variables: { input: RegisterLocalAccountWithPasswordInput } = {
    input: {
      identifier: input.email.trim().toLowerCase(),
      displayName: input.fullName.trim(),
      password: input.password,
      verificationTtlMs: 24 * 60 * 60 * 1000,
      preferredLanguage: input.preferredLanguage ?? "en"
    }
  };

  const { data } = await apolloClient.mutate<
    { registerLocalAccountWithPassword?: { boolean?: boolean | null } | null },
    { input: RegisterLocalAccountWithPasswordInput }
  >({
    mutation: REGISTER_LOCAL_ACCOUNT_WITH_PASSWORD_MUTATION,
    variables
  });

  if (data?.registerLocalAccountWithPassword?.boolean !== true) {
    throw new Error("Account registration did not complete");
  }
}

export async function fetchAccountSnapshotById(accountId: string): Promise<AuthAccountSnapshot | null> {
  const variables: QueryAccountByIdArgs = { id: accountId };
  const { data } = await apolloClient.query<AccountByIdQueryResult, QueryAccountByIdArgs>({
    query: ACCOUNT_BY_ID_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const account = data?.accountById;
  if (!account) {
    return null;
  }

  return {
    id: String(account.id),
    displayName: account.displayName ?? null,
    avatarUrl: account.avatarUrl ?? null,
    preferredLanguage: account.preferredLanguage ?? null
  };
}

export async function registerWithSocialIdentity(input: RegisterSocialIdentityInput): Promise<void> {
  await apolloClient.mutate({
    mutation: REGISTER_SOCIAL_IDENTITY_MUTATION,
    variables: {
      input: {
        identifier: input.identifier.trim(),
        displayName: input.displayName.trim(),
        password: input.password,
        provider: input.provider,
        providerSubject: input.providerSubject,
        providerEmail: input.providerEmail,
        providerEmailVerified: input.providerEmailVerified ?? Boolean(input.providerEmail),
        preferredLanguage: input.preferredLanguage ?? "en"
      }
    }
  });
}

export async function changeAccountPassword(input: { currentPassword: string; newPassword: string }): Promise<void> {
  const variables: { input: AuthChangePasswordInput } = {
    input: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword
    }
  };

  await apolloClient.mutate({
    mutation: AUTH_CHANGE_PASSWORD_MUTATION,
    variables
  });
}

export async function requestPasswordReset(identifier: string): Promise<void> {
  const variables: { input: RequestPasswordResetInput } = {
    input: {
      identifier: identifier.trim().toLowerCase(),
      resetTtlMs: 60 * 60 * 1000,
      throttleMs: 60 * 1000
    }
  };

  // The backend intentionally returns the same successful response whether or
  // not an eligible account exists, to avoid exposing account membership.
  await apolloClient.mutate<
    { requestPasswordReset?: Pick<Mutation, "requestPasswordReset">["requestPasswordReset"] },
    { input: RequestPasswordResetInput }
  >({
    mutation: REQUEST_PASSWORD_RESET_MUTATION,
    variables
  });
}