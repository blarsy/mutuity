import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { mockLinkingUrlListener } from "../utils/mockLinkingUrlListener";

import App from "../../src/App";
import { authenticateWithPassword } from "../../src/services/graphql/auth";
import { confirmPendingSocialLink, SocialLinkConfirmationError } from "../../src/services/socialAuth/confirmLink";
import { setPersistedToken } from "../../src/services/auth/session";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
  }
}));

jest.mock("../../src/services/graphql/auth", () => ({
  authenticateWithPassword: jest.fn(),
  fetchAccountSnapshotById: jest.fn().mockResolvedValue(null),
  registerWithSocialIdentity: jest.fn(),
  requestPasswordReset: jest.fn().mockResolvedValue(undefined)
}));

jest.mock("../../src/services/socialAuth/confirmLink", () => ({
  ...jest.requireActual("../../src/services/socialAuth/confirmLink"),
  confirmPendingSocialLink: jest.fn()
}));

jest.mock("@react-navigation/native", () => {
  const mockReact = require("react");

  return {
    useNavigationContainerRef: () => ({ current: null, navigate: jest.fn() }),
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(mockReact.Fragment, null, children)
  };
});

jest.mock("@react-navigation/native-stack", () => {
  const mockReact = require("react");
  const { View } = require("react-native");

  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: { children: React.ReactNode }) =>
        mockReact.createElement(mockReact.Fragment, null, children),
      Screen: ({ component: Component }: { component: React.ComponentType }) =>
        mockReact.createElement(View, null, mockReact.createElement(Component))
    })
  };
});

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
  clearPersistedToken: jest.fn(),
  getPersistedAccountId: jest.fn().mockResolvedValue(null),
  getPersistedLanguage: jest.fn().mockResolvedValue(null),
  getPersistedToken: jest.fn().mockResolvedValue(null),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn(),
  setPersistedToken: jest.fn()
}));

describe("US5 social link-required acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authenticateWithPassword as jest.Mock).mockResolvedValue({ accountId: "123e4567-e89b-12d3-a456-426614174000" });
    (confirmPendingSocialLink as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not show social errors on normal startup or unrelated deep links", async () => {
    jest.mocked(Linking.getInitialURL).mockResolvedValue("topela://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081");
    const handler = { current: null as ((event: { url: string }) => void) | null };
    mockLinkingUrlListener(handler);
    const screen = render(React.createElement(App));
    await waitFor(() => expect(screen.getByLabelText("Main navigation")).toBeTruthy());
    expect(screen.queryByTestId("auth-login-screen")).toBeNull();
    fireEvent.press(screen.getAllByRole("button", { name: "Sign in" })[0]);
    expect(screen.queryByTestId("auth-social-notice")).toBeNull();
    fireEvent.changeText(screen.getByTestId("auth-login-email"), "person@example.com");
    act(() => handler.current?.({ url: "topela://resources/123?status=error" }));
    expect(screen.queryByTestId("auth-social-notice")).toBeNull();
    expect(screen.getByTestId("auth-login-email")).toHaveProp("value", "person@example.com");
  });

  it.each(["google", "apple"])("explains and completes %s linking after password login, preserving context through recovery", async (provider) => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    mockLinkingUrlListener(mockUrlHandler);

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByRole("button", { name: "Sign in" })[0]);

    await waitFor(() => {
      expect(screen.getByTestId("auth-login-screen")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("auth-social-google"));

    act(() => mockUrlHandler.current?.({ url: `topela://auth/${provider}/callback?status=link_confirmation_required&provider=${provider}&next=%2Fmy-hub&email=person%40example.com&pendingLinkToken=signed-link` }));

    await waitFor(() => {
      expect(screen.getByTestId("auth-login-screen")).toBeTruthy();
      expect(screen.getByTestId("auth-social-notice")).toHaveTextContent(/Sign in with your password to link/);
      expect(screen.getByTestId("auth-social-notice")).toHaveTextContent(provider === "apple" ? /Apple/ : /Google/);
      expect(screen.getByTestId("auth-login-email")).toHaveProp("value", "person@example.com");
    });
    expect(confirmPendingSocialLink).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText("Forgot password"));
    expect(screen.getByTestId("auth-forgot-password-email")).toHaveProp("value", "person@example.com");
    fireEvent.press(screen.getByText("Back"));
    expect(screen.getByTestId("auth-social-notice")).toHaveTextContent(/Sign in with your password to link/);
    fireEvent.changeText(screen.getByTestId("auth-login-password"), "new-password");
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(confirmPendingSocialLink).toHaveBeenCalledWith("signed-link"));
    await waitFor(() => expect(screen.queryByTestId("auth-login-screen")).toBeNull());
    expect(authenticateWithPassword).toHaveBeenCalledWith({ email: "person@example.com", password: "new-password" });
    expect((authenticateWithPassword as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((confirmPendingSocialLink as jest.Mock).mock.invocationCallOrder[0]!);
    expect((confirmPendingSocialLink as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((setPersistedToken as jest.Mock).mock.invocationCallOrder[0]!);
  });

  it("keeps link failures visible and allows a fresh social attempt", async () => {
    (confirmPendingSocialLink as jest.Mock).mockRejectedValue(new SocialLinkConfirmationError());
    const handler = { current: null as ((event: { url: string }) => void) | null };
    mockLinkingUrlListener(handler);
    const screen = render(React.createElement(App));
    await waitFor(() => expect(screen.getByLabelText("Main navigation")).toBeTruthy());
    act(() => handler.current?.({ url: "topela://auth/google/callback?status=link_confirmation_required&email=person%40example.com&pendingLinkToken=expired" }));
    await waitFor(() => expect(screen.getByTestId("auth-login-email")).toHaveProp("value", "person@example.com"));
    fireEvent.changeText(screen.getByTestId("auth-login-password"), "password");
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByText(/Your password was accepted/)).toBeTruthy());
    expect(setPersistedToken).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("auth-social-google"));
    await waitFor(() => expect(Linking.openURL).toHaveBeenCalled());
  });

  it.each(["error", "cancelled"])("shows a recoverable %s callback instead of silently returning", async (status) => {
    const handler = { current: null as ((event: { url: string }) => void) | null };
    mockLinkingUrlListener(handler);
    const screen = render(React.createElement(App));
    await waitFor(() => expect(screen.getByLabelText("Main navigation")).toBeTruthy());
    act(() => handler.current?.({ url: `topela://auth/apple/callback?status=${status}&error=untrusted-provider-detail` }));
    await waitFor(() => expect(screen.getByTestId("auth-social-notice")).toHaveTextContent(status === "cancelled" ? /was cancelled/ : /couldn't be completed/));
    expect(screen.queryByText("untrusted-provider-detail")).toBeNull();
    expect(setPersistedToken).not.toHaveBeenCalled();
  });
});
