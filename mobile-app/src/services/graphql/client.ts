import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, Observable, split } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { print } from "graphql";
import { tap } from "rxjs";

import { appSettings } from "../../config/appSettings";
import { getPersistedAccountId, getPersistedToken } from "../auth/session";
import { getCurrentAppPlatform, getCurrentAppVersion } from "../app/versionGate";
import { logAppEvent } from "../monitoring/logger";
import { notifyRealtimeConnected } from "./connectionEvents";

export type TokenProvider = () => Promise<string | null>;

export interface ApolloClientOptions {
  getToken?: TokenProvider;
  graphqlUrl?: string;
  subscriptionsUrl?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let accountGeneration = 0;
const pendingOperations = new Set<() => void>();
const transports = new Set<{
  reset: () => void;
  reconnect: () => void;
  clearCache: () => Promise<void>;
}>();

function reportRealtimeError(error: unknown): void {
  logAppEvent({ level: "error", message: "graphql-realtime-error", details: error });
}

function closedWebSocket(code: number, reason: string): WebSocket {
  // graphql-ws does not catch rejected async url/constructor promises. Route
  // cancellation/credential failures through its normal close/retry machinery
  // without ever constructing a native socket with stale/anonymous headers.
  const socket = {
    readyState: WebSocket.CLOSED,
    close: () => undefined,
    send: () => undefined,
    onclose: null
  } as unknown as WebSocket;
  void Promise.resolve().then(() => {
    socket.onclose?.({ code, reason, wasClean: code === 1000 } as CloseEvent);
  });
  return socket;
}

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

async function resolveAuthHeaders(getToken: TokenProvider): Promise<Record<string, string>> {
  const token = await getToken();
  const tokenAccountId = resolveAccountIdFromToken(token);
  const accountId = tokenAccountId ?? (token ? await getPersistedAccountId() : null);
  const shouldSendDevAuthHeaders = appSettings.targetEnv === "local" && Boolean(accountId);

  return {
    authorization: token ? `Bearer ${token}` : "",
    "x-app-version": getCurrentAppVersion(),
    "x-app-platform": getCurrentAppPlatform(),
    ...(shouldSendDevAuthHeaders
      ? {
        "x-account-id": accountId as string,
        "x-role": "identified_account"
      }
      : {})
  };
}

function createAuthLink(getToken: TokenProvider): ApolloLink {
  return setContext(async (_, prevContext) => {
    const authHeaders = await resolveAuthHeaders(getToken);
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

function createSubscriptionTransport(subscriptionsUrl: string | undefined, getToken: TokenProvider) {
  let wsClient: ReturnType<typeof createClient> | null = null;
  const reset = () => {
    const previousClient = wsClient;
    wsClient = null;
    if (previousClient) {
      void Promise.resolve(previousClient.dispose()).catch(reportRealtimeError);
    }
  };
  const reconnect = () => {
    try {
      wsClient?.terminate();
    } catch (error) {
      reportRealtimeError(error);
    }
  };
  if (!subscriptionsUrl || typeof WebSocket === "undefined") {
    return { link: null, reset, reconnect };
  }

  // React Native's WebSocket accepts a third `options.headers` argument (unlike
  // browsers); resolve these before construction, independently of HTTP.
  type RNWebSocketConstructor = new (
    url: string,
    protocols?: string | string[],
    options?: { headers?: Record<string, string> }
  ) => WebSocket;
  const RNWebSocket = WebSocket as unknown as RNWebSocketConstructor & typeof WebSocket;
  const getWsClient = () => {
    if (!wsClient) {
      const generation = accountGeneration;
      // Private to this client/connection attempt, never populated by HTTP.
      let connectionHeaders: Record<string, string> = {};
      let credentialsFailed = false;
      const AuthenticatedWebSocket = function (url: string, protocols?: string | string[]): WebSocket {
        if (generation !== accountGeneration) return closedWebSocket(1000, "Account reset");
        if (credentialsFailed) return closedWebSocket(4498, "Credential resolution failed");
        try {
          return new RNWebSocket(url, protocols, { headers: connectionHeaders });
        } catch (error) {
          reportRealtimeError(error);
          return closedWebSocket(4498, "Socket construction failed");
        }
      } as unknown as typeof WebSocket;
      Object.assign(AuthenticatedWebSocket, {
        CONNECTING: RNWebSocket.CONNECTING,
        OPEN: RNWebSocket.OPEN,
        CLOSING: RNWebSocket.CLOSING,
        CLOSED: RNWebSocket.CLOSED
      });

      wsClient = createClient({
        // graphql-ws awaits url BEFORE constructing the native socket.
        url: async () => {
          try {
            connectionHeaders = await resolveAuthHeaders(getToken);
            credentialsFailed = false;
          } catch (error) {
            credentialsFailed = true;
            if (generation === accountGeneration) reportRealtimeError(error);
          }
          return subscriptionsUrl;
        },
        webSocketImpl: AuthenticatedWebSocket,
        connectionParams: () => connectionHeaders,
        connectionAckWaitTimeout: 10000,
        retryAttempts: Infinity,
        retryWait: retries => new Promise(resolve => {
          setTimeout(resolve, Math.min(1000 * 2 ** Math.min(retries, 5), 30000) + Math.random() * 500);
        }),
        shouldRetry: () => true,
        on: {
          connected: () => { if (generation === accountGeneration) notifyRealtimeConnected(); },
          error: reportRealtimeError,
          closed: event => {
            const close = event as { code?: number; reason?: string };
            if (generation === accountGeneration && close.code !== 1000) {
              logAppEvent({ level: "warn", message: "graphql-realtime-closed", details: event });
            }
          }
        }
      });
    }
    return wsClient;
  };

  // A disposed account socket must not permanently dispose the Apollo link.
  return {
    link: new ApolloLink(operation => new GraphQLWsLink(getWsClient()).request(operation)),
    reset,
    reconnect
  };
}

const accountBoundaryLink = new ApolloLink((operation, forward) => new Observable(observer => {
  const generation = accountGeneration;
  const controller = new AbortController();
  const context = operation.getContext();
  operation.setContext({ fetchOptions: { ...context.fetchOptions, signal: controller.signal } });
  let subscription: { unsubscribe: () => void } | undefined;
  const cancel = () => {
    controller.abort();
    subscription?.unsubscribe();
    observer.complete();
  };
  pendingOperations.add(cancel);
  subscription = forward(operation).subscribe({
    next: value => { if (generation === accountGeneration) observer.next(value); },
    error: error => { if (generation === accountGeneration) observer.error(error); },
    complete: () => observer.complete()
  });
  return () => {
    pendingOperations.delete(cancel);
    controller.abort();
    subscription?.unsubscribe();
  };
}));

export function createApolloClient(options: ApolloClientOptions = {}): ApolloClient {
  const httpLink = new HttpLink({
    uri: options.graphqlUrl ?? appSettings.graphQlApiUrl,
    credentials: "include"
  });

  const getToken = options.getToken ?? getPersistedToken;
  const linkChain: ApolloLink[] = [createAuthLink(getToken)];

  if (appSettings.targetEnv === "local") {
    linkChain.push(createDebugLink());
  }

  linkChain.push(httpLink);

  const httpLinkChain = ApolloLink.from(linkChain);
  const transport = createSubscriptionTransport(options.subscriptionsUrl ?? appSettings.subscriptionsUrl, getToken);
  const subscriptionLink = transport.link;

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

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([accountBoundaryLink, createErrorLink(), link])
  });
  transports.add({
    reset: transport.reset,
    reconnect: transport.reconnect,
    clearCache: async () => { await client.clearStore(); }
  });
  return client;
}

export const apolloClient = createApolloClient({ getToken: getPersistedToken });

export async function resetAccountGraphqlState(): Promise<void> {
  accountGeneration += 1;
  for (const cancel of [...pendingOperations]) cancel();
  for (const transport of transports) transport.reset();
  // Do not refetch still-mounted old-account queries, unlike resetStore.
  await Promise.all([...transports].map(transport => transport.clearCache()));
}

export function reconnectRealtime(): void {
  for (const transport of transports) transport.reconnect();
}
