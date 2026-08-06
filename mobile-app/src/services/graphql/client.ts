import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { print } from "graphql";
import { tap } from "rxjs";

import { appSettings } from "../../config/appSettings";
import { getPersistedAccountId, getPersistedToken } from "../auth/session";
import { logAppEvent } from "../monitoring/logger";

export type TokenProvider = () => Promise<string | null>;

export interface ApolloClientOptions {
  getToken?: TokenProvider;
  graphqlUrl?: string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    return {
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : "",
        ...(shouldSendDevAuthHeaders
          ? {
            "x-account-id": accountId,
            "x-role": "identified_account"
          }
          : {})
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

  const link = ApolloLink.from(linkChain);

  return new ApolloClient({
    cache: new InMemoryCache(),
    link
  });
}

export const apolloClient = createApolloClient({ getToken: getPersistedToken });
