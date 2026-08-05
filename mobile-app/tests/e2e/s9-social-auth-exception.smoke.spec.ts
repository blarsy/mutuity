import React from "react";
import { render, waitFor } from "@testing-library/react-native";
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

describe("S9 social auth exception smoke", () => {
  it("keeps the app shell stable for an invalid callback", async () => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "addEventListener").mockImplementation(((eventName: string, handler: (event: { url: string }) => void) => {
      if (eventName === "url") {
        mockUrlHandler.current = handler;
      }

      return { remove: jest.fn() };
    }) as typeof Linking.addEventListener);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    mockUrlHandler.current?.({ url: "topela://auth/google/callback?status=error&provider=google&next=%2Fexplore&error=invalid-state" });

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });
  });
});
