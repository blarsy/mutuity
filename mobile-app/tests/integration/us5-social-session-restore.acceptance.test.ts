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

describe("US5 social session restore acceptance", () => {
  it("restores the signed-in shell after a social token is persisted", async () => {
    jest.doMock("../../src/services/auth/session", () => ({
      bootstrapSession: jest.fn().mockResolvedValue({ token: "session-token-from-social-auth" }),
      clearPersistedToken: jest.fn(),
      getPersistedToken: jest.fn().mockResolvedValue("session-token-from-social-auth"),
      setPersistedToken: jest.fn()
    }));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
  });
});
