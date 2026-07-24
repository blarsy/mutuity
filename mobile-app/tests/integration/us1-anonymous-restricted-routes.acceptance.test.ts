import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { View } from "react-native";

import App from "../../src/App";
import { mainScreenRegistry } from "../../src/navigation/mainScreenRegistry";
import { resolveAnonymousRoute } from "../../src/navigation/US1Navigator";

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
  clearPersistedToken: jest.fn(),
  getPersistedToken: jest.fn().mockResolvedValue(null),
  setPersistedToken: jest.fn()
}));

jest.mock("../../src/services/graphql/auth", () => ({
  authenticateWithPassword: jest.fn().mockResolvedValue({
    accountId: "123e4567-e89b-12d3-a456-426614174000"
  })
}));

jest.mock("../../src/screens/resources/MyResourcesScreen", () => ({
  MyResourcesScreen: () => {
    const mockReact = require("react");
    const { View } = require("react-native");

    return mockReact.createElement(View, { testID: "my-resources-screen" });
  }
}));

const hiddenAnonymousRoutes = ["MyProfile", "MyPreferences", "MyEconomics"] as const;
const allowedAnonymousFallbackRoute = "SearchResources";

describe("US1 anonymous restricted routes acceptance", () => {
  it("blocks anonymous deep links to profile, preferences, and contribution and reroutes to an allowed surface", () => {
    const restrictedEntries = mainScreenRegistry.filter((entry) =>
      hiddenAnonymousRoutes.includes(entry.routeName as (typeof hiddenAnonymousRoutes)[number])
    );

    expect(restrictedEntries.map((entry) => entry.label)).toEqual([
      "My profile",
      "My preferences",
      "Contribution"
    ]);

    expect(resolveAnonymousRoute("MyProfile")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousRoute("MyPreferences")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousRoute("MyEconomics")).toBe(allowedAnonymousFallbackRoute);
    expect(resolveAnonymousRoute("SearchResources")).toBe("SearchResources");
    expect(resolveAnonymousRoute("SearchNeeds")).toBe("SearchNeeds");
  });

  it("returns to the originally requested protected tab after login", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    expect(screen.getByRole("header", { name: "My Hub" })).toBeTruthy();
    const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
    fireEvent.press(signInButtons[0]);

    expect(screen.getAllByRole("header", { name: "Sign in" }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Email")).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText("Email"), "agent@example.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "secret-password");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByTestId("my-resources-screen")).toBeTruthy();
    });
  });

  it("shows an authentication error message when login fails", async () => {
    const authModule = require("../../src/services/graphql/auth") as {
      authenticateWithPassword: jest.Mock;
    };
    authModule.authenticateWithPassword.mockRejectedValueOnce(new Error("invalid credentials"));

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
    fireEvent.press(signInButtons[0]);

    fireEvent.changeText(screen.getByLabelText("Email"), "agent@example.com");
    fireEvent.changeText(screen.getByLabelText("Password"), "wrong-password");
    fireEvent.press(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeTruthy();
      expect(screen.getByText("Sign in failed. Please verify your credentials and try again.")).toBeTruthy();
    });
  });
});