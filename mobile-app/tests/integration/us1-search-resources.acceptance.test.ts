import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { View } from "react-native";

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
  bootstrapSession: jest.fn().mockResolvedValue({ token: "session-token" }),
  clearPersistedToken: jest.fn(),
  getPersistedToken: jest.fn().mockResolvedValue("session-token"),
  setPersistedToken: jest.fn()
}));

describe("US1 search resources acceptance", () => {
  it("search resources by category and distance", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    expect(screen.queryByPlaceholderText("Search resources")).toBeTruthy();
    expect(screen.queryByLabelText("Category filter")).toBeTruthy();
    expect(screen.queryByLabelText("Distance filter")).toBeTruthy();
  });
});