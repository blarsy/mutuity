import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import App from "../../src/App";

jest.mock("@react-navigation/native", () => {
  const mockReact = require("react");

  return {
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
  getPersistedToken: jest.fn().mockResolvedValue(null),
  setPersistedToken: jest.fn()
}));

describe("US5 social password-reset-required acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("routes users into the forgot-password flow for a password_reset_required callback", async () => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    jest.spyOn(Linking, "addEventListener").mockImplementation(((eventName: string, handler: (event: { url: string }) => void) => {
      if (eventName === "url") {
        mockUrlHandler.current = handler;
      }

      return { remove: jest.fn() };
    }) as typeof Linking.addEventListener);

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

    mockUrlHandler.current?.({ url: "topela://auth/google/callback?status=password_reset_required&provider=google&next=%2Fmy-hub&error=password-reset-required" });

    await waitFor(() => {
      expect(screen.getByTestId("auth-forgot-password-screen")).toBeTruthy();
    });
  });
});
