import React from "react";
import { act, cleanup, renderHook } from "@testing-library/react-native";
import { AuthContext, type AuthContextValue } from "../../src/services/auth/AuthProvider";
import { fetchCurrentTokenBalance } from "../../src/services/graphql/economics";
import { fetchUnreadNotificationsCount } from "../../src/services/graphql/notifications";
import { AccountEventSubscriptionProvider, signalAccountRefresh } from "../../src/services/realtime/accountEvents";
import { useTokenBalance } from "../../src/services/realtime/useTokenBalance";
import { useUnreadNotificationsCount } from "../../src/services/realtime/useUnreadNotificationsCount";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true, default: { addEventListener: jest.fn(() => jest.fn()) }
}));
jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: { subscribe: jest.fn(() => ({ subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })) })) },
  reconnectRealtime: jest.fn()
}));
jest.mock("../../src/services/auth/session", () => ({}));
jest.mock("../../src/services/graphql/auth", () => ({}));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: {} }));
jest.mock("../../src/services/monitoring/logger", () => ({ logAppEvent: jest.fn() }));
jest.mock("../../src/services/graphql/economics", () => ({ fetchCurrentTokenBalance: jest.fn() }));
jest.mock("../../src/services/graphql/notifications", () => ({ fetchUnreadNotificationsCount: jest.fn() }));

function deferred() {
  let resolve!: (value: number) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<number>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function wrapperFor(identity: { accountId: string | null }) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    const value: AuthContextValue = {
      session: { accountId: identity.accountId, authenticated: Boolean(identity.accountId),
        token: identity.accountId, account: null, loading: false },
      signIn: jest.fn(), signOut: jest.fn(), invalidateSession: jest.fn(),
      changeLanguage: jest.fn(), refreshSession: jest.fn()
    };
    return <AuthContext.Provider value={value}>
      <AccountEventSubscriptionProvider>{children}</AccountEventSubscriptionProvider>
    </AuthContext.Provider>;
  };
}

async function flushSignals() {
  await act(async () => { jest.advanceTimersByTime(100); await Promise.resolve(); });
}

beforeEach(() => { jest.useFakeTimers(); jest.clearAllMocks(); });
afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers(); });

const cases = [
  { name: "token balance", fetch: fetchCurrentTokenBalance as jest.Mock,
    useValue: (id: string | null, enabled: boolean) => {
      const { balance, ...state } = useTokenBalance(id, enabled); return { value: balance, ...state };
    } },
  { name: "unread count", fetch: fetchUnreadNotificationsCount as jest.Mock,
    useValue: (id: string | null, _enabled: boolean) => {
      const { count, ...state } = useUnreadNotificationsCount(id); return { value: count, ...state };
    } }
];

describe.each(cases)("actual $name hook", ({ fetch, useValue }) => {
  it("serializes a burst of manual refetches and coalesced realtime signals into one trailing request", async () => {
    const first = deferred(); const trailing = deferred();
    fetch.mockReset().mockReturnValueOnce(first.promise).mockReturnValueOnce(trailing.promise);
    const identity = { accountId: "alice" as string | null };
    const { result } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    expect(result.current.value).toBeNull(); expect(result.current.loading).toBe(true);
    let refreshes!: Promise<void>[];
    act(() => {
      refreshes = [result.current.refresh(), result.current.refresh(), result.current.refresh()];
      signalAccountRefresh(); signalAccountRefresh();
    });
    await flushSignals();
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => { first.resolve(17); await Promise.resolve(); });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.current.value).toBe(17);
    await act(async () => { trailing.resolve(18); await Promise.all(refreshes); });
    expect(result.current.value).toBe(18); expect(result.current.loading).toBe(false);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("discards a previous account's late value and cancels its queued trailing fetch", async () => {
    const alice = deferred(); const bob = deferred();
    fetch.mockReset().mockReturnValueOnce(alice.promise).mockReturnValueOnce(bob.promise);
    const identity = { accountId: "alice" as string | null };
    const { result, rerender } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    act(() => { void result.current.refresh(); });
    identity.accountId = "bob"; rerender({});
    expect(result.current.value).toBeNull();
    await act(async () => { bob.resolve(4); await Promise.resolve(); });
    expect(result.current.value).toBe(4);
    await act(async () => { alice.resolve(999); await Promise.resolve(); });
    expect(result.current.value).toBe(4);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("discards the previous account's late error", async () => {
    const alice = deferred(); const bob = deferred();
    fetch.mockReset().mockReturnValueOnce(alice.promise).mockReturnValueOnce(bob.promise);
    const identity = { accountId: "alice" as string | null };
    const { result, rerender } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    identity.accountId = "bob"; rerender({});
    await act(async () => { bob.resolve(8); alice.reject(new Error("old account")); await Promise.resolve(); });
    expect(result.current.value).toBe(8); expect(result.current.error).toBeNull();
  });

  it("preserves the last good value on failure, exposes the error and recovers to a valid zero", async () => {
    const error = new Error("offline");
    fetch.mockReset().mockResolvedValueOnce(12).mockRejectedValueOnce(error).mockResolvedValueOnce(0);
    const identity = { accountId: "alice" as string | null };
    const { result } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    await act(async () => { await Promise.resolve(); });
    expect(result.current.value).toBe(12);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.value).toBe(12); expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.value).toBe(0); expect(result.current.error).toBeNull();
  });

  it("keeps unknown data null rather than displaying a false zero after initial failure", async () => {
    const error = new Error("value unavailable");
    fetch.mockReset().mockRejectedValue(error);
    const identity = { accountId: "alice" as string | null };
    const { result } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    expect(result.current.value).toBeNull();
    await act(async () => { await Promise.resolve(); });
    expect(result.current.value).toBeNull(); expect(result.current.error).toBe(error);
    expect(result.current.loading).toBe(false);
  });

  it.each(["logout", "unmount"])("cancels queued requests and ignores in-flight values on %s", async action => {
    const pending = deferred();
    fetch.mockReset().mockReturnValue(pending.promise);
    const identity = { accountId: "alice" as string | null };
    const { result, rerender, unmount } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    act(() => { void result.current.refresh(); });
    if (action === "logout") {
      identity.accountId = null; rerender({});
      expect(result.current.value).toBeNull(); expect(result.current.loading).toBe(false);
    } else unmount();
    await act(async () => { pending.resolve(999); await Promise.resolve(); });
    await flushSignals();
    expect(fetch).toHaveBeenCalledTimes(1);
    if (action === "logout") {
      expect(result.current.value).toBeNull();
      await act(async () => { await result.current.refresh(); });
      expect(fetch).toHaveBeenCalledTimes(1);
    }
  });

  it("does not fetch without an account and clears a displayed value on logout", async () => {
    fetch.mockReset().mockResolvedValue(0);
    const identity = { accountId: null as string | null };
    const { result, rerender } = renderHook(() => useValue(identity.accountId, true), { wrapper: wrapperFor(identity) });
    await act(async () => { await result.current.refresh(); });
    expect(fetch).not.toHaveBeenCalled(); expect(result.current.value).toBeNull();
    identity.accountId = "alice"; rerender({});
    await act(async () => { await Promise.resolve(); });
    expect(result.current.value).toBe(0);
    identity.accountId = null; rerender({});
    expect(result.current.value).toBeNull(); expect(result.current.error).toBeNull();
  });
});

it("disabled token balance neither fetches nor responds to realtime and discards a late enabled request", async () => {
  const pending = deferred();
  (fetchCurrentTokenBalance as jest.Mock).mockReset().mockReturnValue(pending.promise);
  const identity = { accountId: "alice" as string | null };
  const { result, rerender } = renderHook(({ enabled }: { enabled: boolean }) => useTokenBalance(identity.accountId, enabled), {
    initialProps: { enabled: false }, wrapper: wrapperFor(identity)
  });
  await flushSignals();
  expect(fetchCurrentTokenBalance).not.toHaveBeenCalled(); expect(result.current.balance).toBeNull();
  rerender({ enabled: true });
  expect(fetchCurrentTokenBalance).toHaveBeenCalledTimes(1);
  rerender({ enabled: false });
  await act(async () => { pending.resolve(42); await Promise.resolve(); });
  signalAccountRefresh(); await flushSignals();
  expect(result.current.balance).toBeNull(); expect(result.current.loading).toBe(false);
  expect(fetchCurrentTokenBalance).toHaveBeenCalledTimes(1);
});