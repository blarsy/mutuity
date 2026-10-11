import React from "react";
import { fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { AppNavigator, MyHubScreen } from "../../src/navigation/AppNavigator";
import type { MyHubSection } from "../../src/screens/hub/MyHubDashboardScreen";
import { designTokens } from "../../src/theme/tokens";
import { appFontFamilies } from "../../src/theme/fonts";

const mockSignOut = jest.fn().mockResolvedValue(undefined);
const mockNavigate = jest.fn();
const mockAccountId = "11111111-1111-4111-8111-111111111111";

function mockSpoke(title: string, props: any) {
  const React = require("react");
  const { View, Button } = require("react-native");
  const { MyHubScreenHeader } = require("../../src/components/MyHubScreenHeader");
  return React.createElement(View, null,
    React.createElement(MyHubScreenHeader, { title, onBackToHub: props.onBackToHub }),
    props.onAddResource ? React.createElement(Button, { title: "Add resource", onPress: props.onAddResource }) : null,
    props.onGoToOpportunity ? React.createElement(Button, { title: "Resource opportunity", onPress: () => props.onGoToOpportunity("resourceFirstImage") }) : null);
}

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
  MyProfileScreen: (props: any) => mockSpoke("Profile screen", props)
}));
jest.mock("../../src/screens/profile/MyPreferencesScreen", () => ({
  MyPreferencesScreen: (props: any) => mockSpoke("Preferences screen", props)
}));
jest.mock("../../src/screens/economics/MyEconomicsScreen", () => ({
  MyEconomicsScreen: (props: any) => mockSpoke("Economics screen", props)
}));
jest.mock("../../src/screens/resources/MyResourcesScreen", () => ({
  MyResourcesScreen: (props: any) => mockSpoke("Resources screen", props)
}));
jest.mock("../../src/screens/needs/MyNeedsScreen", () => ({
  MyNeedsScreen: (props: any) => mockSpoke("Needs screen", props)
}));
jest.mock("../../src/screens/bids/ReceivedBidsScreen", () => ({
  ReceivedBidsScreen: (props: any) => mockSpoke("Received bids screen", props)
}));
jest.mock("../../src/screens/bids/SentBidsScreen", () => ({
  SentBidsScreen: (props: any) => mockSpoke("Sent bids screen", props)
}));
jest.mock("../../src/screens/claims/MyClaimsScreen", () => ({
  MyClaimsScreen: (props: any) => mockSpoke(`${props.direction} claims screen`, props)
}));
jest.mock("../../src/screens/resources/EditResourceScreen", () => ({
  EditResourceScreen: ({ onBack }: { onBack: () => void }) => {
    const React = require("react");
    const { View, Text, Button } = require("react-native");
    return React.createElement(View, null,
      React.createElement(Text, null, "Edit resource screen"),
      React.createElement(Button, { title: "Cancel editor", onPress: onBack }));
  }
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
  fireEvent.press(screen.getByTestId("my-hub-back-button"));
  fireEvent.press(screen.getByTestId("my-hub-section-myResources"));
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

const sections: Array<[MyHubSection, string]> = [
  ["myResources", "Resources screen"],
  ["receivedBids", "Received bids screen"],
  ["sentBids", "Sent bids screen"],
  ["myNeeds", "Needs screen"],
  ["receivedClaims", "received claims screen"],
  ["sentClaims", "sent claims screen"],
  ["profile", "Profile screen"],
  ["preferences", "Preferences screen"],
  ["contribution", "Economics screen"]
];

it.each(sections)("opens %s directly from the dashboard and returns to Hub", (section, title) => {
  const screen = render(<MyHubScreen authenticated onRequestAuth={jest.fn()} />);
  expect(screen.getByTestId("my-hub-dashboard")).toBeTruthy();
  expect(screen.queryByText("myHubDashboardIntro")).toBeNull();
  for (const [key] of sections) {
    expect(screen.getByTestId(`my-hub-section-${key}`)).toHaveStyle({ width: 100, height: 100 });
  }
  for (const group of ["Resources", "Needs", "Account"]) {
    expect(within(screen.getByTestId(`myHub${group}Group`)).getAllByRole("button")).toHaveLength(3);
  }
  fireEvent.press(screen.getByTestId(`my-hub-section-${section}`));
  expect(screen.getByRole("header", { name: title })).toBeTruthy();
  expect(screen.queryByTestId("my-hub-dashboard")).toBeNull();
  expect(screen.queryByTestId("my-hub-drawer-open-button")).toBeNull();
  fireEvent.press(screen.getByRole("button", { name: "myHubBack" }));
  expect(screen.getByTestId("my-hub-dashboard")).toBeTruthy();
  expect(screen.queryByText(title)).toBeNull();
});

it("keeps editor back within its spoke, then returns to Hub", () => {
  const screen = render(<MyHubScreen authenticated onRequestAuth={jest.fn()} />);
  fireEvent.press(screen.getByTestId("my-hub-section-myResources"));
  fireEvent.press(screen.getByText("Add resource"));
  fireEvent.press(screen.getByText("Cancel editor"));
  expect(screen.getByText("Resources screen")).toBeTruthy();
  fireEvent.press(screen.getByTestId("my-hub-back-button"));
  expect(screen.getByTestId("my-hub-dashboard")).toBeTruthy();
});

it("opens a pending notification destination and can return to Hub", () => {
  const consumed = jest.fn();
  const screen = render(<MyHubScreen authenticated onRequestAuth={jest.fn()}
    pendingSection={{ section: "receivedClaims" }} onConsumePendingSection={consumed} />);
  expect(screen.getByText("received claims screen")).toBeTruthy();
  expect(consumed).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId("my-hub-back-button"));
  expect(screen.getByTestId("my-hub-dashboard")).toBeTruthy();
});

it("preserves contribution opportunity shortcuts without a drawer", () => {
  const screen = render(<MyHubScreen authenticated onRequestAuth={jest.fn()} />);
  fireEvent.press(screen.getByTestId("my-hub-section-contribution"));
  fireEvent.press(screen.getByText("Resource opportunity"));
  expect(screen.getByText("Resources screen")).toBeTruthy();
  fireEvent.press(screen.getByTestId("my-hub-back-button"));
  expect(screen.getByTestId("my-hub-dashboard")).toBeTruthy();
});

it.each([
  { injectedLoading: true },
  { injectedErrorMessage: "Unable to load resources" }
])("keeps the real resource screen's back button available in state %j", (state) => {
  const { MyResourcesScreen: RealMyResourcesScreen } = jest.requireActual("../../src/screens/resources/MyResourcesScreen");
  const back = jest.fn();
  const screen = render(<RealMyResourcesScreen creatorAccountId={mockAccountId}
    onAddResource={jest.fn()} onEditResource={jest.fn()} onBackToHub={back} {...state} />);
  expect(screen.getByRole("header", { name: "My resources" })).toBeTruthy();
  fireEvent.press(screen.getByTestId("my-hub-back-button"));
  expect(back).toHaveBeenCalledTimes(1);
});