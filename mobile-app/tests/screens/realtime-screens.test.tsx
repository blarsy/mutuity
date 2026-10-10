import React from "react";
import { act, configure, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { MyEconomicsScreen, type ContributionHistoryItem } from "../../src/screens/economics/MyEconomicsScreen";
import { NotificationsScreen, type NotificationFeedItem } from "../../src/screens/notifications/NotificationsScreen";
import { AccountTokenBalance } from "../../src/components/contribution/AccountTokenBalance";
import { fetchTokenHistoryPage } from "../../src/services/graphql/economics";
import { fetchNotificationWindow, markAllNotificationsRead, markNotificationRead } from "../../src/services/graphql/notifications";
import { useTokenBalance } from "../../src/services/realtime/useTokenBalance";

let mockSignal: (() => void | Promise<unknown>) | undefined;
const mockTranslate = (key: string, options?: { defaultValue?: string }): string => options?.defaultValue ?? key;
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockTranslate, i18n: { language: "en" } })
}));
jest.mock("../../src/services/realtime/accountEvents", () => ({
  useAccountEventSignal: (callback: () => void | Promise<unknown>, enabled: boolean) => {
    const React = require("react");
    React.useEffect(() => {
      if (enabled) mockSignal = callback;
      return () => { mockSignal = undefined; };
    }, [callback, enabled]);
  }
}));
jest.mock("../../src/services/realtime/useTokenBalance", () => ({ useTokenBalance: jest.fn() }));
jest.mock("../../src/services/graphql/economics", () => ({ fetchTokenHistoryPage: jest.fn() }));
jest.mock("../../src/services/graphql/howToGetTokens", () => ({ fetchHowToGetTokensProgress: jest.fn().mockResolvedValue(null) }));
jest.mock("../../src/services/graphql/notifications", () => ({
  fetchNotificationWindow: jest.fn(), markNotificationRead: jest.fn(), markAllNotificationsRead: jest.fn()
}));
jest.mock("../../src/components/tokenExplainer/TokenExplainerDialog", () => ({ TokenExplainerDialog: () => null }));
jest.mock("../../src/screens/notifications/notificationIcons", () => ({ getNotificationIcon: () => () => null }));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
const movement = (id: string, createdAt = "2026-10-10T12:00:00Z"): ContributionHistoryItem => ({
  id, createdAt, title: id, eventType: id, tokenChange: 5
});
const historyPage = (items: ContributionHistoryItem[], hasNextPage = true) => ({ items, hasNextPage, endCursor: "cursor" });
const notification = (id: string, source: NotificationFeedItem["source"] = "account"): NotificationFeedItem => ({
  id, source, headline1: `${source}-${id}`, headline2: "", description: "Update", createdAt: "2026-10-10T12:00:00Z", readAt: null
});
const feedPage = (items: NotificationFeedItem[], hasNextPage = true) => ({ items, hasNextPage });
const wrapper = ({ children }: { children: React.ReactNode }) => <PaperProvider>{children}</PaperProvider>;

// Paper's decorative unread Icon is deliberately hidden from accessibility.
beforeAll(() => configure({ defaultIncludeHiddenElements: true }));
afterAll(() => configure({ defaultIncludeHiddenElements: false }));

beforeEach(() => {
  jest.resetAllMocks();
  mockSignal = undefined;
  (useTokenBalance as jest.Mock).mockReturnValue({ balance: 45, loading: false, error: null, refresh: jest.fn() });
  const { fetchHowToGetTokensProgress } = jest.requireMock("../../src/services/graphql/howToGetTokens");
  fetchHowToGetTokensProgress.mockResolvedValue(null);
  (markNotificationRead as jest.Mock).mockResolvedValue(undefined);
  (markAllNotificationsRead as jest.Mock).mockResolvedValue(undefined);
});

describe("economics realtime history", () => {
  it("retains expanded history and its growing window during event refresh, deduplicating IDs deterministically", async () => {
    const refresh = deferred<ReturnType<typeof historyPage>>();
    (fetchTokenHistoryPage as jest.Mock)
      .mockResolvedValueOnce(historyPage([movement("first")]))
      .mockResolvedValueOnce(historyPage([movement("first"), movement("older", "2026-10-09T12:00:00Z")]))
      .mockReturnValueOnce(refresh.promise);
    const screen = render(<MyEconomicsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("my-economics-screen");
    fireEvent.press(screen.getByTestId("history-accordion:Button"));
    fireEvent.press(screen.getByTestId("history-load-more"));
    await screen.findByTestId("contribution-history-older");
    let pending!: Promise<unknown>;
    act(() => { pending = Promise.resolve(mockSignal?.()); });
    expect(screen.getByTestId("contribution-history-older")).toBeTruthy();
    expect(fetchTokenHistoryPage).toHaveBeenLastCalledWith("a", 20);
    await act(async () => {
      refresh.resolve(historyPage([movement("z"), movement("z"), movement("a"), movement("older", "2026-10-09T12:00:00Z")]));
      await pending;
    });
    expect(screen.getAllByTestId("contribution-history-z")).toHaveLength(1);
    expect(screen.getByTestId("contribution-history-older")).toBeTruthy();
    const rows = screen.getAllByTestId(/^contribution-history-/);
    expect(rows.map(row => row.props.testID)).toEqual(["contribution-history-z", "contribution-history-a", "contribution-history-older"]);
    expect(fetchTokenHistoryPage).toHaveBeenCalledTimes(3);
  });

  it("does not let overlapping pagination overwrite a newer event window", async () => {
    const pagination = deferred<ReturnType<typeof historyPage>>();
    (fetchTokenHistoryPage as jest.Mock)
      .mockResolvedValueOnce(historyPage([movement("first")]))
      .mockReturnValueOnce(pagination.promise)
      .mockResolvedValueOnce(historyPage([movement("new"), movement("older")], false));
    const screen = render(<MyEconomicsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("my-economics-screen");
    fireEvent.press(screen.getByTestId("history-accordion:Button"));
    fireEvent.press(screen.getByTestId("history-load-more"));
    await act(async () => { await mockSignal?.(); });
    await act(async () => { pagination.resolve(historyPage([movement("stale")])); });
    expect(screen.queryByTestId("contribution-history-stale")).toBeNull();
    expect(screen.getByTestId("contribution-history-new")).toBeTruthy();
    expect(screen.queryByTestId("history-load-more")).toBeNull();
  });

  it("ignores history responses from the previous account", async () => {
    const previous = deferred<ReturnType<typeof historyPage>>();
    (fetchTokenHistoryPage as jest.Mock).mockReturnValueOnce(previous.promise).mockResolvedValueOnce(historyPage([movement("b-history")]));
    const screen = render(<MyEconomicsScreen accountId="a" />, { wrapper });
    screen.rerender(<MyEconomicsScreen accountId="b" />);
    await screen.findByTestId("my-economics-screen");
    fireEvent.press(screen.getByTestId("history-accordion:Button"));
    await act(async () => { previous.resolve(historyPage([movement("a-history")])); });
    expect(screen.queryByTestId("contribution-history-a-history")).toBeNull();
    expect(screen.getByTestId("contribution-history-b-history")).toBeTruthy();
    expect(fetchTokenHistoryPage).toHaveBeenLastCalledWith("b", 10);
  });

  it("keeps mounted history when background refresh fails", async () => {
    (fetchTokenHistoryPage as jest.Mock).mockResolvedValueOnce(historyPage([movement("first")])).mockRejectedValueOnce(new Error("offline"));
    const screen = render(<MyEconomicsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("my-economics-screen");
    fireEvent.press(screen.getByTestId("history-accordion:Button"));
    await act(async () => { await mockSignal?.(); });
    expect(screen.getByTestId("contribution-history-first")).toBeTruthy();
    expect(screen.getByText("We could not load contribution details.")).toBeTruthy();
  });

  it("keeps economics usable when optional opportunity progress fails offline", async () => {
    const { fetchHowToGetTokensProgress } = jest.requireMock("../../src/services/graphql/howToGetTokens");
    fetchHowToGetTokensProgress.mockRejectedValueOnce(new Error("progress offline"));
    (fetchTokenHistoryPage as jest.Mock).mockResolvedValue(historyPage([movement("first")]));
    const screen = render(<MyEconomicsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("my-economics-screen");
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("45");
    fireEvent.press(screen.getByTestId("history-accordion:Button"));
    expect(screen.getByTestId("contribution-history-first")).toBeTruthy();
  });

  it("preserves injected data without remote history or realtime subscription", () => {
    const screen = render(<MyEconomicsScreen accountId="a" history={[movement("story")]} currentTokenBalance={72} />, { wrapper });
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("72");
    expect(fetchTokenHistoryPage).not.toHaveBeenCalled();
    expect(mockSignal).toBeUndefined();
    expect(useTokenBalance).toHaveBeenLastCalledWith("a", false);
  });
});

describe("notification realtime feed", () => {
  it("grows all-source windows and retains them on signals without a reload loop", async () => {
    const refresh = deferred<ReturnType<typeof feedPage>>();
    (fetchNotificationWindow as jest.Mock)
      .mockResolvedValueOnce(feedPage([notification("first")]))
      .mockResolvedValueOnce(feedPage([notification("first"), notification("older", "need-claim")]))
      .mockReturnValueOnce(refresh.promise);
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-first");
    expect(fetchNotificationWindow).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Mark all as read")).toBeTruthy();
    fireEvent.press(screen.getByText("Load earlier notifications"));
    await screen.findByTestId("notification-row-older");
    expect(fetchNotificationWindow).toHaveBeenLastCalledWith("a", 40);
    let pending!: Promise<unknown>;
    act(() => { pending = Promise.resolve(mockSignal?.()); });
    expect(screen.getByTestId("notification-row-older")).toBeTruthy();
    await act(async () => {
      refresh.resolve(feedPage([notification("new", "resource-bid"), notification("first"), notification("older", "need-claim")], false));
      await pending;
    });
    expect(screen.getByTestId("notification-row-new")).toBeTruthy();
    expect(screen.getByTestId("notification-row-older")).toBeTruthy();
    expect(fetchNotificationWindow).toHaveBeenCalledTimes(3);
    expect(fetchNotificationWindow).toHaveBeenLastCalledWith("a", 40);
  });

  it("ignores overlapping pagination and previous-account feed responses", async () => {
    const pagination = deferred<ReturnType<typeof feedPage>>();
    const oldRefresh = deferred<ReturnType<typeof feedPage>>();
    (fetchNotificationWindow as jest.Mock)
      .mockResolvedValueOnce(feedPage([notification("first")]))
      .mockReturnValueOnce(pagination.promise)
      .mockResolvedValueOnce(feedPage([notification("new")]))
      .mockReturnValueOnce(oldRefresh.promise)
      .mockResolvedValueOnce(feedPage([notification("b-feed")]));
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-first");
    fireEvent.press(screen.getByText("Load earlier notifications"));
    await act(async () => { await mockSignal?.(); });
    await act(async () => { pagination.resolve(feedPage([notification("stale")])); });
    expect(screen.queryByTestId("notification-row-stale")).toBeNull();
    act(() => { void mockSignal?.(); });
    screen.rerender(<NotificationsScreen accountId="b" />);
    await screen.findByTestId("notification-row-b-feed");
    await act(async () => { oldRefresh.resolve(feedPage([notification("a-feed")])); });
    expect(screen.queryByTestId("notification-row-a-feed")).toBeNull();
    expect(fetchNotificationWindow).toHaveBeenLastCalledWith("b", 20);
  });

  it("rolls back a failed read without hiding the feed and allows retry", async () => {
    const mutation = deferred<void>();
    (fetchNotificationWindow as jest.Mock).mockResolvedValue(feedPage([notification("first")]));
    (markNotificationRead as jest.Mock).mockReturnValueOnce(mutation.promise);
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-first-unread");
    fireEvent.press(screen.getByTestId("notification-row-first"));
    expect(screen.queryByTestId("notification-row-first-unread")).toBeNull();
    await act(async () => { mutation.reject(new Error("denied")); });
    expect(screen.getByTestId("notification-row-first-unread")).toBeTruthy();
    expect(screen.getByTestId("notifications-screen")).toBeTruthy();
    expect(screen.getByText("We could not update notifications.")).toBeTruthy();
    fireEvent.press(screen.getByTestId("notification-row-first"));
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledTimes(2));
  });

  it("uses source-qualified optimistic keys and rolls back injected read failures", async () => {
    const mutation = deferred<void>();
    const onMarkRead = jest.fn().mockReturnValue(mutation.promise);
    const screen = render(<NotificationsScreen notifications={[notification("same"), notification("same", "need-claim")]} onMarkRead={onMarkRead} />, { wrapper });
    const account = screen.getByLabelText("account-same. . Update");
    const claim = screen.getByLabelText("need-claim-same. . Update");
    fireEvent.press(account);
    expect(within(account).queryByTestId("notification-row-same-unread")).toBeNull();
    expect(within(claim).getByTestId("notification-row-same-unread")).toBeTruthy();
    expect(onMarkRead).toHaveBeenCalledWith("same", "account");
    await act(async () => { mutation.reject(new Error("denied")); });
    expect(screen.getAllByTestId("notification-row-same-unread")).toHaveLength(2);
    expect(fetchNotificationWindow).not.toHaveBeenCalled();
  });

  it("marks all while earlier pages remain, rolling back a failed bulk mutation", async () => {
    const mutation = deferred<void>();
    (fetchNotificationWindow as jest.Mock).mockResolvedValue(feedPage([notification("one"), notification("two", "resource-bid")]));
    (markAllNotificationsRead as jest.Mock).mockReturnValueOnce(mutation.promise);
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-one");
    fireEvent.press(screen.getByText("Mark all as read"));
    expect(screen.queryAllByTestId(/-unread$/)).toHaveLength(0);
    expect(screen.getByText("Load earlier notifications")).toBeTruthy();
    await act(async () => { mutation.reject(new Error("denied")); });
    expect(screen.getAllByTestId(/-unread$/)).toHaveLength(2);
    expect(fetchNotificationWindow).toHaveBeenCalledTimes(1);
  });

  it("does not apply a previous account's read error to the new account", async () => {
    const mutation = deferred<void>();
    (fetchNotificationWindow as jest.Mock).mockResolvedValue(feedPage([notification("same")]));
    (markNotificationRead as jest.Mock).mockReturnValueOnce(mutation.promise);
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-same");
    fireEvent.press(screen.getByTestId("notification-row-same"));
    screen.rerender(<NotificationsScreen accountId="b" />);
    await screen.findByTestId("notification-row-same-unread");
    await act(async () => { mutation.reject(new Error("old account error")); });
    expect(screen.queryByText("We could not update notifications.")).toBeNull();
    expect(screen.getByTestId("notification-row-same-unread")).toBeTruthy();
  });

  it("retains confirmed individual reads when an overlapping bulk update fails", async () => {
    const individual = deferred<void>();
    const bulk = deferred<void>();
    (fetchNotificationWindow as jest.Mock).mockResolvedValue(feedPage([notification("one"), notification("two")]));
    (markNotificationRead as jest.Mock).mockReturnValueOnce(individual.promise);
    (markAllNotificationsRead as jest.Mock).mockReturnValueOnce(bulk.promise);
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-one");
    fireEvent.press(screen.getByTestId("notification-row-one"));
    fireEvent.press(screen.getByText("Mark all as read"));
    await act(async () => { individual.resolve(); });
    await act(async () => { bulk.reject(new Error("denied")); });
    expect(screen.queryByTestId("notification-row-one-unread")).toBeNull();
    expect(screen.getByTestId("notification-row-two-unread")).toBeTruthy();
  });

  it("keeps the loaded feed visible after a realtime refresh error", async () => {
    (fetchNotificationWindow as jest.Mock).mockResolvedValueOnce(feedPage([notification("first")])).mockRejectedValueOnce(new Error("offline"));
    const screen = render(<NotificationsScreen accountId="a" />, { wrapper });
    await screen.findByTestId("notification-row-first");
    await act(async () => { await mockSignal?.(); });
    expect(screen.getByTestId("notification-row-first")).toBeTruthy();
    expect(screen.getByText("We could not load notifications.")).toBeTruthy();
  });

  it("does no remote work without an account", () => {
    render(<NotificationsScreen />, { wrapper });
    expect(fetchNotificationWindow).not.toHaveBeenCalled();
    expect(mockSignal).toBeUndefined();
  });
});

describe("account balance presentation", () => {
  it("renders live balance and unknown values, but never turns unknown into zero", () => {
    const screen = render(<AccountTokenBalance accountId="a" />);
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("45");
    expect(useTokenBalance).toHaveBeenLastCalledWith("a", true);
    (useTokenBalance as jest.Mock).mockReturnValue({ balance: null, loading: false, error: new Error("offline"), refresh: jest.fn() });
    screen.rerender(<AccountTokenBalance accountId="a" />);
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("—");
    screen.rerender(<AccountTokenBalance accountId="a" balance={0} />);
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("0");
    expect(useTokenBalance).toHaveBeenLastCalledWith("a", false);
    screen.rerender(<AccountTokenBalance balance={null} />);
    expect(screen.getByTestId("account-token-balance")).toHaveTextContent("—");
    expect(useTokenBalance).toHaveBeenLastCalledWith(null, false);
  });
});