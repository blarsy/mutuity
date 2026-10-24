import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { mockLinkingUrlListener } from "../utils/mockLinkingUrlListener";

import App from "../../src/App";
import { authenticateWithPassword, requestPasswordReset } from "../../src/services/graphql/auth";

jest.mock("../../src/services/graphql/auth", () => ({
  authenticateWithPassword: jest.fn(),
  registerWithSocialIdentity: jest.fn(),
  requestPasswordReset: jest.fn()
}));

jest.mock("@react-navigation/native", () => {
  const mockReact = require("react");

  return {
    useNavigationContainerRef: () => ({ current: null, navigate: jest.fn() }),
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
  bootstrapSession: jest.fn().mockResolvedValue({ token: null }),
  clearPersistedToken: jest.fn(),
  getPersistedAccountId: jest.fn().mockResolvedValue(null),
  getPersistedLanguage: jest.fn().mockResolvedValue(null),
  getPersistedToken: jest.fn().mockResolvedValue(null),
  setPersistedAccountId: jest.fn(),
  setPersistedLanguage: jest.fn(),
  setPersistedToken: jest.fn()
}));

describe("US5 social password-reset-required acceptance", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Linking, "getInitialURL").mockResolvedValue(null);
    jest.spyOn(Linking, "openURL").mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("guides a migrated password-login user through requesting a reset with their email prefilled", async () => {
    (authenticateWithPassword as jest.Mock).mockRejectedValue(new CombinedGraphQLErrors({
      errors: [{ message: "Password reset is required before sign in.", extensions: { code: "PASSWORD_RESET_REQUIRED" } }]
    }));
    (requestPasswordReset as jest.Mock).mockResolvedValue(undefined);
    const screen = render(React.createElement(App));

    await waitFor(() => expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0));
    fireEvent.press(screen.getAllByRole("button", { name: "Sign in" })[0]);
    fireEvent.changeText(screen.getByTestId("auth-login-email"), "  person@example.com  ");
    fireEvent.changeText(screen.getByTestId("auth-login-password"), "old-password");
    fireEvent.press(screen.getByTestId("auth-login-submit"));

    await waitFor(() => expect(screen.getByTestId("auth-login-reset-password")).toBeTruthy());
    fireEvent.press(screen.getByTestId("auth-login-reset-password"));
    expect(screen.getByTestId("auth-forgot-password-email")).toHaveProp("value", "person@example.com");
    expect(requestPasswordReset).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("auth-forgot-submit"));

    await waitFor(() => {
      expect(requestPasswordReset).toHaveBeenCalledWith("person@example.com");
      expect(screen.getByText(/If an account exists for this email/)).toBeTruthy();
    });
  });

  it("routes users into the forgot-password flow for a password_reset_required callback", async () => {
    const mockUrlHandler = { current: null as ((event: { url: string }) => void) | null };

    mockLinkingUrlListener(mockUrlHandler);

    const screen = render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByLabelText("Main navigation")).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0);
    });

    fireEvent.press(screen.getAllByRole("button", { name: "Sign in" })[0]);

    await waitFor(() => {
      expect(screen.getByTestId("auth-login-screen")).toBeTruthy();
    });

    fireEvent.press(screen.getByTestId("auth-social-google"));

    mockUrlHandler.current?.({ url: "topela://auth/google/callback?status=password_reset_required&provider=google&next=%2Fmy-hub&error=password-reset-required" });

    await waitFor(() => {
      expect(screen.getByTestId("auth-forgot-password-screen")).toBeTruthy();
    });
  });
});
