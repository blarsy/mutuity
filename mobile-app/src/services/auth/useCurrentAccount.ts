import { useMemo } from "react";

import { useAuth } from "./AuthProvider";

export interface CurrentAccountState {
  authenticated: boolean;
  loading: boolean;
  accountId: string | null;
  hasAccount: boolean;
  displayName: string | null;
  avatarUrl: string | null;
  preferredLanguage: string | null;
}

export function useCurrentAccount(): CurrentAccountState {
  const {
    session: { authenticated, loading, accountId, account }
  } = useAuth();

  return useMemo(
    () => ({
      authenticated,
      loading,
      accountId,
      hasAccount: Boolean(accountId),
      displayName: account?.displayName ?? null,
      avatarUrl: account?.avatarUrl ?? null,
      preferredLanguage: account?.preferredLanguage ?? null
    }),
    [authenticated, loading, accountId, account]
  );
}
