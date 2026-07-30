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

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn().mockResolvedValue({ token: "mock:123e4567-e89b-12d3-a456-426614174000", language: null }),
  clearPersistedToken: jest.fn(),
  getPersistedToken: jest.fn().mockResolvedValue("mock:123e4567-e89b-12d3-a456-426614174000"),
  setPersistedToken: jest.fn(),
  getPersistedLanguage: jest.fn().mockResolvedValue(null),
  setPersistedLanguage: jest.fn()
}));

/**
 * E2E Smoke S1: Returning user opens app and lands on main navigation.
 *
 * Verifies base continuity and auth/session integrity.
 * Source: US1 acceptance scenario "returning user opens app and lands on main navigation"
 */
describe("E2E Smoke S1 - Main Navigation", () => {
  it("authenticated user lands on main navigation with header visible", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    // Header should show Explore by default
    expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
  });

  it("session token resolves to authenticated state", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    // Authenticated users should see the account menu anchor (not sign-in prompt)
    expect(screen.getByLabelText("Account")).toBeTruthy();
  });
});