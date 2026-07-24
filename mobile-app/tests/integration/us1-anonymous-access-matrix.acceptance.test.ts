import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import App from "../../src/App";
import { mainScreenRegistry } from "../../src/navigation/mainScreenRegistry";
import { isRestrictedMainScreen } from "../../src/navigation/US1Navigator";

jest.mock("../../src/services/auth/session", () => ({
  bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
  clearPersistedToken: jest.fn(),
  getPersistedToken: jest.fn().mockResolvedValue(null),
  setPersistedToken: jest.fn()
}));

type AnonymousBehavior = "allowed" | "loginPrompt" | "hidden";

const anonymousBehaviorByLabel: Record<string, AnonymousBehavior> = {
  "Search resources": "allowed",
  "Search needs": "allowed",
  "My resources": "loginPrompt",
  "My needs": "loginPrompt",
  "My bids": "loginPrompt",
  "My claims": "loginPrompt",
  Chat: "loginPrompt",
  Notifications: "loginPrompt",
  "My campaigns": "loginPrompt",
  "My profile": "hidden",
  "My preferences": "hidden",
  Contribution: "hidden"
} as const;

describe("US1 anonymous access matrix acceptance", () => {
  it("keeps browse-only screens accessible and restricted surfaces gated for anonymous users", () => {
    expect(mainScreenRegistry.map((entry) => entry.label)).toEqual([
      "Search resources",
      "Search needs",
      "My resources",
      "My needs",
      "My bids",
      "My claims",
      "Chat",
      "Notifications",
      "My campaigns",
      "My profile",
      "My preferences",
      "Contribution"
    ]);

    const matrix = mainScreenRegistry.map((entry) => ({
      label: entry.label,
      routeName: entry.routeName,
      anonymousBehavior: anonymousBehaviorByLabel[entry.label]
    }));

    expect(matrix).toEqual([
      { label: "Search resources", routeName: "SearchResources", anonymousBehavior: "allowed" },
      { label: "Search needs", routeName: "SearchNeeds", anonymousBehavior: "allowed" },
      { label: "My resources", routeName: "MyResources", anonymousBehavior: "loginPrompt" },
      { label: "My needs", routeName: "MyNeeds", anonymousBehavior: "loginPrompt" },
      { label: "My bids", routeName: "MyBids", anonymousBehavior: "loginPrompt" },
      { label: "My claims", routeName: "MyClaims", anonymousBehavior: "loginPrompt" },
      { label: "Chat", routeName: "Chat", anonymousBehavior: "loginPrompt" },
      { label: "Notifications", routeName: "Notifications", anonymousBehavior: "loginPrompt" },
      { label: "My campaigns", routeName: "MyCampaigns", anonymousBehavior: "loginPrompt" },
      { label: "My profile", routeName: "MyProfile", anonymousBehavior: "hidden" },
      { label: "My preferences", routeName: "MyPreferences", anonymousBehavior: "hidden" },
      { label: "Contribution", routeName: "MyEconomics", anonymousBehavior: "hidden" }
    ]);

    expect(mainScreenRegistry.filter((entry) => isRestrictedMainScreen(entry.routeName)).map((entry) => entry.label)).toEqual([
      "My resources",
      "My needs",
      "My bids",
      "My claims",
      "Chat",
      "Notifications",
      "My campaigns",
      "My profile",
      "My preferences",
      "Contribution"
    ]);
  });

  it("opens the restricted-surface auth entry from a protected tab for anonymous users", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    expect(screen.getByRole("header", { name: "My Hub" })).toBeTruthy();
    const signInButtons = screen.getAllByRole("button", { name: "Sign in" });
    expect(signInButtons.length).toBeGreaterThan(0);
    const createAccountButtons = screen.getAllByRole("button", { name: "Create account" });
    expect(createAccountButtons.length).toBeGreaterThan(0);

    fireEvent.press(signInButtons[0]);
    expect(screen.getAllByRole("header", { name: "Sign in" }).length).toBeGreaterThan(0);

    fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getAllByRole("header", { name: "Create account" }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("opens the auth entry from the anonymous top-right account icon", async () => {
    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    fireEvent.press(screen.getByLabelText("Account"));

    expect(screen.getAllByRole("header", { name: "Sign in" }).length).toBeGreaterThan(0);

    fireEvent.press(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getAllByRole("header", { name: "Create account" }).length).toBeGreaterThan(0);
  });
});