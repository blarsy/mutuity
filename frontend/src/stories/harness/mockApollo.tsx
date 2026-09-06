import { ApolloClient, ApolloLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";
import { Observable } from "rxjs";
import { useMemo, type ReactNode } from "react";

export type MockOperationResolver =
  | Record<string, unknown>
  | ((variables: Record<string, unknown>) => Record<string, unknown>);

export type MockApolloParameters = {
  /** Keyed by GraphQL operation name, e.g. `NotificationsOverview`. */
  operations?: Record<string, MockOperationResolver>;
  /** Operation names that should stay pending, to showcase loading states. */
  loadingOperations?: string[];
  /** Operation names that should fail, to showcase error states. */
  errorOperations?: Record<string, string>;
};

function resolveData(resolver: MockOperationResolver, variables: Record<string, unknown>) {
  return typeof resolver === "function" ? resolver(variables) : resolver;
}

function createMockLink(parameters: MockApolloParameters) {
  return new ApolloLink(operation => {
    const operationName = operation.operationName ?? "";
    const variables = (operation.variables ?? {}) as Record<string, unknown>;

    return new Observable<{ data: Record<string, unknown> }>(subscriber => {
      if (parameters.loadingOperations?.includes(operationName)) {
        return undefined;
      }

      const errorMessage = parameters.errorOperations?.[operationName];

      if (errorMessage) {
        subscriber.error(new Error(errorMessage));
        return undefined;
      }

      const resolver = parameters.operations?.[operationName];
      subscriber.next({ data: resolver ? resolveData(resolver, variables) : {} });
      subscriber.complete();
      return undefined;
    });
  });
}

export function createMockApolloClient(parameters: MockApolloParameters = {}) {
  return new ApolloClient({
    cache: new InMemoryCache(),
    link: createMockLink(parameters)
  });
}

export function MockApolloProvider({
  children,
  parameters
}: {
  children: ReactNode;
  parameters?: MockApolloParameters;
}) {
  const client = useMemo(() => createMockApolloClient(parameters), [parameters]);

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
