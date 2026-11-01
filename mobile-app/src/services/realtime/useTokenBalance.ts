import React, { createContext, useContext } from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchCurrentTokenBalance } from "../graphql/economics";
import { useAccountQuery } from "./useAccountQuery";

type BalanceState = ReturnType<typeof useAccountQuery>;
const TokenBalanceContext = createContext<(BalanceState & { accountId: string | null }) | null>(null);
const unavailable: BalanceState = {
  value: null, loading: false, error: null, refresh: async () => undefined
};

/** One balance owner per app session; account events refresh it even when no menu is open. */
export function TokenBalanceProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { session } = useAuth();
  const accountId = session.authenticated ? session.accountId : null;
  const state = useAccountQuery(accountId, Boolean(accountId), fetchCurrentTokenBalance);
  return React.createElement(TokenBalanceContext.Provider, { value: { accountId, ...state } }, children);
}

export function useTokenBalance(accountId: string | null, enabled = true) {
  const shared = useContext(TokenBalanceContext);
  // Standalone screens/stories retain their existing on-demand behavior. App
  // consumers never create another fetch or realtime listener of their own.
  const local = useAccountQuery(shared ? null : accountId, !shared && enabled, fetchCurrentTokenBalance);
  const selected = shared
    ? enabled && accountId !== null && accountId === shared.accountId ? shared : unavailable
    : local;
  const { value, loading, error, refresh } = selected;
  const state = { loading, error, refresh };
  return { balance: value, ...state };
}