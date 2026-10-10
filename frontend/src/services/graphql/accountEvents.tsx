import { gql } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode
} from "react";

import { useAuth } from "../../features/auth/AuthProvider";
import { handleRealtimeRefresh, onRealtimeConnected, reportRealtimeError } from "./realtime";

const ACCOUNT_EVENTS_SUBSCRIPTION = gql`
  subscription AccountEvents($topic: String!) {
    listen(topic: $topic) {
      relatedNodeId
    }
  }
`;

type AccountEventListener = () => unknown;

type AccountEventContextValue = {
  subscribe: (listener: AccountEventListener) => () => void;
};

const AccountEventContext = createContext<AccountEventContextValue>({
  subscribe: () => () => undefined
});

export function accountEventsTopic(accountId: string) {
  return `account_events_${accountId}`;
}

export function AccountEventSubscriptionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const client = useApolloClient();
  const accountId = session.authenticated ? session.account?.id : null;
  const accountIdRef = useRef(accountId);
  accountIdRef.current = accountId;
  const listenersRef = useRef(new Set<AccountEventListener>());

  const subscribe = useCallback((listener: AccountEventListener) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!accountId) return;
    let active = true;
    let ended = false;
    let subscription: { unsubscribe: () => void } | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const emit = () => {
      if (!active || accountIdRef.current !== accountId || timer !== undefined) return;
      timer = setTimeout(() => {
        timer = undefined;
        if (!active || accountIdRef.current !== accountId) return;
        for (const listener of listenersRef.current) handleRealtimeRefresh(listener);
      }, 100);
    };
    const connect = () => {
      ended = false;
      subscription = client.subscribe({
        query: ACCOUNT_EVENTS_SUBSCRIPTION,
        variables: { topic: accountEventsTopic(accountId) },
        fetchPolicy: "no-cache"
      }).subscribe({
        next: emit,
        error: error => { ended = true; reportRealtimeError(error); },
        complete: () => { ended = true; }
      });
    };
    const recover = () => {
      if (!active || accountIdRef.current !== accountId) return;
      if (ended) connect();
      emit();
    };
    connect();
    const unsubscribeConnected = onRealtimeConnected(emit);
    const onVisible = () => { if (document.visibilityState === "visible") recover(); };
    window.addEventListener("online", recover);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      active = false;
      if (timer !== undefined) clearTimeout(timer);
      subscription?.unsubscribe();
      unsubscribeConnected();
      window.removeEventListener("online", recover);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [accountId, client]);

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return <AccountEventContext.Provider value={value}>{children}</AccountEventContext.Provider>;
}

export function useAccountEventSignal(onSignal: () => unknown, enabled = true) {
  const { subscribe } = useContext(AccountEventContext);
  const onSignalRef = useRef(onSignal);

  useEffect(() => {
    onSignalRef.current = onSignal;
  }, [onSignal]);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    return subscribe(() => {
      return onSignalRef.current();
    });
  }, [enabled, subscribe]);
}