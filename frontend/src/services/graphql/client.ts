import { ApolloClient, from, HttpLink, InMemoryCache, split } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

import { notifyAuthRequired } from "../../features/auth/events";

const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "http://localhost:5050/graphql";
const graphqlWsUrl = process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ?? graphqlUrl.replace(/^http/i, "ws");

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

const httpLink = new HttpLink({
  uri: graphqlUrl,
  credentials: "include"
});

const wsLink =
  typeof window !== "undefined"
    ? new GraphQLWsLink(
        createClient({
          url: graphqlWsUrl,
          retryAttempts: 5,
          shouldRetry: () => true
        })
      )
    : null;

const transportLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
      },
      wsLink,
      httpLink
    )
  : httpLink;

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: from([errorLink, transportLink])
});
