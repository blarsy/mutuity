import { gql } from "@apollo/client";

import { apolloClient } from "./client";
import { type AuthLoginInput, type Mutation, type Query, type QueryAccountByIdArgs } from "./generated";
import { ACCOUNT_BY_ID_QUERY } from "./operations";

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
      authSession {
        account {
          id
        }
      }
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
  authLogin: Pick<Mutation, "authLogin">["authLogin"];
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

export async function authenticateWithPassword(input: { email: string; password: string }): Promise<{ accountId: string }> {
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

  if (!accountId) {
    throw new Error("Login succeeded without an authenticated account");
  }

  return { accountId };
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