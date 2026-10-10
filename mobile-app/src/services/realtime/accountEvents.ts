import React, { createContext, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { apolloClient, reconnectRealtime } from "../graphql/client";
import { onRealtimeConnected } from "../graphql/connectionEvents";
import { ACCOUNT_EVENTS_SUBSCRIPTION } from "../graphql/operations";
import { useAuth } from "../auth/AuthProvider";
import { logAppEvent } from "../monitoring/logger";

type Listener = () => void | Promise<unknown>;
const listeners = new Set<Listener>();
let activeAccount: string | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let generation = 0;

function reportError(error: unknown): void {
  logAppEvent({ level: "error", message: "account-realtime-refresh-failed", details: error });
}

/** Local mutations and server events share the same coalesced invalidation path. */
export function signalAccountRefresh(): void {
  if (!activeAccount || refreshTimer) return;
  const expected = generation;
  refreshTimer = setTimeout(() => {
    refreshTimer = null;
    if (expected !== generation) return;
    for (const listener of listeners) {
      try { void Promise.resolve(listener()).catch(reportError); } catch (error) { reportError(error); }
    }
  }, 100);
}

export interface AccountEventSubscriptionHandle { unsubscribe: () => void }
export function accountEventsTopic(accountId: string): string { return `account_events_${accountId}`; }

/** Subscribers in the app share the provider's single authenticated subscription. */
export function subscribeToAccountEvents(accountId: string, onEvent: Listener): AccountEventSubscriptionHandle {
  const listener = () => { if (activeAccount === accountId) return onEvent(); };
  listeners.add(listener);
  return { unsubscribe: () => { listeners.delete(listener); } };
}

const AccountEventsContext = createContext<string | null>(null);

export function AccountEventSubscriptionProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const { session } = useAuth();
  const accountId = session.authenticated ? session.accountId : null;
  useEffect(() => {
    activeAccount = accountId;
    generation += 1;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = null;
    if (!accountId) return;
    let alive = true;
    const expected = generation;
    const notify = () => { if (alive && expected === generation) signalAccountRefresh(); };
    let ended = false;
    let subscription: { unsubscribe: () => void } | undefined;
    const connect = () => {
      ended = false;
      subscription = apolloClient.subscribe({
        query: ACCOUNT_EVENTS_SUBSCRIPTION,
        variables: { topic: accountEventsTopic(accountId) }
      }).subscribe({
        next: notify,
        error: error => { ended = true; if (alive) reportError(error); },
        complete: () => { ended = true; }
      });
    };
    const recover = () => {
      if (!alive || expected !== generation) return;
      if (ended) connect();
      else reconnectRealtime();
      notify();
    };
    connect();
    const removeConnected = onRealtimeConnected(notify);
    let previousState = AppState.currentState;
    const appState = AppState.addEventListener("change", state => {
      if (state === "active" && previousState !== "active") {
        recover();
      }
      previousState = state;
    });
    let previouslyConnected: boolean | null = null;
    const removeNetwork = NetInfo.addEventListener(state => {
      const connected = state.isConnected === true && state.isInternetReachable !== false;
      if (alive && connected && previouslyConnected === false) {
        recover();
      }
      previouslyConnected = connected;
    });
    signalAccountRefresh();
    return () => {
      alive = false;
      generation += 1;
      activeAccount = null;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = null;
      subscription?.unsubscribe();
      removeConnected();
      appState.remove();
      removeNetwork();
    };
  }, [accountId]);
  return React.createElement(AccountEventsContext.Provider, { value: accountId }, children);
}

export function useAccountEventSignal(callback: Listener, enabled = true): void {
  const accountId = useContext(AccountEventsContext);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  useEffect(() => {
    if (!enabled || !accountId) return;
    const subscription = subscribeToAccountEvents(accountId, () => callbackRef.current());
    return subscription.unsubscribe;
  }, [accountId, enabled]);
}
