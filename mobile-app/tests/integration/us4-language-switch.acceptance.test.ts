import React from "react";
import { render, waitFor } from "@testing-library/react-native";

import i18n from "../../src/i18n";
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

describe("US4 language switch acceptance", () => {
  afterEach(async () => {
    // Reset language to English after each test
    await i18n.changeLanguage("en");
  });

  it("renders main navigation in default English", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });

  it("switches language from English to French and updates key labels", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    // Verify English labels are present initially
    expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();

    // Switch to French
    await i18n.changeLanguage("fr");

    await waitFor(() => {
      // After language switch, the header should show French text
      expect(screen.getByRole("header", { name: "Explorer" })).toBeTruthy();
    });

    // Switch back to English
    await i18n.changeLanguage("en");

    await waitFor(() => {
      expect(screen.getByRole("header", { name: "Explore" })).toBeTruthy();
    });
  });

  it("preserves language preference across re-renders", async () => {
    // Set language to French before rendering
    await i18n.changeLanguage("fr");
    expect(i18n.language).toBe("fr");

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Navigation principale")).toBeTruthy();
    });
  });
});