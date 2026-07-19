import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { print } from "graphql";
import { tap } from "rxjs";

import { appSettings } from "../../config/appSettings";
import { logAppEvent } from "../monitoring/logger";

export type TokenProvider = () => Promise<string | null>;

export interface ApolloClientOptions {
  getToken?: TokenProvider;
  graphqlUrl?: string;
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

    return {
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : ""
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

export const apolloClient = createApolloClient();
