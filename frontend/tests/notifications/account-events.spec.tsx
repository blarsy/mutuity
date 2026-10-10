import { type ReactElement } from "react";
import { AccountEventSubscriptionProvider, useAccountEventSignal } from "../../src/services/graphql/accountEvents";
import { notifyRealtimeConnected } from "../../src/services/graphql/realtime";

const mockSubscribe = jest.fn();
let mockAccountId: string | null = "account-a";
let mockEffect: (() => (() => void) | undefined) | undefined;
let mockContext: unknown;
let mockRefIndex = 0;
let mockRefs: Array<{ current: unknown }> = [];

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useRef: (value: unknown) => mockRefs[mockRefIndex++] ?? (mockRefs[mockRefIndex - 1] = { current: value }),
  useEffect: (effect: () => (() => void) | undefined) => { mockEffect = effect; },
  useCallback: (callback: unknown) => callback,
  useMemo: (factory: () => unknown) => factory(),
  useContext: () => mockContext
}));
jest.mock("@apollo/client/react", () => ({ useApolloClient: () => ({ subscribe: mockSubscribe }) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { authenticated: Boolean(mockAccountId), account: mockAccountId ? { id: mockAccountId } : null } })
}));

type Sink = { next: () => void; error: (error: unknown) => void; complete: () => void };
let sinks: Sink[];
let unsubscribes: jest.Mock[];
let cleanup: (() => void) | undefined;
const browserWindow = new EventTarget();
const browserDocument = Object.assign(new EventTarget(), { visibilityState: "visible" });

function renderProvider() {
  mockRefIndex = 0;
  const tree = AccountEventSubscriptionProvider({ children: null }) as ReactElement<{ value: { subscribe: (listener: () => unknown) => () => void } }>;
  mockContext = tree.props.value;
  cleanup?.();
  cleanup = mockEffect?.();
  return tree.props.value;
}

describe("shared account realtime recovery", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockRefs = [];
    mockAccountId = "account-a";
    sinks = [];
    unsubscribes = [];
    Object.defineProperty(globalThis, "window", { configurable: true, value: browserWindow });
    Object.defineProperty(globalThis, "document", { configurable: true, value: browserDocument });
    browserDocument.visibilityState = "visible";
    mockSubscribe.mockImplementation(() => ({ subscribe: (sink: Sink) => {
      sinks.push(sink);
      const unsubscribe = jest.fn();
      unsubscribes.push(unsubscribe);
      return { unsubscribe };
    } }));
  });
  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    jest.useRealTimers();
    Reflect.deleteProperty(globalThis, "window");
    Reflect.deleteProperty(globalThis, "document");
  });

  it("fans one subscription out and coalesces a burst into one refresh per listener", () => {
    const { subscribe } = renderProvider();
    const first = jest.fn();
    const second = jest.fn();
    subscribe(first);
    const removeSecond = subscribe(second);
    for (let i = 0; i < 20; i++) sinks[0].next();
    jest.advanceTimersByTime(100);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
    expect(mockSubscribe).toHaveBeenCalledWith(expect.objectContaining({ variables: { topic: "account_events_account-a" } }));
    removeSecond();
    sinks[0].next();
    jest.advanceTimersByTime(100);
    expect(first).toHaveBeenCalledTimes(2);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("recovers on initial connection, reconnection, online and visible, but not hidden", () => {
    const listener = jest.fn();
    renderProvider().subscribe(listener);
    notifyRealtimeConnected();
    jest.advanceTimersByTime(100);
    notifyRealtimeConnected();
    browserWindow.dispatchEvent(new Event("online"));
    jest.advanceTimersByTime(100);
    browserDocument.visibilityState = "hidden";
    browserDocument.dispatchEvent(new Event("visibilitychange"));
    jest.advanceTimersByTime(100);
    expect(listener).toHaveBeenCalledTimes(2);
    browserDocument.visibilityState = "visible";
    browserDocument.dispatchEvent(new Event("visibilitychange"));
    jest.advanceTimersByTime(100);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("cancels queued and late old-account signals, and skips anonymous subscriptions", () => {
    const listener = jest.fn();
    renderProvider().subscribe(listener);
    sinks[0].next();
    mockAccountId = "account-b";
    renderProvider();
    sinks[0].next();
    jest.advanceTimersByTime(100);
    expect(listener).not.toHaveBeenCalled();
    expect(unsubscribes[0]).toHaveBeenCalled();
    sinks[1].next();
    jest.advanceTimersByTime(100);
    expect(listener).toHaveBeenCalledTimes(1);
    mockAccountId = null;
    renderProvider();
    browserWindow.dispatchEvent(new Event("online"));
    notifyRealtimeConnected();
    jest.advanceTimersByTime(100);
    expect(mockSubscribe).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("logs subscription errors and resubscribes on recovery", () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const listener = jest.fn();
    renderProvider().subscribe(listener);
    sinks[0].error(new Error("disconnected"));
    browserWindow.dispatchEvent(new Event("online"));
    jest.advanceTimersByTime(100);
    expect(log).toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("handles thrown and rejected refreshes without stopping other listeners", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    const { subscribe } = renderProvider();
    subscribe(() => { throw new Error("sync"); });
    subscribe(() => Promise.reject(new Error("async")));
    const listener = jest.fn();
    subscribe(listener);
    sinks[0].next();
    jest.advanceTimersByTime(100);
    await Promise.resolve();
    expect(log).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalled();
    log.mockRestore();
  });

  it("the signal hook returns refresh promises and honors disabled listeners", () => {
    const subscribe = jest.fn((_listener: () => unknown) => jest.fn());
    mockContext = { subscribe };
    mockRefIndex = 0;
    const refresh = jest.fn(() => Promise.resolve("refreshed"));
    useAccountEventSignal(refresh);
    const remove = mockEffect?.();
    const callback = subscribe.mock.calls[0]?.[0] as unknown as () => unknown;
    expect(callback()).toBeInstanceOf(Promise);
    remove?.();
    mockRefIndex = 0;
    useAccountEventSignal(refresh, false);
    mockEffect?.();
    expect(subscribe).toHaveBeenCalledTimes(1);
  });
});