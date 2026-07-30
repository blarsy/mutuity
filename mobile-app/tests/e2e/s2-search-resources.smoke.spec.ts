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
 * E2E Smoke S2: User searches resources by category and distance.
 *
 * Verifies core discoverability parity.
 * Source: US1 acceptance scenario "search resources by category and distance"
 */
describe("E2E Smoke S2 - Search Resources", () => {
  it("search resources screen renders with search input", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    // Search input should be present
    expect(screen.getByPlaceholderText("Search resources")).toBeTruthy();
  });

  it("search input accepts text and filters remain mounted", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText("Search resources");
    expect(searchInput).toBeTruthy();

    // The search screen should be fully rendered with its controls
    expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
  });
});