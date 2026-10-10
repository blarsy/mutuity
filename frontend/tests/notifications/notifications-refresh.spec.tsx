import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { Box, Button, Chip } from "@mui/material";
import NotificationsPage from "../../src/pages/notifications";
import { NOTIFICATIONS_OVERVIEW_QUERY } from "../../src/features/notifications/notifications.queries";

let mockStateIndex = 0;
let mockStates: unknown[] = [];
let mockQueryResult: Record<string, unknown>;
const mockUseQuery = jest.fn();
const mockFeedRefresh = jest.fn();
const mockCountRefresh = jest.fn();
const mockMutations = [jest.fn(), jest.fn(), jest.fn(), jest.fn()];
let mockMutationIndex = 0;
let mockCount: number | null = 91;
let mockSignal: (() => unknown) | undefined;
const mockPush = jest.fn();

jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useMemo: (factory: () => unknown) => factory(),
  useState: (initial: unknown) => {
    const index = mockStateIndex++;
    if (!(index in mockStates)) mockStates[index] = initial;
    return [mockStates[index], (value: unknown) => {
      mockStates[index] = typeof value === "function" ? value(mockStates[index]) : value;
    }];
  }
}));
jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => [mockMutations[mockMutationIndex++], { loading: false }]
}));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { authenticated: true, account: { id: "viewer" } } }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/features/notifications/useUnreadNotifications", () => ({ useUnreadNotifications: () => ({ count: mockCount, refetch: mockCountRefresh }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: (signal: () => unknown) => { mockSignal = signal; } }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string, options?: { count?: number }) => options?.count === undefined ? key : `${key}:${options.count}` }) }));

type Props = { children?: ReactNode; label?: ReactNode; onClick?: () => void; disabled?: boolean; key?: string };
function find(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const results: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) results.push(child);
    results.push(...find(child.props.children, type));
  });
  return results;
}
function render() {
  mockStateIndex = 0;
  mockMutationIndex = 0;
  return NotificationsPage();
}
async function flush() { for (let i = 0; i < 12; i++) await Promise.resolve(); }

describe("notification read refresh and loaded windows", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStates = [];
    mockCount = 91;
    mockFeedRefresh.mockResolvedValue({});
    mockCountRefresh.mockResolvedValue({});
    mockPush.mockResolvedValue(true);
    for (const mutation of mockMutations) mutation.mockResolvedValue({ data: {} });
    const node = (id: string) => ({ id, eventType: "claim_created", payload: {}, readAt: null, createdAt: "2026-10-10T10:00:00Z" });
    mockQueryResult = {
      data: {
        allNeedClaimNotifications: { nodes: [{ ...node("need"), needClaimId: "claim" }], pageInfo: { hasNextPage: false } },
        allResourceBidNotifications: { nodes: [{ ...node("resource"), resourceBidId: "bid" }], pageInfo: { hasNextPage: true } },
        allAccountNotifications: { nodes: [node("account")], pageInfo: { hasNextPage: false } }
      },
      loading: false,
      refetch: mockFeedRefresh
    };
    mockUseQuery.mockImplementation(() => mockQueryResult);
  });

  it("uses the authoritative count, not unread rows in the loaded feed", () => {
    expect(find(render(), Chip)[0].props.label).toBe("unreadCount:91");
    mockCount = null;
    const tree = render();
    expect(find(tree, Chip)[0].props.label).toBe("—");
    expect(find(tree, Button).find(button => button.props.children === "markAllAsRead")?.props.disabled).toBe(true);
  });

  it.each(["need", "resource", "account"])("explicitly refreshes count and feed after reading %s without websocket events", async id => {
    const row = find(render(), Box).find(element => element.key === `${id === "need" ? "need-claim" : id === "resource" ? "resource-bid" : "account"}-${id}`);
    expect(row).toBeDefined();
    row?.props.onClick?.();
    await flush();
    expect(mockMutations[id === "need" ? 0 : id === "resource" ? 1 : 2]).toHaveBeenCalledWith({ variables: { input: { notificationId: id } } });
    expect(mockCountRefresh).toHaveBeenCalledTimes(1);
    expect(mockFeedRefresh).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalled();
  });

  it("explicitly refreshes the shared badge after mark-all", async () => {
    const confirm = find(render(), Button).find(button => button.props.children === "confirmDialog.confirm");
    confirm?.props.onClick?.();
    await flush();
    expect(mockMutations[3]).toHaveBeenCalledWith({ variables: { input: {} } });
    expect(mockCountRefresh).toHaveBeenCalledTimes(1);
    expect(mockFeedRefresh).toHaveBeenCalledTimes(1);
  });

  it("does not refresh a failed mutation or leak its rejection", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockMutations[3].mockRejectedValueOnce(new Error("denied"));
    find(render(), Button).find(button => button.props.children === "confirmDialog.confirm")?.props.onClick?.();
    await flush();
    expect(mockCountRefresh).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("refreshes the badge even when the feed refresh fails", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    mockFeedRefresh.mockRejectedValueOnce(new Error("offline"));
    find(render(), Button).find(button => button.props.children === "confirmDialog.confirm")?.props.onClick?.();
    await flush();
    expect(mockCountRefresh).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("paginates all sources, including when only a secondary source has more; keeps rows and window on refresh", async () => {
    find(render(), Button).find(button => button.props.children === "loadMore")?.props.onClick?.();
    const previousData = mockQueryResult.data;
    mockQueryResult = { previousData, loading: true, refetch: mockFeedRefresh };
    const tree = render();
    expect(mockUseQuery).toHaveBeenLastCalledWith(NOTIFICATIONS_OVERVIEW_QUERY, expect.objectContaining({ variables: { first: 50, viewerId: "viewer" } }));
    expect(find(tree, Box).filter(element => element.props.onClick)).toHaveLength(3);
    await mockSignal?.();
    expect(mockFeedRefresh).toHaveBeenLastCalledWith();
    render();
    expect(mockUseQuery.mock.calls.at(-1)?.[1].variables.first).toBe(50);
    const query = NOTIFICATIONS_OVERVIEW_QUERY.loc?.source.body ?? "";
    expect(query.match(/first: \$first/g)).toHaveLength(3);
    expect(query.match(/recipientAccountId: \$viewerId/g)).toHaveLength(3);
    expect(query).toContain("orderBy: [CREATED_AT_DESC, ID_DESC]");
    expect(query.match(/orderBy: \[CREATED_AT_DESC, ID_DESC\]/g)).toHaveLength(3);
  });
});