import { gql } from "@apollo/client";
import { useSubscription } from "@apollo/client/react";
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

const ACCOUNT_EVENTS_SUBSCRIPTION = gql`
  subscription AccountEvents($topic: String!) {
    listen(topic: $topic) {
      relatedNodeId
    }
  }
`;

type AccountEventListener = () => void;

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
  const listenersRef = useRef(new Set<AccountEventListener>());

  const subscribe = useCallback((listener: AccountEventListener) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const emit = useCallback(() => {
    for (const listener of listenersRef.current) {
      listener();
    }
  }, []);

  useSubscription<{ listen: { relatedNodeId: string } }>(
    ACCOUNT_EVENTS_SUBSCRIPTION,
    {
      variables: {
        topic: session.account?.id ? accountEventsTopic(session.account.id) : ""
      },
      skip: !session.authenticated || !session.account?.id,
      onData: () => {
        emit();
      }
    }
  );

  const value = useMemo(() => ({ subscribe }), [subscribe]);

  return <AccountEventContext.Provider value={value}>{children}</AccountEventContext.Provider>;
}

export function useAccountEventSignal(onSignal: () => void, enabled = true) {
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
      onSignalRef.current();
    });
  }, [enabled, subscribe]);
}