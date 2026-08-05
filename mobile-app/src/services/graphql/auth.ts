import { gql } from "@apollo/client";

import { apolloClient } from "./client";
import { type AuthLoginInput, type Mutation } from "./generated";

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