import React, { useState } from "react";
import { Pressable, Text } from "react-native";
import { act, fireEvent, render, type RenderAPI } from "@testing-library/react-native";

import { AuthContext, AuthProvider, useAuth, type AuthContextValue } from "../../../src/services/auth/AuthProvider";
import { bootstrapSession, clearPersistedToken, setPersistedAccountId, setPersistedLanguage, setPersistedToken } from "../../../src/services/auth/session";
import { fetchAccountSnapshotById, type AuthAccountSnapshot } from "../../../src/services/graphql/auth";
import { resetAccountGraphqlState } from "../../../src/services/graphql/client";
import { logAppEvent } from "../../../src/services/monitoring/logger";

const mockI18n = { language: "en", changeLanguage: jest.fn().mockResolvedValue(undefined) };
jest.mock("react-i18next", () => ({ useTranslation: () => ({ i18n: mockI18n }) }));
jest.mock("../../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn(),
  clearPersistedToken: jest.fn(),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn(),
  setPersistedToken: jest.fn()
}));
jest.mock("../../../src/services/graphql/auth", () => ({ fetchAccountSnapshotById: jest.fn() }));
jest.mock("../../../src/services/graphql/client", () => ({ resetAccountGraphqlState: jest.fn() }));
jest.mock("../../../src/services/monitoring/logger", () => ({ logAppEvent: jest.fn() }));

const ACCOUNT_A = "11111111-1111-4111-8111-111111111111";
const ACCOUNT_B = "22222222-2222-4222-8222-222222222222";
type Bootstrap = Awaited<ReturnType<typeof bootstrapSession>>;
const anonymous: Bootstrap = { token: null, accountId: null, language: null };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

function account(id: string, displayName = id): AuthAccountSnapshot {
  return { id, displayName, avatarUrl: null, preferredLanguage: "en" };
}

async function settle() {
  await act(async () => {
    for (let index = 0; index < 30; index += 1) await Promise.resolve();
  });
}

describe("AuthProvider account lifecycle", () => {
  let current: AuthContextValue;
  let tree: RenderAPI;

  function Observer() {
    current = useAuth();
    const [count, setCount] = useState(0);
    return <Pressable testID="local-state" onPress={() => setCount(value => value + 1)}><Text>{count}</Text></Pressable>;
  }

  async function mount() {
    tree = render(<AuthProvider><Observer /></AuthProvider>);
    await settle();
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (bootstrapSession as jest.Mock).mockReset().mockResolvedValue(anonymous);
    (setPersistedToken as jest.Mock).mockReset().mockResolvedValue(undefined);
    (setPersistedAccountId as jest.Mock).mockReset().mockResolvedValue(undefined);
    (clearPersistedToken as jest.Mock).mockReset().mockResolvedValue(undefined);
    (setPersistedLanguage as jest.Mock).mockReset().mockResolvedValue(undefined);
    (resetAccountGraphqlState as jest.Mock).mockReset().mockResolvedValue(undefined);
    (fetchAccountSnapshotById as jest.Mock).mockReset().mockImplementation(async (id: string) => account(id));
    mockI18n.language = "en";
    mockI18n.changeLanguage.mockReset().mockResolvedValue(undefined);
  });

  it("persists both credentials and resets account state before publishing authentication or hydrating", async () => {
    await mount();
    jest.clearAllMocks();
    const persisted = deferred<void>();
    (setPersistedToken as jest.Mock).mockReturnValueOnce(persisted.promise);
    let signIn!: Promise<void>;
    act(() => { signIn = current.signIn(`mock:${ACCOUNT_A}`); });
    await settle();
    expect(current.session).toEqual(expect.objectContaining({ authenticated: false, accountId: null, token: null, loading: true }));
    expect(fetchAccountSnapshotById).not.toHaveBeenCalled();
    expect(setPersistedAccountId).not.toHaveBeenCalled();
    await act(async () => { persisted.resolve(); await signIn; });
    expect(current.session).toEqual(expect.objectContaining({ token: `mock:${ACCOUNT_A}`, accountId: ACCOUNT_A, authenticated: true, loading: false }));
    expect(setPersistedAccountId).toHaveBeenCalledWith(ACCOUNT_A);
    expect(resetAccountGraphqlState).toHaveBeenCalledTimes(2);
    const resetCalls = (resetAccountGraphqlState as jest.Mock).mock.invocationCallOrder;
    expect(resetCalls[1]).toBeLessThan((fetchAccountSnapshotById as jest.Mock).mock.invocationCallOrder[0]!);
  });

  it("suppresses the previous identity and resets child local state on account or token changes", async () => {
    await mount();
    await act(async () => { await current.signIn(`mock:${ACCOUNT_A}`); });
    fireEvent.press(tree.getByTestId("local-state"));
    expect(tree.getByText("1")).toBeTruthy();
    const persisted = deferred<void>();
    (setPersistedToken as jest.Mock).mockReturnValueOnce(persisted.promise);
    let switching!: Promise<void>;
    act(() => { switching = current.signIn(`mock:${ACCOUNT_B}`); });
    expect(current.session.account).toBeNull();
    expect(current.session.accountId).toBeNull();
    expect(current.session.authenticated).toBe(false);
    expect(tree.getByText("0")).toBeTruthy();
    await act(async () => { persisted.resolve(); await switching; });
    expect(current.session.accountId).toBe(ACCOUNT_B);
    fireEvent.press(tree.getByTestId("local-state"));
    await act(async () => { await current.signIn("refreshed-token", ACCOUNT_B); });
    expect(tree.getByText("0")).toBeTruthy();
  });

  it("a late bootstrap cannot overwrite a newer sign-in or restore its language", async () => {
    const boot = deferred<Bootstrap>();
    (bootstrapSession as jest.Mock).mockReturnValueOnce(boot.promise);
    await mount();
    await act(async () => { await current.signIn(`mock:${ACCOUNT_B}`); });
    await act(async () => { boot.resolve({ token: `mock:${ACCOUNT_A}`, accountId: ACCOUNT_A, language: "fr" }); });
    await settle();
    expect(current.session.accountId).toBe(ACCOUNT_B);
    expect(mockI18n.changeLanguage).not.toHaveBeenCalled();
    expect(fetchAccountSnapshotById).not.toHaveBeenCalledWith(ACCOUNT_A);
  });

  it("logout wins over late bootstrap account hydration", async () => {
    const snapshot = deferred<AuthAccountSnapshot | null>();
    (bootstrapSession as jest.Mock).mockResolvedValueOnce({ token: `mock:${ACCOUNT_A}`, accountId: ACCOUNT_A, language: null });
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(snapshot.promise);
    await mount();
    expect(fetchAccountSnapshotById).toHaveBeenCalledWith(ACCOUNT_A);
    await act(async () => { await current.signOut(); });
    await act(async () => { snapshot.resolve(account(ACCOUNT_A)); });
    await settle();
    expect(current.session).toEqual({ token: null, accountId: null, account: null, authenticated: false, loading: false });
    expect(clearPersistedToken).toHaveBeenCalledTimes(1);
  });

  it("serializes a pending sign-in write before logout and never publishes its late account", async () => {
    await mount();
    const persisted = deferred<void>();
    (setPersistedToken as jest.Mock).mockReturnValueOnce(persisted.promise);
    let signIn!: Promise<void>;
    act(() => { signIn = current.signIn(`mock:${ACCOUNT_A}`); });
    await settle();
    let signOut!: Promise<void>;
    act(() => { signOut = current.signOut(); });
    await settle();
    expect(clearPersistedToken).not.toHaveBeenCalled();
    await act(async () => { persisted.resolve(); await Promise.all([signIn, signOut]); });
    expect(clearPersistedToken).toHaveBeenCalledTimes(1);
    expect((clearPersistedToken as jest.Mock).mock.invocationCallOrder[0]).toBeGreaterThan((setPersistedAccountId as jest.Mock).mock.invocationCallOrder.at(-1)!);
    expect(fetchAccountSnapshotById).not.toHaveBeenCalled();
    expect(current.session.authenticated).toBe(false);
  });

  it("the newest sign-in wins even if the prior account snapshot resolves last", async () => {
    await mount();
    const snapshot = deferred<AuthAccountSnapshot | null>();
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(snapshot.promise);
    let first!: Promise<void>;
    act(() => { first = current.signIn(`mock:${ACCOUNT_A}`); });
    await settle();
    await act(async () => { await current.signIn(`mock:${ACCOUNT_B}`); });
    await act(async () => { snapshot.resolve(account(ACCOUNT_A)); await first; });
    expect(current.session.account).toEqual(account(ACCOUNT_B));
    expect(current.session.token).toBe(`mock:${ACCOUNT_B}`);
  });

  it("serializes overlapping sign-in credentials and exposes only the newest identity", async () => {
    await mount();
    const persisted = deferred<void>();
    (setPersistedToken as jest.Mock).mockReturnValueOnce(persisted.promise);
    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => { first = current.signIn(`mock:${ACCOUNT_A}`); });
    await settle();
    act(() => { second = current.signIn(`mock:${ACCOUNT_B}`); });
    await settle();
    expect(setPersistedToken).toHaveBeenCalledTimes(1);
    expect(current.session.authenticated).toBe(false);
    await act(async () => { persisted.resolve(); await Promise.all([first, second]); });
    expect(setPersistedToken).toHaveBeenLastCalledWith(`mock:${ACCOUNT_B}`);
    expect(setPersistedAccountId).toHaveBeenLastCalledWith(ACCOUNT_B);
    expect(fetchAccountSnapshotById).not.toHaveBeenCalledWith(ACCOUNT_A);
    expect(current.session.accountId).toBe(ACCOUNT_B);
  });

  it("ignores stale refresh results after account switch and logout, including retained callbacks", async () => {
    await mount();
    await act(async () => { await current.signIn(`mock:${ACCOUNT_A}`); });
    const retainedRefresh = current.refreshSession;
    const snapshot = deferred<AuthAccountSnapshot | null>();
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(snapshot.promise);
    let refresh!: Promise<void>;
    act(() => { refresh = current.refreshSession(); });
    await act(async () => { await current.signIn(`mock:${ACCOUNT_B}`); });
    await act(async () => { snapshot.resolve(account(ACCOUNT_A)); await refresh; });
    expect(current.session.accountId).toBe(ACCOUNT_B);
    await act(async () => { await retainedRefresh(); });
    expect(fetchAccountSnapshotById).toHaveBeenLastCalledWith(ACCOUNT_B);
    const late = deferred<AuthAccountSnapshot | null>();
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(late.promise);
    act(() => { refresh = current.refreshSession(); });
    await act(async () => { await current.invalidateSession("expired"); });
    await act(async () => { late.resolve(account(ACCOUNT_B)); await refresh; });
    expect(current.session.account).toBeNull();
    expect(current.session.authenticated).toBe(false);
    expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "auth-invalid-session" }));
  });

  it("the newest refresh wins over older refresh and initial sign-in hydration", async () => {
    await mount();
    const initial = deferred<AuthAccountSnapshot | null>();
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(initial.promise);
    let signIn!: Promise<void>;
    act(() => { signIn = current.signIn(`mock:${ACCOUNT_A}`); });
    await settle();
    const older = deferred<AuthAccountSnapshot | null>();
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(older.promise);
    let refresh!: Promise<void>;
    act(() => { refresh = current.refreshSession(); });
    (fetchAccountSnapshotById as jest.Mock).mockResolvedValueOnce(account(ACCOUNT_A, "newest"));
    await act(async () => { await current.refreshSession(); });
    await act(async () => { older.resolve(account(ACCOUNT_A, "older")); initial.resolve(account(ACCOUNT_A, "initial")); await Promise.all([refresh, signIn]); });
    expect(current.session.account?.displayName).toBe("newest");
  });

  it("does not publish authentication on failed persistence and logs cleanup/hydration failures", async () => {
    await mount();
    const failure = new Error("storage failed");
    (setPersistedToken as jest.Mock).mockRejectedValueOnce(failure);
    await act(async () => { await expect(current.signIn(`mock:${ACCOUNT_A}`)).rejects.toBe(failure); });
    expect(current.session.authenticated).toBe(false);
    expect(clearPersistedToken).toHaveBeenCalled();
    expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "auth-persist-token-failed", details: failure }));
    (fetchAccountSnapshotById as jest.Mock).mockRejectedValueOnce(new Error("offline"));
    await act(async () => { await current.signIn(`mock:${ACCOUNT_B}`); });
    expect(current.session.authenticated).toBe(true);
    expect(current.session.account).toBeNull();
    expect(logAppEvent).toHaveBeenCalledWith(expect.objectContaining({ message: "auth-account-hydration-failed" }));
  });

  it("restores token-derived account identity and language and retains language across logout", async () => {
    (bootstrapSession as jest.Mock).mockResolvedValueOnce({ token: `mock:${ACCOUNT_A}`, accountId: null, language: "fr" });
    await mount();
    expect(setPersistedAccountId).toHaveBeenCalledWith(ACCOUNT_A);
    expect(current.session.accountId).toBe(ACCOUNT_A);
    expect(mockI18n.changeLanguage).toHaveBeenCalledWith("fr");
    await act(async () => { await current.changeLanguage("en"); await current.signOut(); });
    expect(setPersistedLanguage).toHaveBeenCalledWith("en");
    expect(setPersistedLanguage).toHaveBeenCalledTimes(1);
  });

  it("ignores hydration after unmount", async () => {
    const snapshot = deferred<AuthAccountSnapshot | null>();
    (bootstrapSession as jest.Mock).mockResolvedValueOnce({ token: `mock:${ACCOUNT_A}`, accountId: ACCOUNT_A, language: null });
    (fetchAccountSnapshotById as jest.Mock).mockReturnValueOnce(snapshot.promise);
    await mount();
    tree.unmount();
    await act(async () => { snapshot.resolve(account(ACCOUNT_A)); });
    expect(current.session.authenticated).toBe(false);
  });

  it("keeps AuthContext directly injectable by Storybook harnesses", () => {
    const value: AuthContextValue = {
      session: { token: "story", accountId: ACCOUNT_A, account: account(ACCOUNT_A), authenticated: true, loading: false },
      signIn: jest.fn(), signOut: jest.fn(), invalidateSession: jest.fn(), changeLanguage: jest.fn(), refreshSession: jest.fn()
    };
    render(<AuthContext.Provider value={value}><Observer /></AuthContext.Provider>);
    expect(current).toBe(value);
    expect(bootstrapSession).not.toHaveBeenCalled();
  });
});