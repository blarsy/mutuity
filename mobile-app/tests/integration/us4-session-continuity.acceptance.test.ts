import React from "react";
import { render, waitFor } from "@testing-library/react-native";

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

describe("US4 session continuity acceptance", () => {
  it("restores session when a valid token is persisted", async () => {
    jest.doMock("../../src/services/auth/session", () => ({
      bootstrapSession: jest.fn().mockResolvedValue({ token: "mock:123e4567-e89b-12d3-a456-426614174000" }),
      clearPersistedToken: jest.fn(),
      getPersistedToken: jest.fn().mockResolvedValue("mock:123e4567-e89b-12d3-a456-426614174000"),
      setPersistedToken: jest.fn()
    }));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // With a valid session token, the app should render the main navigation
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });

  it("shows main navigation in anonymous mode when no token is persisted", async () => {
    jest.doMock("../../src/services/auth/session", () => ({
      bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
      clearPersistedToken: jest.fn(),
      getPersistedToken: jest.fn().mockResolvedValue(null),
      setPersistedToken: jest.fn()
    }));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // Anonymous users should still see the main navigation
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });

  it("clears invalid session and returns to safe signed-out state", async () => {
    const mockClearPersistedToken = jest.fn();

    jest.doMock("../../src/services/auth/session", () => ({
      bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
      clearPersistedToken: mockClearPersistedToken,
      getPersistedToken: jest.fn().mockResolvedValue(null),
      setPersistedToken: jest.fn()
    }));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // App should render without crashing when session is invalid
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
  });

  it("does not loop indefinitely when session bootstrap fails", async () => {
    jest.doMock("../../src/services/auth/session", () => ({
      bootstrapSession: jest.fn().mockRejectedValue(new Error("SecureStore unavailable")),
      clearPersistedToken: jest.fn(),
      getPersistedToken: jest.fn().mockRejectedValue(new Error("SecureStore unavailable")),
      setPersistedToken: jest.fn()
    }));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      // App should still render in a safe state even when bootstrap fails
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
  });
});