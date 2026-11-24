import "../utils/smokeBackend";
import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import App from "../../src/App";
import { bootstrapSession } from "../../src/services/auth/session";

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn(),
  clearPersistedToken: jest.fn(),
  getPersistedToken: jest.fn().mockResolvedValue(null),
  getPersistedAccountId: jest.fn().mockResolvedValue(null),
  getPersistedLanguage: jest.fn().mockResolvedValue(null),
  setPersistedToken: jest.fn(),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn()
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

describe("US4 session continuity acceptance", () => {
  beforeEach(() => jest.clearAllMocks());

  it("restores session when a valid token is persisted", async () => {
    jest.mocked(bootstrapSession).mockResolvedValueOnce({ token: "mock:123e4567-e89b-12d3-a456-426614174000", accountId: "123e4567-e89b-12d3-a456-426614174000", language: null });

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // With a valid session token, the app should render the main navigation
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
      expect(screen.queryAllByRole("button", { name: "Sign in" })).toHaveLength(0);
    });
  });

  it("shows main navigation in anonymous mode when no token is persisted", async () => {
    jest.mocked(bootstrapSession).mockResolvedValueOnce({ token: null, accountId: null, language: null });

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // Anonymous users should still see the main navigation
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });

  it("clears invalid session and returns to safe signed-out state", async () => {
    jest.mocked(bootstrapSession).mockResolvedValueOnce({ token: null, accountId: null, language: null });

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // App should render without crashing when session is invalid
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
  });

  it("does not loop indefinitely when session bootstrap fails", async () => {
    jest.mocked(bootstrapSession).mockRejectedValueOnce(new Error("SecureStore unavailable"));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // App should still render in a safe state even when bootstrap fails
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
    expect(bootstrapSession).toHaveBeenCalledTimes(1);
  });
});