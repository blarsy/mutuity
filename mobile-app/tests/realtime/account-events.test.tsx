import React from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { act, cleanup, render } from "@testing-library/react-native";
import { AuthContext, type AuthContextValue } from "../../src/services/auth/AuthProvider";
import { apolloClient, reconnectRealtime } from "../../src/services/graphql/client";
import { notifyRealtimeConnected } from "../../src/services/graphql/connectionEvents";
import { ACCOUNT_EVENTS_SUBSCRIPTION } from "../../src/services/graphql/operations";
import { logAppEvent } from "../../src/services/monitoring/logger";
import { ChatDetailScreen } from "../../src/screens/chat/ChatDetailScreen";
import { fetchChatConversationDetail, markConversationMessagesRead } from "../../src/services/graphql/chat";
import {
  AccountEventSubscriptionProvider, accountEventsTopic, signalAccountRefresh,
  subscribeToAccountEvents, useAccountEventSignal
} from "../../src/services/realtime/accountEvents";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true, default: { addEventListener: jest.fn() }
}));
jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: { subscribe: jest.fn() }, reconnectRealtime: jest.fn()
}));
jest.mock("../../src/services/auth/session", () => ({}));
jest.mock("../../src/services/graphql/auth", () => ({}));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: {} }));
jest.mock("../../src/services/monitoring/logger", () => ({ logAppEvent: jest.fn() }));
const mockTranslate = (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key;
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock("../../src/services/graphql/chat", () => ({ fetchChatConversationDetail: jest.fn(), markConversationMessagesRead: jest.fn() }));
jest.mock("../../src/components/chat/MessageComposer", () => ({ MessageComposer: () => null }));
jest.mock("../../src/components/listings/ListingContextHeader", () => ({ ListingContextHeader: () => null }));

type Observer = { next: (value: unknown) => void; error: (error: unknown) => void };
const originalCurrentState = Object.getOwnPropertyDescriptor(AppState, "currentState")!;
let observers: Observer[];
let unsubscribes: jest.Mock[];
let network: (state: { isConnected: boolean | null; isInternetReachable: boolean | null }) => void;
let appState: (state: "active" | "background" | "inactive") => void;
let removeNetwork: jest.Mock;
let removeAppState: jest.Mock;

function auth(accountId: string | null): AuthContextValue {
  return {
    session: { accountId, authenticated: Boolean(accountId), token: accountId, account: null, loading: false },
    signIn: jest.fn(), signOut: jest.fn(), invalidateSession: jest.fn(),
    changeLanguage: jest.fn(), refreshSession: jest.fn()
  };
}

function Listener({ callback, enabled = true }: { callback: () => void | Promise<unknown>; enabled?: boolean }) {
  useAccountEventSignal(callback, enabled);
  return null;
}

function tree(accountId: string | null, children?: React.ReactNode) {
  return <AuthContext.Provider value={auth(accountId)}>
    <AccountEventSubscriptionProvider>{children}</AccountEventSubscriptionProvider>
  </AuthContext.Provider>;
}

async function flushSignals() {
  await act(async () => { jest.advanceTimersByTime(100); await Promise.resolve(); });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  (fetchChatConversationDetail as jest.Mock).mockReset();
  (markConversationMessagesRead as jest.Mock).mockReset().mockResolvedValue(0);
  observers = [];
  unsubscribes = [];
  removeNetwork = jest.fn();
  removeAppState = jest.fn();
  // jest-expo stubs currentState as a function, although RN exposes a string.
  Object.defineProperty(AppState, "currentState", { configurable: true, writable: true, value: "active" });
  jest.spyOn(AppState, "addEventListener").mockImplementation((_event, listener) => {
    appState = listener;
    return { remove: removeAppState };
  });
  (NetInfo.addEventListener as jest.Mock).mockImplementation(listener => {
    network = listener;
    return removeNetwork;
  });
  (apolloClient.subscribe as jest.Mock).mockImplementation(() => ({ subscribe: (observer: Observer) => {
    observers.push(observer);
    const unsubscribe = jest.fn();
    unsubscribes.push(unsubscribe);
    return { unsubscribe };
  } }));
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.restoreAllMocks();
  Object.defineProperty(AppState, "currentState", originalCurrentState);
  jest.useRealTimers();
});

describe("actual account event provider", () => {
  it("refreshes ChatDetailScreen through the shared subscription and catches up silently after offline recovery", async () => {
    const conversation = { id: "thread", otherAccountId: "bob", otherAccountDisplayName: "Bob", linkedResourceId: null, linkedResourceTitle: null };
    const message = (id: string) => ({ id, direction: "incoming", body: id, createdAt: "2026-10-10T12:00:00Z" });
    const fetch = fetchChatConversationDetail as jest.Mock;
    fetch.mockResolvedValue({ conversation, messages: [message("first")] });
    const otherConsumer = jest.fn();
    const view = render(tree("alice", <><Listener callback={otherConsumer} /><ChatDetailScreen
      conversationId="thread" currentAccountId="alice" conversation={null} onBackToList={jest.fn()} /></>));
    await act(async () => { await Promise.resolve(); });
    await flushSignals();
    expect(view.getByTestId("chat-message-first")).toBeTruthy();
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
    fetch.mockRejectedValue(new Error("offline"));
    act(() => observers[0]!.next({})); await flushSignals();
    expect(view.getByTestId("chat-detail-screen")).toBeTruthy();
    expect(view.getByTestId("chat-message-first")).toBeTruthy();
    fetch.mockResolvedValue({ conversation, messages: [message("first"), message("catchup")] });
    act(() => { network({ isConnected: false, isInternetReachable: false }); network({ isConnected: true, isInternetReachable: true }); });
    await flushSignals();
    expect(view.getByTestId("chat-message-catchup")).toBeTruthy();
    expect(fetch).toHaveBeenLastCalledWith("thread", "alice", "resource");
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
    expect(otherConsumer).toHaveBeenCalledTimes(3);
    view.unmount();
    fetch.mockClear();
    signalAccountRefresh(); await flushSignals();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses one account-scoped subscription and coalesces a server/local burst for every consumer", async () => {
    const first = jest.fn();
    const second = jest.fn();
    const disabled = jest.fn();
    render(tree("alice", <><Listener callback={first} /><Listener callback={second} />
      <Listener callback={disabled} enabled={false} /></>));
    expect(accountEventsTopic("alice")).toBe("account_events_alice");
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
    expect(apolloClient.subscribe).toHaveBeenCalledWith({
      query: ACCOUNT_EVENTS_SUBSCRIPTION, variables: { topic: "account_events_alice" }
    });
    await flushSignals();
    first.mockClear(); second.mockClear();
    act(() => {
      observers[0]!.next({ data: { listen: {} } });
      observers[0]!.next({ data: { listen: {} } });
      signalAccountRefresh();
      jest.advanceTimersByTime(99);
    });
    expect(first).not.toHaveBeenCalled();
    await act(async () => { jest.advanceTimersByTime(1); });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(disabled).not.toHaveBeenCalled();
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
  });

  it("local mutation signals refresh listeners without a websocket event", async () => {
    const callback = jest.fn();
    render(tree("alice", <Listener callback={callback} />));
    await flushSignals(); callback.mockClear();
    signalAccountRefresh();
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("refreshes on foreground, network recovery and websocket reconnection, not repeated healthy states", async () => {
    const callback = jest.fn();
    render(tree("alice", <Listener callback={callback} />));
    await flushSignals(); callback.mockClear();
    act(() => { appState("active"); network({ isConnected: true, isInternetReachable: true }); });
    await flushSignals();
    expect(callback).not.toHaveBeenCalled();
    act(() => { appState("background"); appState("active"); });
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(1);
    act(() => {
      network({ isConnected: true, isInternetReachable: false });
      network({ isConnected: true, isInternetReachable: null });
    });
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(2);
    expect(reconnectRealtime).toHaveBeenCalledTimes(2);
    act(() => notifyRealtimeConnected());
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(3);
    act(() => { appState("active"); network({ isConnected: true, isInternetReachable: true }); });
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("uses the latest callback without resubscribing and removes a disabled listener", async () => {
    const old = jest.fn(); const latest = jest.fn();
    const view = render(tree("alice", <Listener callback={old} />));
    await flushSignals(); old.mockClear();
    view.rerender(tree("alice", <Listener callback={latest} />));
    signalAccountRefresh(); await flushSignals();
    expect(old).not.toHaveBeenCalled(); expect(latest).toHaveBeenCalledTimes(1);
    view.rerender(tree("alice", <Listener callback={latest} enabled={false} />));
    signalAccountRefresh(); await flushSignals();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
  });

  it("restarts a terminally failed subscription on foreground recovery", async () => {
    const callback = jest.fn();
    render(tree("alice", <Listener callback={callback} />));
    await flushSignals();
    act(() => observers[0]!.error(new Error("terminal transport failure")));
    act(() => { appState("background"); appState("active"); });
    await flushSignals();
    expect(apolloClient.subscribe).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledTimes(2);
    act(() => observers[1]!.next({}));
    await flushSignals();
    expect(callback).toHaveBeenCalledTimes(3);
  });

  it("filters imperative subscribers by account and supports explicit unsubscribe", async () => {
    const alice = jest.fn(); const bob = jest.fn();
    const a = subscribeToAccountEvents("alice", alice);
    const b = subscribeToAccountEvents("bob", bob);
    try {
      render(tree("alice")); await flushSignals();
      expect(alice).toHaveBeenCalledTimes(1); expect(bob).not.toHaveBeenCalled();
      a.unsubscribe(); signalAccountRefresh(); await flushSignals();
      expect(alice).toHaveBeenCalledTimes(1);
    } finally { a.unsubscribe(); b.unsubscribe(); }
  });

  it.each(["logout", "unmount"])("cancels queued refresh and every external listener on %s", async action => {
    const callback = jest.fn();
    const view = render(tree("alice", <Listener callback={callback} />));
    signalAccountRefresh();
    if (action === "logout") view.rerender(tree(null, <Listener callback={callback} />));
    else view.unmount();
    act(() => { notifyRealtimeConnected(); network({ isConnected: true, isInternetReachable: true }); signalAccountRefresh(); });
    await flushSignals();
    expect(callback).not.toHaveBeenCalled();
    expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
    expect(removeNetwork).toHaveBeenCalledTimes(1);
    expect(removeAppState).toHaveBeenCalledTimes(1);
  });

  it("does not subscribe while logged out", async () => {
    const callback = jest.fn();
    render(tree(null, <Listener callback={callback} />));
    signalAccountRefresh(); await flushSignals();
    expect(apolloClient.subscribe).not.toHaveBeenCalled();
    expect(NetInfo.addEventListener).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();
  });

  it("cancels the old queued fanout and replaces the subscription on account swap", async () => {
    const old = jest.fn(); const next = jest.fn();
    const a = subscribeToAccountEvents("alice", old);
    const b = subscribeToAccountEvents("bob", next);
    try {
      const view = render(tree("alice"));
      view.rerender(tree("bob"));
      await flushSignals();
      expect(old).not.toHaveBeenCalled(); expect(next).toHaveBeenCalledTimes(1);
      expect(unsubscribes[0]).toHaveBeenCalledTimes(1);
      expect(apolloClient.subscribe).toHaveBeenLastCalledWith({
        query: ACCOUNT_EVENTS_SUBSCRIPTION, variables: { topic: "account_events_bob" }
      });
    } finally { a.unsubscribe(); b.unsubscribe(); }
  });

  it("ignores a late callback from the previous account subscription", async () => {
    const callback = jest.fn();
    const view = render(tree("alice", <Listener callback={callback} />));
    await flushSignals();
    const stale = observers[0]!;
    view.rerender(tree("bob", <Listener callback={callback} />));
    await flushSignals(); callback.mockClear();
    act(() => stale.next({ data: { listen: {} } }));
    await flushSignals();
    expect(callback).not.toHaveBeenCalled();
  });

  it("logs subscription, synchronous listener and rejected listener errors without interrupting fanout", async () => {
    const sync = new Error("sync listener"); const asyncError = new Error("async listener");
    const transport = new Error("subscription"); const good = jest.fn();
    render(tree("alice", <>
      <Listener callback={() => { throw sync; }} />
      <Listener callback={() => Promise.reject(asyncError)} />
      <Listener callback={good} />
    </>));
    act(() => observers[0]!.error(transport));
    await flushSignals();
    expect(good).toHaveBeenCalledTimes(1);
    for (const error of [sync, asyncError, transport]) {
      expect(logAppEvent).toHaveBeenCalledWith({
        level: "error", message: "account-realtime-refresh-failed", details: error
      });
    }
  });
});