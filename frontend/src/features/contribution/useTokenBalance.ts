import { useQuery } from "@apollo/client/react";
import { useRef } from "react";
import { useAuth } from "../auth/AuthProvider";
import { useAccountEventSignal } from "../../services/graphql/accountEvents";
import { TOKEN_BALANCE_QUERY } from "./contribution.queries";

/** The root scalar is shared with contribution history and claims queries. */
export function useTokenBalance({ cacheOnly = false }: { cacheOnly?: boolean } = {}) {
  const { session } = useAuth();
  const enabled = session.authenticated && Boolean(session.account?.id);
  const lastKnown = useRef<{ accountId: string | undefined; value: number | null }>({ accountId: undefined, value: null });
  const query = useQuery<{ currentTokenBalance: number | null }>(TOKEN_BALANCE_QUERY, {
    skip: !enabled,
    fetchPolicy: cacheOnly ? "cache-only" : "cache-and-network",
    nextFetchPolicy: cacheOnly ? "cache-only" : "cache-first"
  });
  useAccountEventSignal(() => query.refetch(), enabled && !cacheOnly);
  const accountId = enabled ? session.account?.id : undefined;
  if (lastKnown.current.accountId !== accountId) lastKnown.current = { accountId, value: null };
  if (enabled && typeof query.data?.currentTokenBalance === "number") lastKnown.current.value = query.data.currentTokenBalance;
  return { ...query, balance: enabled ? lastKnown.current.value : null };
}