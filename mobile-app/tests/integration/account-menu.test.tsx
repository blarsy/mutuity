import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { AppNavigator } from "../../src/navigation/AppNavigator";
import { designTokens } from "../../src/theme/tokens";
import { appFontFamilies } from "../../src/theme/fonts";

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockNavigate = jest.fn();
const mockAccountId = "11111111-1111-4111-8111-111111111111";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key })
}));
jest.mock("../../src/i18n", () => ({ __esModule: true, default: {} }));
jest.mock("../../src/services/auth/AuthProvider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ signIn: jest.fn(), signOut: mockSignOut })
}));
jest.mock("../../src/services/auth/useCurrentAccount", () => ({
  useCurrentAccount: () => ({ authenticated: true, loading: false, accountId: mockAccountId, displayName: "Alice", avatarUrl: null })
}));
jest.mock("../../src/services/realtime/accountEvents", () => ({
  AccountEventSubscriptionProvider: ({ children }: { children: React.ReactNode }) => children,
  subscribeToAccountEvents: () => ({ unsubscribe: jest.fn() })
}));
jest.mock("../../src/services/realtime/useUnreadNotificationsCount", () => ({ useUnreadNotificationsCount: () => ({ count: 0 }) }));
jest.mock("../../src/services/graphql/chat", () => ({
  fetchChatConversations: jest.fn().mockResolvedValue([]), fetchUnreadChatConversationCount: jest.fn().mockResolvedValue(0)
}));
jest.mock("../../src/services/app/versionGate", () => ({
  fetchAppVersionFloor: jest.fn().mockResolvedValue(null), getCurrentAppVersion: () => "999.0.0"
}));
jest.mock("../../src/services/graphql/appVersionPolicy", () => ({ fetchAppVersionPolicyViaGraphql: jest.fn().mockResolvedValue(null) }));
jest.mock("../../src/navigation/US2Navigator", () => ({ US2ExploreScreen: () => null }));
jest.mock("../../src/navigation/US3Navigator", () => ({ US3Navigator: () => null }));
jest.mock("../../src/navigation/AccountPublicProfileNavigator", () => ({ AccountPublicProfileNavigator: () => null }));
jest.mock("../../src/screens/profile/MyProfileScreen", () => ({
  MyProfileScreen: ({ onOpenDrawer }: { onOpenDrawer: () => void }) => {
    const React = require("react");
    const { View, Text, Button } = require("react-native");
    return React.createElement(View, null,
      React.createElement(Text, null, "Profile screen"),
      React.createElement(Button, { title: "Open drawer", onPress: onOpenDrawer }));
  }
}));
jest.mock("../../src/screens/profile/MyPreferencesScreen", () => ({
  MyPreferencesScreen: () => require("react").createElement(require("react-native").Text, null, "Preferences screen")
}));
jest.mock("../../src/screens/economics/MyEconomicsScreen", () => ({
  MyEconomicsScreen: () => require("react").createElement(require("react-native").Text, null, "Economics screen")
}));
jest.mock("../../src/screens/resources/MyResourcesScreen", () => ({
  MyResourcesScreen: ({ onAddResource }: { onAddResource: () => void }) =>
    require("react").createElement(require("react-native").Button, { title: "Add resource", onPress: onAddResource })
}));
jest.mock("../../src/screens/resources/EditResourceScreen", () => ({
  EditResourceScreen: () => require("react").createElement(require("react-native").Text, null, "Edit resource screen")
}));
jest.mock("react-native-paper", () => {
  const actual = jest.requireActual("react-native-paper");
  const React = require("react");
  const { View, Pressable, Text } = require("react-native");
  // Keep the menu visibility/press contract without native portal measurement.
  const Menu = ({ visible, anchor, children, contentStyle }: any) =>
    React.createElement(View, null, anchor, visible ? React.createElement(View, { testID: "account-menu", style: contentStyle }, children) : null);
  Menu.Item = ({ title, onPress, style, titleStyle }: any) =>
    React.createElement(Pressable, { accessibilityRole: "button", accessibilityLabel: title, onPress, style }, React.createElement(Text, { style: titleStyle }, title));
  return { ...actual, Menu, Portal: ({ children }: any) => children, Snackbar: () => null };
});
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    DefaultTheme: { colors: {} },
    NavigationContainer: React.forwardRef(({ children }: any, _ref: unknown) => children),
    useNavigationContainerRef: () => React.useRef({ navigate: mockNavigate })
  };
});
jest.mock("@react-navigation/bottom-tabs", () => {
  const React = require("react");
  return { createBottomTabNavigator: () => ({
    Navigator: ({ children, initialRouteName }: any) => React.Children.toArray(children).filter((child: any) => child.props.name === initialRouteName),
    Screen: ({ children }: any) => children()
  }) };
});

beforeEach(() => jest.clearAllMocks());

it.each([
  ["Profile", "Profile screen"],
  ["Contribution", "Economics screen"],
  ["Preferences", "Preferences screen"]
])("opens %s in My Hub and dismisses the menu", async (label, destination) => {
  const screen = render(<AppNavigator />);
  fireEvent.press(screen.getByLabelText("Account"));
  expect(screen.getByTestId("account-menu")).toHaveStyle({ backgroundColor: designTokens.colors.secondary });
  for (const title of ["Profile", "Contribution", "Preferences", "Log out"]) {
    expect(screen.getByRole("button", { name: title })).toHaveStyle({ backgroundColor: designTokens.colors.secondary });
    expect(screen.getByText(title)).toHaveStyle({ color: "#000000", fontFamily: appFontFamilies.general });
  }
  fireEvent.press(screen.getByRole("button", { name: label }));
  await waitFor(() => expect(screen.getByText(destination)).toBeTruthy());
  expect(mockNavigate).toHaveBeenCalledWith("MyHub");
  expect(screen.queryByTestId("account-menu")).toBeNull();
  expect(screen.queryByLabelText("Close drawer")).toBeNull();
});

it("leaves a nested My Hub editor when selecting another account shortcut", async () => {
  const screen = render(<AppNavigator />);
  fireEvent.press(screen.getByLabelText("Account"));
  fireEvent.press(screen.getByRole("button", { name: "Profile" }));
  await waitFor(() => expect(screen.getByText("Profile screen")).toBeTruthy());
  fireEvent.press(screen.getByText("Open drawer"));
  fireEvent.press(screen.getByRole("button", { name: "My resources" }));
  fireEvent.press(screen.getByText("Add resource"));
  expect(screen.getByText("Edit resource screen")).toBeTruthy();
  fireEvent.press(screen.getByLabelText("Account"));
  fireEvent.press(screen.getByRole("button", { name: "Preferences" }));
  await waitFor(() => expect(screen.getByText("Preferences screen")).toBeTruthy());
  expect(screen.queryByText("Edit resource screen")).toBeNull();
});

it("preserves logout", async () => {
  const screen = render(<AppNavigator />);
  fireEvent.press(screen.getByLabelText("Account"));
  fireEvent.press(screen.getByRole("button", { name: "Log out" }));
  await waitFor(() => expect(mockSignOut).toHaveBeenCalledTimes(1));
  expect(screen.queryByTestId("account-menu")).toBeNull();
});