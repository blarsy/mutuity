import { gql } from "@apollo/client";

import { createApolloClient, reconnectRealtime, resetAccountGraphqlState } from "../../../src/services/graphql/client";
import { notifyRealtimeConnected, onRealtimeConnected } from "../../../src/services/graphql/connectionEvents";
import { getPersistedAccountId, getPersistedToken } from "../../../src/services/auth/session";
import { logAppEvent } from "../../../src/services/monitoring/logger";

jest.mock("../../../src/services/auth/session", () => ({
  getPersistedToken: jest.fn(),
  getPersistedAccountId: jest.fn()
}));
jest.mock("../../../src/services/app/versionGate", () => ({
  getCurrentAppVersion: () => "1.2.3",
  getCurrentAppPlatform: () => "ios"
}));
jest.mock("../../../src/services/monitoring/logger", () => ({ logAppEvent: jest.fn() }));

const ACCOUNT_A = "11111111-1111-4111-8111-111111111111";
const ACCOUNT_B = "22222222-2222-4222-8222-222222222222";
const QUERY = gql`query LifecycleAccount { account { id } }`;
const SUBSCRIPTION = gql`subscription LifecycleEvents { listen { event } }`;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

async function flush() {
  for (let index = 0; index < 30; index += 1) await Promise.resolve();
}

// Exercise the real graphql-ws client, including terminate and its retry loop.
class NativeSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: NativeSocket[] = [];
  readyState = NativeSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: ((event: { code: number; reason: string }) => void) | null = null;
  onerror: ((error: unknown) => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  sent: Array<{ type: string; id?: string; payload?: unknown }> = [];
  constructor(readonly url: string, readonly protocols?: string | string[], readonly options?: { headers?: Record<string, string> }) {
    NativeSocket.instances.push(this);
  }
  send(data: string) { this.sent.push(JSON.parse(data)); }
  close(code = 1000, reason = "") {
    if (this.readyState === NativeSocket.CLOSED) return;
    this.readyState = NativeSocket.CLOSED;
    this.onclose?.({ code, reason });
  }
  open() { this.readyState = NativeSocket.OPEN; this.onopen?.(); }
  receive(message: unknown) { this.onmessage?.({ data: JSON.stringify(message) }); }
}

function socket(index = NativeSocket.instances.length - 1): NativeSocket {
  const value = NativeSocket.instances[index];
  if (!value) throw new Error(`Missing socket ${index}`);
  return value;
}

async function acknowledge() {
  socket().open();
  await flush();
  socket().receive({ type: "connection_ack" });
  await flush();
}

function response(accountId: string): Response {
  return {
    status: 200,
    headers: { get: () => "application/json" },
    text: async () => JSON.stringify({ data: { account: { __typename: "Account", id: accountId } } })
  } as unknown as Response;
}

describe("mobile GraphQL transport lifecycle", () => {
  const originalSocket = globalThis.WebSocket;
  const originalFetch = globalThis.fetch;
  const subscriptions: Array<{ unsubscribe: () => void }> = [];
  let fetchMock: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, "random").mockReturnValue(0);
    NativeSocket.instances = [];
    globalThis.WebSocket = NativeSocket as unknown as typeof WebSocket;
    fetchMock = jest.fn().mockResolvedValue(response(ACCOUNT_A));
    globalThis.fetch = fetchMock;
    (getPersistedToken as jest.Mock).mockResolvedValue(`mock:${ACCOUNT_A}`);
    (getPersistedAccountId as jest.Mock).mockResolvedValue(ACCOUNT_A);
    (logAppEvent as jest.Mock).mockClear();
  });

  afterEach(async () => {
    subscriptions.splice(0).forEach(subscription => subscription.unsubscribe());
    await resetAccountGraphqlState();
    await flush();
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    globalThis.WebSocket = originalSocket;
    globalThis.fetch = originalFetch;
  });

  function listen(client = createApolloClient()) {
    const next = jest.fn();
    const error = jest.fn();
    const complete = jest.fn();
    subscriptions.push(client.subscribe({ query: SUBSCRIPTION }).subscribe({ next, error, complete }));
    return { client, next, error, complete };
  }

  it("awaits current credentials before the initial native upgrade without an HTTP warmup", async () => {
    const token = deferred<string | null>();
    const { error } = listen(createApolloClient({ getToken: () => token.promise }));
    await flush();
    expect(NativeSocket.instances).toHaveLength(0);
    token.resolve(`mock:${ACCOUNT_B}`);
    await flush();
    expect(socket().options?.headers).toEqual({
      authorization: `Bearer mock:${ACCOUNT_B}`,
      "x-account-id": ACCOUNT_B,
      "x-role": "identified_account",
      "x-app-version": "1.2.3",
      "x-app-platform": "ios"
    });
    await acknowledge();
    expect(socket().sent[0]).toEqual({ type: "connection_init", payload: socket().options?.headers });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("reads HTTP credentials on every request and does not share headers between clients", async () => {
    const client = createApolloClient();
    await client.query({ query: QUERY, fetchPolicy: "network-only" });
    (getPersistedToken as jest.Mock).mockResolvedValue(`mock:${ACCOUNT_B}`);
    (getPersistedAccountId as jest.Mock).mockResolvedValue(ACCOUNT_B);
    await client.query({ query: QUERY, fetchPolicy: "network-only" });
    expect(fetchMock.mock.calls[0]?.[1].headers.authorization).toBe(`Bearer mock:${ACCOUNT_A}`);
    expect(fetchMock.mock.calls[1]?.[1].headers.authorization).toBe(`Bearer mock:${ACCOUNT_B}`);
    listen(createApolloClient({ getToken: async () => `mock:${ACCOUNT_A}` }));
    listen(createApolloClient({ getToken: async () => `mock:${ACCOUNT_B}` }));
    await flush();
    expect(socket(0).options?.headers?.authorization).toBe(`Bearer mock:${ACCOUNT_A}`);
    expect(socket(1).options?.headers?.authorization).toBe(`Bearer mock:${ACCOUNT_B}`);
  });

  it("keeps retrying past five failures with bounded exponential delay and fresh credentials", async () => {
    const { error } = listen();
    await flush();
    for (let retry = 0; retry < 9; retry += 1) {
      const count = NativeSocket.instances.length;
      socket().close(1006, "offline");
      await flush();
      const delay = Math.min(1000 * 2 ** Math.min(retry, 5), 30000);
      await jest.advanceTimersByTimeAsync(delay - 1);
      expect(NativeSocket.instances).toHaveLength(count);
      if (retry === 8) (getPersistedToken as jest.Mock).mockResolvedValue(`mock:${ACCOUNT_B}`);
      await jest.advanceTimersByTimeAsync(1);
      await flush();
      expect(NativeSocket.instances).toHaveLength(count + 1);
    }
    expect(socket().options?.headers?.authorization).toBe(`Bearer mock:${ACCOUNT_B}`);
    await acknowledge();
    expect(error).not.toHaveBeenCalled();
    expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "graphql-realtime-closed" }));
  });

  it("retries failed async credentials without opening an anonymous native socket", async () => {
    const failure = new Error("credential read failed");
    const getToken = jest.fn().mockRejectedValueOnce(failure).mockResolvedValue(`mock:${ACCOUNT_B}`);
    const { error } = listen(createApolloClient({ getToken }));
    await flush();
    expect(NativeSocket.instances).toHaveLength(0);
    expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "graphql-realtime-error", details: failure }));
    await jest.advanceTimersByTimeAsync(1000);
    await flush();
    expect(socket().options?.headers?.authorization).toBe(`Bearer mock:${ACCOUNT_B}`);
    await acknowledge();
    expect(error).not.toHaveBeenCalled();
  });

  it("never sends a leftover persisted account id when the token has been cleared", async () => {
    (getPersistedToken as jest.Mock).mockResolvedValue(null);
    const client = createApolloClient();
    await client.query({ query: QUERY, fetchPolicy: "network-only" });
    expect(fetchMock.mock.calls[0]?.[1].headers).not.toHaveProperty("x-account-id");
    listen(client);
    await flush();
    expect(socket().options?.headers).not.toHaveProperty("x-account-id");
    expect(socket().options?.headers?.authorization).toBe("");
  });

  it("reset during an HTTP credential read prevents dispatching the old-account request", async () => {
    const token = deferred<string | null>();
    const client = createApolloClient({ getToken: () => token.promise });
    const result = client.query({ query: QUERY, fetchPolicy: "network-only" }).catch(() => null);
    await flush();
    await resetAccountGraphqlState();
    token.resolve(`mock:${ACCOUNT_A}`);
    await flush();
    await result;
    expect(fetchMock).not.toHaveBeenCalled();
    expect(client.cache.extract()).toEqual({});
  });

  it("retries a socket whose server never acknowledges connection_init", async () => {
    listen();
    await flush();
    socket().open();
    await flush();
    await jest.advanceTimersByTimeAsync(10000);
    await flush();
    expect(socket().readyState).toBe(NativeSocket.CLOSED);
    await jest.advanceTimersByTimeAsync(1000);
    await flush();
    expect(NativeSocket.instances).toHaveLength(2);
    await acknowledge();
  });

  it("terminate reopens active subscriptions and emits connected on every acknowledgement", async () => {
    const connected = jest.fn();
    const unsubscribe = onRealtimeConnected(connected);
    try {
      reconnectRealtime(); // Does not create a socket without an active operation.
      expect(NativeSocket.instances).toHaveLength(0);
      listen();
      await flush();
      await acknowledge();
      expect(connected).toHaveBeenCalledTimes(1);
      reconnectRealtime();
      await flush();
      await jest.advanceTimersByTimeAsync(1000);
      await flush();
      expect(NativeSocket.instances).toHaveLength(2);
      await acknowledge();
      expect(connected).toHaveBeenCalledTimes(2);
      unsubscribe();
      notifyRealtimeConnected();
      expect(connected).toHaveBeenCalledTimes(2);
    } finally { unsubscribe(); }
  });

  it("reset aborts HTTP, clears cached account data and ignores late old-account results", async () => {
    const late = deferred<Response>();
    fetchMock.mockReturnValueOnce(late.promise);
    const client = createApolloClient();
    client.writeQuery({ query: QUERY, data: { account: { __typename: "Account", id: ACCOUNT_A } } });
    const result = client.query({ query: QUERY, fetchPolicy: "network-only" }).catch(() => null);
    await flush();
    const signal = fetchMock.mock.calls[0]?.[1].signal as AbortSignal;
    await resetAccountGraphqlState();
    expect(signal.aborted).toBe(true);
    late.resolve(response(ACCOUNT_A));
    await flush();
    await result;
    expect(client.cache.extract()).toEqual({});
    (getPersistedToken as jest.Mock).mockResolvedValue(`mock:${ACCOUNT_B}`);
    fetchMock.mockResolvedValue(response(ACCOUNT_B));
    const next = await client.query({ query: QUERY, fetchPolicy: "network-only" });
    expect(next.data).toEqual({ account: { __typename: "Account", id: ACCOUNT_B } });
  });

  it("reset disposes the previous websocket but a later operation creates a usable replacement", async () => {
    const first = listen();
    await flush();
    await acknowledge();
    const oldSocket = socket();
    await resetAccountGraphqlState();
    expect(oldSocket.readyState).toBe(NativeSocket.CLOSED);
    (getPersistedToken as jest.Mock).mockResolvedValue(`mock:${ACCOUNT_B}`);
    const second = listen(first.client);
    await flush();
    await acknowledge();
    expect(socket().options?.headers?.authorization).toBe(`Bearer mock:${ACCOUNT_B}`);
    const operation = socket().sent.find(message => message.type === "subscribe");
    socket().receive({ type: "next", id: operation?.id, payload: { data: { listen: { event: "fresh" } } } });
    await flush();
    expect(second.next).toHaveBeenCalledWith(expect.objectContaining({ data: { listen: { event: "fresh" } } }));
    expect(first.next).not.toHaveBeenCalled();
    expect(first.complete).toHaveBeenCalled();
  });

  it("an account reset during credential resolution never constructs the stale socket", async () => {
    const token = deferred<string | null>();
    listen(createApolloClient({ getToken: () => token.promise }));
    await flush();
    await resetAccountGraphqlState();
    token.resolve(`mock:${ACCOUNT_A}`);
    await flush();
    expect(NativeSocket.instances).toHaveLength(0);
  });

  it("logs socket errors and isolates failing connected listeners", async () => {
    const failure = new Error("listener failed");
    const bad = onRealtimeConnected(() => { throw failure; });
    const goodListener = jest.fn();
    const good = onRealtimeConnected(goodListener);
    try {
      notifyRealtimeConnected();
      expect(goodListener).toHaveBeenCalledTimes(1);
      expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "graphql-realtime-listener-error", details: failure }));
      listen();
      await flush();
      socket().onerror?.(new Error("network failed"));
      await flush();
      expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "graphql-realtime-error" }));
    } finally { bad(); good(); }
  });
});