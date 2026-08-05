import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import App from "../../src/App";
import * as sessionService from "../../src/services/auth/session";
import * as graphqlAuth from "../../src/services/graphql/auth";

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

jest.mock("../../src/services/graphql/auth", () => ({
  authenticateWithPassword: jest.fn(),
  registerWithSocialIdentity: jest.fn()
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

    jest.spyOn(Linking, "addEventListener").mockImplementation(((eventName: string, handler: (event: { url: string }) => void) => {
      if (eventName === "url") {
        mockUrlHandler.current = handler;
      }

      return { remove: jest.fn() };
    }) as typeof Linking.addEventListener);

    jest.mocked(graphqlAuth.authenticateWithPassword).mockResolvedValue({ accountId: "mock-account-id" } as never);
    jest.mocked(graphqlAuth.registerWithSocialIdentity).mockResolvedValue(undefined as never);

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

    const callbackUrl = "topela://auth/apple/callback?status=register_required&provider=apple&next=%2Fmy-hub&name=Jane%20Doe&email=jane%40example.com&providerSubject=subject-456";
    mockUrlHandler.current?.({ url: callbackUrl });

    await waitFor(() => {
      expect(screen.getByTestId("auth-register-screen")).toBeTruthy();
    });

    fireEvent.changeText(screen.getByTestId("auth-register-full-name"), "Jane Smith");
    fireEvent.changeText(screen.getByTestId("auth-register-email"), "jane.updated@example.com");
    fireEvent.changeText(screen.getByTestId("auth-register-password"), "StrongPass123!");
    fireEvent.changeText(screen.getByTestId("auth-register-confirm-password"), "StrongPass123!");
    fireEvent.press(screen.getByTestId("auth-register-submit"));

    await waitFor(() => {
      expect(graphqlAuth.registerWithSocialIdentity).toHaveBeenCalledWith(expect.objectContaining({
        provider: "apple",
        providerSubject: "subject-456",
        displayName: "Jane Smith",
        identifier: "jane.updated@example.com"
      }));
    });

    expect(graphqlAuth.authenticateWithPassword).toHaveBeenCalled();
    expect(sessionService.setPersistedToken).toHaveBeenCalledWith(expect.any(String));
  });
});
