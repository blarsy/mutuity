import type { AuthSession } from "../../features/auth/types";
import { withAppShellOperations } from "./appShellOperations";
import type { MockApolloParameters } from "./mockApollo";
import { AUTHENTICATED_SESSION } from "./mockAuth";

type PageParametersConfig = {
  pathname: string;
  asPath?: string;
  query?: Record<string, string>;
  session?: AuthSession;
  operations?: MockApolloParameters["operations"];
};

/**
 * Shared story parameters for page-level stories: mocks the Next router, the
 * auth session and the GraphQL transport used by the `_app.tsx` provider stack.
 */
export function pageParameters({
  pathname,
  asPath,
  query,
  session = AUTHENTICATED_SESSION,
  operations
}: PageParametersConfig) {
  return {
    nextjs: {
      router: {
        pathname,
        asPath: asPath ?? pathname,
        query: query ?? {}
      }
    },
    auth: { session },
    apollo: { operations: withAppShellOperations(operations) }
  };
}
