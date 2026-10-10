import React from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { act, cleanup, render } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";
import { AppNavigator } from "../../src/navigation/AppNavigator";
import type { AuthContextValue } from "../../src/services/auth/AuthProvider";
import { bootstrapSession } from "../../src/services/auth/session";
import { apolloClient } from "../../src/services/graphql/client";
import { fetchUnreadNotificationsCount } from "../../src/services/graphql/notifications";
import { fetchUnreadChatConversationCount } from "../../src/services/graphql/chat";
import { signalAccountRefresh } from "../../src/services/realtime/accountEvents";

let mockAuth: AuthContextValue;
const mockI18n = { language: "en", changeLanguage: jest.fn() };
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key, i18n: mockI18n })
}));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: {} }));
jest.mock("../../src/services/auth/AuthProvider", () => {
  const actual = jest.requireActual("../../src/services/auth/AuthProvider");
  const React = require("react");
  function Observer() { mockAuth = actual.useAuth(); return null; }
  return { ...actual, AuthProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(actual.AuthProvider, null, React.createElement(Observer), children) };
});
jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn(), setPersistedToken: jest.fn().mockResolvedValue(undefined),
  setPersistedAccountId: jest.fn().mockResolvedValue(undefined), clearPersistedToken: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../src/services/graphql/auth", () => ({ fetchAccountSnapshotById: jest.fn().mockResolvedValue(null) }));
jest.mock("../../src/services/graphql/client", () => ({
  apolloClient: { subscribe: jest.fn() }, reconnectRealtime: jest.fn(), resetAccountGraphqlState: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../../src/services/graphql/chat", () => ({ fetchChatConversations: jest.fn().mockResolvedValue([]), fetchUnreadChatConversationCount: jest.fn() }));
jest.mock("../../src/services/graphql/notifications", () => ({ fetchUnreadNotificationsCount: jest.fn() }));
jest.mock("../../src/services/app/versionGate", () => ({
  fetchAppVersionFloor: jest.fn().mockResolvedValue(null), getCurrentAppVersion: () => "999.0.0"
}));
jest.mock("../../src/services/graphql/appVersionPolicy", () => ({ fetchAppVersionPolicyViaGraphql: jest.fn().mockResolvedValue(null) }));
jest.mock("../../src/services/monitoring/logger", () => ({ logAppEvent: jest.fn() }));
jest.mock("../../src/navigation/US2Navigator", () => ({ US2ExploreScreen: () => null }));
jest.mock("../../src/navigation/US3Navigator", () => ({ US3Navigator: () => null }));
jest.mock("../../src/navigation/AccountPublicProfileNavigator", () => ({ AccountPublicProfileNavigator: () => null }));
jest.mock("@react-native-community/netinfo", () => ({ __esModule: true, default: { addEventListener: jest.fn() } }));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    DefaultTheme: { colors: {} },
    NavigationContainer: React.forwardRef(({ children }: { children: React.ReactNode }, _ref: unknown) => children),
    useNavigationContainerRef: () => React.useRef(null)
  };
});
jest.mock("@react-navigation/bottom-tabs", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { createBottomTabNavigator: () => ({
    Navigator: ({ children }: { children: React.ReactNode }) => children,
    // Read actual navigator options rather than mocking the unread hook. Leaf
    // screens are intentionally not mounted by this navigation integration seam.
    Screen: ({ name, options }: { name: string; options: { tabBarBadge?: number } }) =>
      React.createElement(Text, { testID: `tab-${name}` }, options.tabBarBadge == null ? "no badge" : String(options.tabBarBadge))
  }) };
});

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
let network: (state: { isConnected: boolean; isInternetReachable: boolean }) => void;
let nextEvent: () => void;
let unsubscribe: jest.Mock;
const originalCurrentState = Object.getOwnPropertyDescriptor(AppState, "currentState")!;

async function settle() {
  await act(async () => { for (let i = 0; i < 30; i += 1) await Promise.resolve(); });
}
async function fanout() {
  await act(async () => { jest.advanceTimersByTime(100); });
  await settle();
}
async function mount() {
  const screen = render(<PaperProvider><AppNavigator /></PaperProvider>);
  await settle(); await fanout();
  return screen;
}

beforeEach(() => {
  jest.useFakeTimers(); jest.clearAllMocks();
  (bootstrapSession as jest.Mock).mockResolvedValue({ token: `mock:${ALICE}`, accountId: ALICE, language: null });
  (fetchUnreadNotificationsCount as jest.Mock).mockReset().mockResolvedValue(3);
  (fetchUnreadChatConversationCount as jest.Mock).mockReset().mockResolvedValue(2);
  unsubscribe = jest.fn();
  (apolloClient.subscribe as jest.Mock).mockImplementation(() => ({ subscribe: (observer: { next: () => void }) => {
    nextEvent = observer.next; return { unsubscribe };
  } }));
  (NetInfo.addEventListener as jest.Mock).mockImplementation(listener => { network = listener; return jest.fn(); });
  Object.defineProperty(AppState, "currentState", { configurable: true, writable: true, value: "active" });
  jest.spyOn(AppState, "addEventListener").mockReturnValue({ remove: jest.fn() });
});
afterEach(() => {
  cleanup(); jest.clearAllTimers(); jest.restoreAllMocks(); jest.useRealTimers();
  Object.defineProperty(AppState, "currentState", originalCurrentState);
});

it("wires distinct chat and notification badges through one shared subscription and catches up after offline recovery", async () => {
  const screen = await mount();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("3");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("2");
  expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
  (fetchUnreadNotificationsCount as jest.Mock).mockResolvedValue(7);
  (fetchUnreadChatConversationCount as jest.Mock).mockResolvedValue(5);
  act(() => { network({ isConnected: false, isInternetReachable: false }); network({ isConnected: true, isInternetReachable: true }); });
  await fanout();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("7");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("5");
  expect(apolloClient.subscribe).toHaveBeenCalledTimes(1);
  (fetchUnreadNotificationsCount as jest.Mock).mockResolvedValue(0);
  (fetchUnreadChatConversationCount as jest.Mock).mockResolvedValue(0);
  act(() => nextEvent()); await fanout();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("no badge");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("no badge");
});

it("keeps last good badges on refresh failure and removes them after a confirmed read", async () => {
  const screen = await mount();
  (fetchUnreadNotificationsCount as jest.Mock).mockRejectedValue(new Error("offline"));
  (fetchUnreadChatConversationCount as jest.Mock).mockRejectedValue(new Error("offline"));
  act(() => signalAccountRefresh()); await fanout();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("3");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("2");
  (fetchUnreadNotificationsCount as jest.Mock).mockResolvedValue(0);
  (fetchUnreadChatConversationCount as jest.Mock).mockResolvedValue(0);
  act(() => signalAccountRefresh()); await fanout();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("no badge");
});

it("does not show a numeric badge when the initial count is unknown", async () => {
  (fetchUnreadNotificationsCount as jest.Mock).mockRejectedValue(new Error("offline"));
  const screen = await mount();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("no badge");
});

it("never lets previous-account requests restore badges after switching account or logging out", async () => {
  const screen = await mount();
  let resolveCount!: (count: number) => void;
  let resolveChat!: (count: number) => void;
  (fetchUnreadNotificationsCount as jest.Mock).mockReturnValueOnce(new Promise<number>(resolve => { resolveCount = resolve; })).mockResolvedValue(4);
  (fetchUnreadChatConversationCount as jest.Mock).mockReturnValueOnce(new Promise<number>(resolve => { resolveChat = resolve; })).mockResolvedValue(1);
  act(() => nextEvent()); await fanout();
  await act(async () => { await mockAuth.signIn(`mock:${BOB}`, BOB); });
  await fanout();
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("4");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("1");
  await act(async () => { resolveCount(999); resolveChat(999); });
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("4");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("1");
  expect(apolloClient.subscribe).toHaveBeenCalledTimes(2);
  await act(async () => { await mockAuth.signOut(); });
  expect(screen.getByTestId("tab-Notifications")).toHaveTextContent("no badge");
  expect(screen.getByTestId("tab-Chat")).toHaveTextContent("no badge");
});