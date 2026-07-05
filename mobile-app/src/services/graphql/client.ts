import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";

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

export function createApolloClient(options: ApolloClientOptions = {}): ApolloClient {
  const httpLink = new HttpLink({
    uri: options.graphqlUrl ?? appSettings.graphQlApiUrl,
    credentials: "include"
  });

  const link = ApolloLink.from([createErrorLink(), createAuthLink(options.getToken), httpLink]);

  return new ApolloClient({
    cache: new InMemoryCache(),
    link
  });
}

export const apolloClient = createApolloClient();
