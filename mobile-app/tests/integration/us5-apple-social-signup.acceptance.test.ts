import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { mockLinkingUrlListener } from "../utils/mockLinkingUrlListener";

import App from "../../src/App";
import * as sessionService from "../../src/services/auth/session";
import * as graphqlAuth from "../../src/services/graphql/auth";
import * as socialRegistration from "../../src/services/socialAuth/completeRegistration";

jest.mock("@react-native-community/netinfo", () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
    fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true })
  }
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

jest.mock("../../src/services/graphql/auth", () => ({
  authenticateWithPassword: jest.fn(),
  registerWithPassword: jest.fn()
}));

jest.mock("../../src/services/socialAuth/completeRegistration", () => ({
  completeMobileSocialRegistration: jest.fn()
}));

describe("US5 Apple social signup acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("opens the registration completion flow for an Apple signup callback", async () => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    mockLinkingUrlListener(mockUrlHandler);

    jest.mocked(socialRegistration.completeMobileSocialRegistration).mockResolvedValue({
      sessionToken: "mobile-session-token",
      accountId: "123e4567-e89b-12d3-a456-426614174000",
      next: "/my-hub"
    });

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

    fireEvent.press(screen.getByTestId("auth-social-apple"));

    const callbackUrl = "topela://auth/apple/callback?status=register_required&provider=apple&next=%2Fmy-hub&name=Jane%20Doe&email=jane%40example.com&providerSubject=subject-456&providerEmailVerified=true&pendingRegistrationToken=signed-registration";
    mockUrlHandler.current?.({ url: callbackUrl });

    await waitFor(() => {
      expect(screen.getByTestId("auth-register-screen")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId("auth-register-full-name"), "Jane Smith");
    fireEvent.press(screen.getByTestId("auth-register-submit"));

    await waitFor(() => {
      expect(socialRegistration.completeMobileSocialRegistration).toHaveBeenCalledWith(expect.objectContaining({
        pendingRegistrationToken: "signed-registration",
        displayName: "Jane Smith",
        identifier: "jane@example.com"
      }));
    });
    expect(socialRegistration.completeMobileSocialRegistration).not.toHaveBeenCalledWith(expect.objectContaining({ password: expect.any(String) }));

    expect(graphqlAuth.authenticateWithPassword).not.toHaveBeenCalled();
    expect(sessionService.setPersistedToken).toHaveBeenCalledWith("mobile-session-token");
  });
});
