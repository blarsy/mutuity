import { ApolloClient, from, HttpLink, InMemoryCache } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { onError } from "@apollo/client/link/error";

import { notifyAuthRequired } from "../../features/auth/events";

const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";

const errorLink = onError(({ error }) => {
  if (!CombinedGraphQLErrors.is(error)) {
    return;
  }

  const hasAuthenticationError = error.errors.some(
    graphQLError => graphQLError.extensions?.code === "UNAUTHENTICATED"
  );

  if (hasAuthenticationError) {
    notifyAuthRequired();
  }
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([
    errorLink,
    new HttpLink({
      uri: graphqlUrl,
      credentials: "include"
    })
  ])
});
