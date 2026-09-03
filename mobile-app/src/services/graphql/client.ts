import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { print } from "graphql";
import { tap } from "rxjs";

import { appSettings } from "../../config/appSettings";
import { getPersistedAccountId, getPersistedToken } from "../auth/session";
import { logAppEvent } from "../monitoring/logger";

export type TokenProvider = () => Promise<string | null>;

export interface ApolloClientOptions {
  getToken?: TokenProvider;
  graphqlUrl?: string;
  subscriptionsUrl?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Populated whenever the HTTP auth link runs so the WebSocket link can reuse the same headers.
let cachedAuthHeaders: Record<string, string> = {};

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  const payloadSegment = parts[1];

  if (!payloadSegment || typeof globalThis.atob !== "function") {
    return null;
  }

  try {
    const payloadBase64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, "=");
    const payloadJson = globalThis.atob(normalized);
    const parsed = JSON.parse(payloadJson) as unknown;

    return typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function resolveAccountIdFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  if (UUID_PATTERN.test(token)) {
    return token;
  }

  if (token.startsWith("mock:")) {
    const accountId = token.slice("mock:".length);
    return UUID_PATTERN.test(accountId) ? accountId : null;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const candidates = [payload.accountId, payload.account_id, payload.sub];
  const accountId = candidates.find((value) => typeof value === "string" && UUID_PATTERN.test(value));

  return typeof accountId === "string" ? accountId : null;
}

function createErrorLink(): ApolloLink {
  return onError(({ error }) => {
    if (error) {
      logAppEvent({
        level: "error",
        message: "graphql-error",
        details: error
      });
    }
  });
}

function createAuthLink(getToken?: TokenProvider): ApolloLink {
  return setContext(async (_, prevContext) => {
    const token = getToken ? await getToken() : null;
    const tokenAccountId = resolveAccountIdFromToken(token);
    const accountId = tokenAccountId ?? await getPersistedAccountId();
    const shouldSendDevAuthHeaders = appSettings.targetEnv === "local" && Boolean(accountId);

    const authHeaders: Record<string, string> = {
      authorization: token ? `Bearer ${token}` : "",
      ...(shouldSendDevAuthHeaders
        ? {
          "x-account-id": accountId as string,
          "x-role": "identified_account"
        }
        : {})
    };
    cachedAuthHeaders = authHeaders;

    return {
      headers: {
        ...prevContext.headers,
        ...authHeaders
      }
    };
  });
}

function createDebugLink(): ApolloLink {
  return new ApolloLink((operation, forward) => {
    logAppEvent({
      level: "debug",
      message: "graphql-request",
      details: {
        operationName: operation.operationName,
        query: print(operation.query),
        variables: operation.variables
      }
    });

    return forward(operation).pipe(
      tap((result) => {
        logAppEvent({
          level: "debug",
          message: "graphql-response",
          details: {
            operationName: operation.operationName,
            result
          }
        });
      })
    );
  });
}

function createSubscriptionLink(subscriptionsUrl: string | undefined): ApolloLink | null {
  if (!subscriptionsUrl) {
    return null;
  }

  // React Native's WebSocket accepts a third `options.headers` argument (unlike browsers),
  // so the WS upgrade request can reuse the same auth headers as HTTP requests.
  type RNWebSocketConstructor = new (
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> }
  ) => WebSocket;
  const RNWebSocket = WebSocket as unknown as RNWebSocketConstructor;
  const AuthenticatedWebSocket = function (url: string, protocols?: string | string[]): WebSocket {
    return new RNWebSocket(url, protocols, { headers: cachedAuthHeaders });
  } as unknown as typeof WebSocket;
  // graphql-ws validates the implementation by checking these static readyState constants exist.
  Object.assign(AuthenticatedWebSocket, {
    CONNECTING: WebSocket.CONNECTING,
    OPEN: WebSocket.OPEN,
    CLOSING: WebSocket.CLOSING,
    CLOSED: WebSocket.CLOSED
  });

  const wsClient = createClient({
    url: subscriptionsUrl,
    webSocketImpl: AuthenticatedWebSocket,
    connectionParams: () => cachedAuthHeaders,
    retryAttempts: 5,
    shouldRetry: () => true
  });

  return new GraphQLWsLink(wsClient);
}

export function createApolloClient(options: ApolloClientOptions = {}): ApolloClient {
  const httpLink = new HttpLink({
    uri: options.graphqlUrl ?? appSettings.graphQlApiUrl,
    credentials: "include"
  });

  const linkChain: ApolloLink[] = [createErrorLink(), createAuthLink(options.getToken)];

  if (appSettings.targetEnv === "local") {
    linkChain.push(createDebugLink());
  }

  linkChain.push(httpLink);

  const httpLinkChain = ApolloLink.from(linkChain);
  const subscriptionLink = createSubscriptionLink(options.subscriptionsUrl ?? appSettings.subscriptionsUrl);

  const link = subscriptionLink
    ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return definition.kind === "OperationDefinition" && definition.operation === "subscription";
      },
      subscriptionLink,
      httpLinkChain
    )
    : httpLinkChain;

  return new ApolloClient({
    cache: new InMemoryCache(),
    link
  });
}

export const apolloClient = createApolloClient({ getToken: getPersistedToken });
