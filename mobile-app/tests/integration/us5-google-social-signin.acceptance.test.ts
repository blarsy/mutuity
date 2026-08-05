import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";

import App from "../../src/App";
import * as graphqlAuth from "../../src/services/graphql/auth";
import * as sessionService from "../../src/services/auth/session";

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

describe("US5 Google social signin acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("signs returning users in directly from a Google success callback", async () => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    jest.spyOn(Linking, "addEventListener").mockImplementation(((eventName: string, handler: (event: { url: string }) => void) => {
      if (eventName === "url") {
        mockUrlHandler.current = handler;
      }

      return { remove: jest.fn() };
    }) as typeof Linking.addEventListener);

    jest.mocked(graphqlAuth.authenticateWithPassword).mockResolvedValue({ accountId: "mock-account-id" } as never);

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

    const callbackUrl = "topela://auth/google/callback?status=success&provider=google&next=%2Fmy-hub&sessionToken=returned-session-token";
    mockUrlHandler.current?.({ url: callbackUrl });

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    expect(sessionService.setPersistedToken).toHaveBeenCalledWith("returned-session-token");
  });
});
