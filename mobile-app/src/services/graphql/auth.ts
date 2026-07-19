import { gql } from "@apollo/client";

import { apolloClient } from "./client";
import { type AuthLoginInput, type Mutation } from "./generated";

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