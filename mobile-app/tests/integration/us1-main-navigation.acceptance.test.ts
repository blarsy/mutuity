import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import App from "../../src/App";

jest.mock("@react-navigation/native", () => {
  const mockReact = require("react");

  return {
    DefaultTheme: {
      colors: {
        background: "#ffffff",
        border: "#000000",
        card: "#ffffff",
        notification: "#ff0000",
        primary: "#000000",
        text: "#000000"
      },
      dark: false,
      fonts: {}
    },
    NavigationContainer: ({ children }: { children: React.ReactNode }) =>
      mockReact.createElement(mockReact.Fragment, null, children),
    useNavigationContainerRef: () => ({ current: null, navigate: jest.fn() })
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
  getPersistedAccountId: jest.fn().mockResolvedValue(null),
  getPersistedToken: jest.fn().mockResolvedValue("session-token"),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn(),
  setPersistedToken: jest.fn()
}));

describe("US1 main navigation acceptance", () => {
  it("returning user opens app and lands on main navigation", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });
});