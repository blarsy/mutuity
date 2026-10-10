import { type ReactElement } from "react";
import { AuthProvider, ANONYMOUS_SESSION, type AuthContextValue } from "../../src/features/auth/AuthProvider";
import type { AuthSession } from "../../src/features/auth/types";

const mockLogin = jest.fn();
const mockLogout = jest.fn();
const mockCurrentSession = jest.fn();
const mockReset = jest.fn();
const mockSetSession = jest.fn();
const mockSetStatus = jest.fn();
let mockStateIndex = 0;
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useState: (initial: unknown) => [initial, mockStateIndex++ === 0 ? mockSetSession : mockSetStatus],
  useRef: (initial: unknown) => ({ current: initial }),
  useCallback: (callback: unknown) => callback,
  useMemo: (factory: () => unknown) => factory(),
  useEffect: jest.fn()
}));
jest.mock("../../src/features/auth/auth.api", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  logout: () => mockLogout(),
  getCurrentSession: () => mockCurrentSession()
}));
jest.mock("../../src/services/graphql/client", () => ({ resetAccountGraphqlState: () => mockReset() }));
jest.mock("../../src/features/logging/operationalLogger", () => ({ logBackofficeError: jest.fn() }));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: { language: "fr" } }));

const account = (id: string): AuthSession => ({ authenticated: true, account: { id, displayName: id, externalSubject: id, emailVerified: true }, role: "identified_account", expiresAt: null });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}
function provider() {
  mockStateIndex = 0;
  return (AuthProvider({ children: null }) as ReactElement<{ value: AuthContextValue }>).props.value;
}
const input = { identifier: "user@example.com", password: "password" };

describe("account cache/auth lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReset.mockResolvedValue(undefined);
    mockLogout.mockResolvedValue(ANONYMOUS_SESSION);
  });

  it("clears account cache before exposing login and clears again on logout", async () => {
    const reset = deferred<void>();
    mockReset.mockReturnValueOnce(reset.promise);
    mockLogin.mockResolvedValueOnce(account("a"));
    const auth = provider();
    const signingIn = auth.signIn(input);
    await Promise.resolve();
    await Promise.resolve();
    expect(mockSetSession).not.toHaveBeenCalledWith(account("a"));
    reset.resolve();
    await signingIn;
    expect(mockReset).toHaveBeenCalledTimes(1);
    expect(mockSetSession).toHaveBeenLastCalledWith(account("a"));
    await auth.signOut();
    expect(mockReset).toHaveBeenCalledTimes(2);
    expect(mockSetSession).toHaveBeenLastCalledWith(ANONYMOUS_SESSION);
  });

  it("does not clear same-account cache during a session refresh, but clears on direct account changes", async () => {
    mockLogin.mockResolvedValueOnce(account("a")).mockResolvedValueOnce(account("b"));
    mockCurrentSession.mockResolvedValueOnce(account("a"));
    const auth = provider();
    await auth.signIn(input);
    await auth.refreshSession();
    expect(mockReset).toHaveBeenCalledTimes(1);
    await auth.signIn(input);
    expect(mockReset).toHaveBeenCalledTimes(2);
    expect(mockSetSession).toHaveBeenLastCalledWith(account("b"));
  });

  it("ignores a late bootstrap/refresh response after sign-out", async () => {
    const stale = deferred<AuthSession>();
    mockLogin.mockResolvedValueOnce(account("a"));
    mockCurrentSession.mockReturnValueOnce(stale.promise);
    const auth = provider();
    await auth.signIn(input);
    const refreshing = auth.refreshSession();
    await auth.signOut();
    mockSetSession.mockClear();
    stale.resolve(account("a"));
    await refreshing;
    expect(mockSetSession).not.toHaveBeenCalled();
    expect(mockReset).toHaveBeenCalledTimes(2);
  });

  it("does not expose a stale login while its cache reset finishes after logout", async () => {
    const reset = deferred<void>();
    mockReset.mockReturnValueOnce(reset.promise);
    mockLogin.mockResolvedValueOnce(account("a"));
    const auth = provider();
    const signingIn = auth.signIn(input);
    await Promise.resolve();
    await Promise.resolve();
    const signingOut = auth.signOut();
    reset.resolve();
    await Promise.all([signingIn, signingOut]);
    expect(mockSetSession).not.toHaveBeenCalledWith(account("a"));
    expect(mockSetSession).toHaveBeenLastCalledWith(ANONYMOUS_SESSION);
    expect(mockReset).toHaveBeenCalledTimes(2);
  });
});