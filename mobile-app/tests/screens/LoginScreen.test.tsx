import React from "react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import i18n from "../../src/i18n";
import en from "../../src/i18n/locales/en/us1.json";
import fr from "../../src/i18n/locales/fr/us1.json";
import { LoginScreen } from "../../src/screens/auth/LoginScreen";

const resetRequiredError = () => new CombinedGraphQLErrors({
  errors: [{ message: "Password reset is required before sign in.", extensions: { code: "PASSWORD_RESET_REQUIRED" } }]
});

function renderLogin(onSubmit: React.ComponentProps<typeof LoginScreen>["onSubmit"]) {
  const onSwitchToForgotPassword = jest.fn();
  const screen = render(
    <PaperProvider>
      <LoginScreen
        onSubmit={onSubmit}
        onSwitchToForgotPassword={onSwitchToForgotPassword}
        onSwitchToRegister={jest.fn()}
        onDismiss={jest.fn()}
      />
    </PaperProvider>
  );
  fireEvent.changeText(screen.getByTestId("auth-login-email"), "  person@example.com  ");
  fireEvent.changeText(screen.getByTestId("auth-login-password"), "old-password");
  return { ...screen, onSwitchToForgotPassword };
}

describe("LoginScreen password reset guidance", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  it.each(["en", "fr"])("shows localized social-link guidance when a callback updates an already-open login in %s", async (language) => {
    await i18n.changeLanguage(language);
    const props = {
      onSubmit: jest.fn(),
      onSwitchToForgotPassword: jest.fn(),
      onSwitchToRegister: jest.fn(),
      onDismiss: jest.fn()
    };
    const screen = render(<PaperProvider><LoginScreen {...props} /></PaperProvider>);
    fireEvent.changeText(screen.getByTestId("auth-login-password"), "stale-password");
    screen.rerender(<PaperProvider><LoginScreen {...props} initialEmail="person@example.com" socialAuthNotice={{ status: "link_confirmation_required", provider: "apple", email: "person@example.com" }} /></PaperProvider>);
    expect(screen.getByTestId("auth-social-notice")).toHaveTextContent(i18n.t("socialLinkRequiredMessage", { ns: "us1", provider: "Apple", email: "person@example.com" }));
    expect(screen.getByTestId("auth-login-email")).toHaveProp("value", "person@example.com");
    expect(screen.getByTestId("auth-login-password")).toHaveProp("value", "");
  });

  it("shows a recoverable error when opening the provider browser fails", async () => {
    const screen = render(<PaperProvider><LoginScreen
      onSubmit={jest.fn()}
      onSocialSignIn={jest.fn().mockRejectedValue(new Error("cannot open URL"))}
      onSwitchToForgotPassword={jest.fn()}
      onSwitchToRegister={jest.fn()}
      onDismiss={jest.fn()}
    /></PaperProvider>);
    fireEvent.press(screen.getByTestId("auth-social-google"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.socialAuthErrorMessage));
    expect(screen.getByTestId("auth-login-submit")).not.toBeDisabled();
  });

  it.each([["en", en], ["fr", fr]] as const)("explains migrated-account recovery in %s and forwards the email", async (language, copy) => {
    await i18n.changeLanguage(language);
    const onSubmit = jest.fn().mockRejectedValue(resetRequiredError());
    const screen = renderLogin(onSubmit);
    fireEvent.press(screen.getByTestId("auth-login-submit"));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(copy.passwordResetRequiredMessage);
      expect(screen.getByText(copy.passwordResetRequiredButton)).toBeTruthy();
    });
    expect(screen.queryByText(copy.authFailedMessage)).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.onSwitchToForgotPassword).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId("auth-login-reset-password"));
    expect(screen.onSwitchToForgotPassword).toHaveBeenCalledWith("person@example.com");
  });

  it.each([
    new CombinedGraphQLErrors({ errors: [{ message: "Invalid credentials", extensions: { code: "INVALID_CREDENTIALS" } }] }),
    new Error("Network failure"),
    null
  ])("keeps the generic error for other failures (%s)", async (error) => {
    const screen = renderLogin(jest.fn().mockRejectedValue(error));
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.authFailedMessage));
    expect(screen.queryByTestId("auth-login-reset-password")).toBeNull();
  });

  it("handles synchronous coded failures too", async () => {
    const screen = renderLogin(() => {
      throw Object.assign(new Error("Reset required"), { code: "PASSWORD_RESET_REQUIRED" });
    });
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByTestId("auth-login-reset-password")).toBeTruthy());
  });

  it("clears reset guidance when editing credentials or retrying with another failure", async () => {
    const onSubmit = jest.fn()
      .mockRejectedValueOnce(resetRequiredError())
      .mockRejectedValueOnce(resetRequiredError())
      .mockRejectedValueOnce(new Error("Invalid credentials"));
    const screen = renderLogin(onSubmit);
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByTestId("auth-login-reset-password")).toBeTruthy());

    fireEvent.changeText(screen.getByTestId("auth-login-email"), "another@example.com");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("auth-login-reset-password")).toBeNull();

    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByTestId("auth-login-reset-password")).toBeTruthy());
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(en.authFailedMessage));
    expect(screen.queryByTestId("auth-login-reset-password")).toBeNull();
  });

  it("does not show recovery guidance after a successful login", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const screen = renderLogin(onSubmit);
    fireEvent.press(screen.getByTestId("auth-login-submit"));
    await waitFor(() => expect(screen.getByTestId("auth-login-submit")).not.toBeDisabled());
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByTestId("auth-login-reset-password")).toBeNull();
  });
});