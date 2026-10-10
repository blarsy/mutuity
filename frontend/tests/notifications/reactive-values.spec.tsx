import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { useTokenBalance } from "../../src/features/contribution/useTokenBalance";
import { TokenBalanceDisplay } from "../../src/features/contribution/TokenBalanceDisplay";
import { useUnreadNotifications } from "../../src/features/notifications/useUnreadNotifications";
import { TOKEN_BALANCE_QUERY } from "../../src/features/contribution/contribution.queries";
import { COUNT_UNREAD_NOTIFICATIONS_QUERY } from "../../src/features/notifications/notifications.queries";

let mockRef: { current: unknown } | undefined;
let mockSession = { authenticated: true, account: { id: "account-a" } };
const mockUseQuery = jest.fn();
const mockSignal = jest.fn();
jest.mock("react", () => ({ ...jest.requireActual("react"), useRef: (value: unknown) => mockRef ?? (mockRef = { current: value }) }));
jest.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => mockUseQuery(...args) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: mockSession }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: (...args: unknown[]) => mockSignal(...args) }));

describe.each([
  ["balance", useTokenBalance, TOKEN_BALANCE_QUERY, "currentTokenBalance", "balance"],
  ["unread badge", useUnreadNotifications, COUNT_UNREAD_NOTIFICATIONS_QUERY, "countUnreadNotifications", "count"]
] as const)("reactive %s", (_name, useValue, document, field, resultField) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRef = undefined;
    mockSession = { authenticated: true, account: { id: "account-a" } };
  });
  const read = () => (useValue() as unknown as Record<string, unknown>)[resultField];

  it("shows unknown, observes updated cached scalars, and retains values during failed refreshes", () => {
    const refetch = jest.fn(() => Promise.resolve());
    mockUseQuery.mockReturnValue({ refetch });
    expect(read()).toBeNull();
    mockUseQuery.mockReturnValue({ data: { [field]: 7 }, refetch });
    expect(read()).toBe(7);
    mockUseQuery.mockReturnValue({ data: { [field]: 3 }, refetch });
    expect(read()).toBe(3);
    mockUseQuery.mockReturnValue({ error: new Error("offline"), refetch });
    expect(read()).toBe(3);
    expect(mockUseQuery).toHaveBeenCalledWith(document, expect.objectContaining({ fetchPolicy: "cache-and-network" }));
    mockSignal.mock.calls.at(-1)?.[0]();
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("clears known values on logout/account change and preserves a real zero", () => {
    mockUseQuery.mockReturnValue({ data: { [field]: 8 }, refetch: jest.fn() });
    expect(read()).toBe(8);
    mockSession.authenticated = false;
    expect(read()).toBeNull();
    mockSession = { authenticated: true, account: { id: "account-b" } };
    mockUseQuery.mockReturnValue({ refetch: jest.fn() });
    expect(read()).toBeNull();
    mockUseQuery.mockReturnValue({ data: { [field]: 0 }, refetch: jest.fn() });
    expect(read()).toBe(0);
  });
});

it("contribution can observe combined-query balance without a second network request", () => {
  mockRef = undefined;
  mockUseQuery.mockReturnValue({ data: { currentTokenBalance: 12 }, refetch: jest.fn() });
  expect(useTokenBalance({ cacheOnly: true }).balance).toBe(12);
  expect(mockUseQuery).toHaveBeenLastCalledWith(TOKEN_BALANCE_QUERY, expect.objectContaining({ fetchPolicy: "cache-only" }));
  expect(mockSignal).toHaveBeenLastCalledWith(expect.any(Function), false);
});

it("balance display never invents a zero and formats actual balances reactively", () => {
  const format = (amount: number) => `${amount} tokens`;
  expect(renderToStaticMarkup(createElement(TokenBalanceDisplay, { balance: null, format }))).toContain("—");
  expect(renderToStaticMarkup(createElement(TokenBalanceDisplay, { balance: 0, format }))).toContain("0 tokens");
  expect(renderToStaticMarkup(createElement(TokenBalanceDisplay, { balance: 9, format }))).toContain("9 tokens");
});