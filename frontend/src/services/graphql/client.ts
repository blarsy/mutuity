import { ApolloClient, ApolloLink, Observable, from, HttpLink, InMemoryCache, split } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { onError } from "@apollo/client/link/error";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";

import { notifyAuthRequired } from "../../features/auth/events";
import i18n from "../../i18n";
import { notifyRealtimeConnected, reportRealtimeError } from "./realtime";

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

const languageLink = setContext((_, { headers }) => ({
  headers: {
    ...headers,
    "x-selected-language": (i18n.language ?? "fr").slice(0, 2),
  },
}));

let accountGeneration = 0;
let wsClient: ReturnType<typeof createClient> | null = null;
const pendingOperations = new Set<() => void>();

function getWsClient() {
  if (!wsClient) {
    wsClient = createClient({
      url: graphqlWsUrl,
      retryAttempts: Infinity,
      retryWait: retries => new Promise(resolve => {
        setTimeout(resolve, Math.min(1000 * 2 ** Math.min(retries, 5), 30000) + Math.random() * 500);
      }),
      shouldRetry: () => true,
      on: { connected: notifyRealtimeConnected, error: reportRealtimeError }
    });
  }
  return wsClient;
}

// Resolve the client per operation: disposing an old authenticated socket must
// not leave the application's subscription link permanently disposed.
const wsLink = typeof window !== "undefined"
  ? new ApolloLink(operation => new GraphQLWsLink(getWsClient()).request(operation))
  : null;

// Cancel old-account operations before clearing the cache. Late HTTP responses
// must never repopulate account-specific root fields after an identity switch.
const accountBoundaryLink = new ApolloLink((operation, forward) => new Observable(observer => {
  const generation = accountGeneration;
  const subscription = forward(operation).subscribe({
    next: value => { if (generation === accountGeneration) observer.next(value); },
    error: error => { if (generation === accountGeneration) observer.error(error); },
    complete: () => observer.complete()
  });
  const cancel = () => { subscription.unsubscribe(); observer.complete(); };
  pendingOperations.add(cancel);
  return () => { pendingOperations.delete(cancel); subscription.unsubscribe(); };
}));

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
  link: from([accountBoundaryLink, errorLink, languageLink, transportLink])
});

export async function resetAccountGraphqlState() {
  accountGeneration += 1;
  for (const cancel of [...pendingOperations]) cancel();
  const previousClient = wsClient;
  wsClient = null;
  if (previousClient) void Promise.resolve(previousClient.dispose()).catch(reportRealtimeError);
  // Unlike resetStore, clearStore does not refetch mounted old-account queries.
  await apolloClient.clearStore();
}

