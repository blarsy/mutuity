import React from "react";
import { act, fireEvent, render, waitFor, within } from "@testing-library/react-native";
import { PaperProvider, Snackbar } from "react-native-paper";

import { ForgotPasswordScreen } from "../../src/screens/auth/ForgotPasswordScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe("ForgotPasswordScreen", () => {
  it("prefills the email carried from login and submits it without re-entry", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <PaperProvider>
        <ForgotPasswordScreen initialEmail="person@example.com" onSubmit={onSubmit} onDismiss={() => undefined} />
      </PaperProvider>
    );

    expect(screen.getByTestId("auth-forgot-password-email")).toHaveProp("value", "person@example.com");
    fireEvent.press(screen.getByTestId("auth-forgot-submit"));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ email: "person@example.com" }));
  });

  it("submits the email and shows snackbar feedback with a sign-in action", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onSwitchToSignIn = jest.fn();
    const screen = render(
      <PaperProvider>
        <ForgotPasswordScreen onSubmit={onSubmit} onSwitchToSignIn={onSwitchToSignIn} onDismiss={() => undefined} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByTestId("auth-forgot-password-email"), "  person@example.com  ");
    fireEvent.press(screen.getByTestId("auth-forgot-submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ email: "person@example.com" });
      expect(screen.getByText("forgotPasswordSuccessMessage")).toBeTruthy();
    });

    expect(screen.getByTestId("auth-forgot-feedback")).toHaveStyle({ backgroundColor: "#dff2e3" });
    expect(screen.getByTestId("auth-forgot-success-icon", { includeHiddenElements: true })).toBeTruthy();
    expect(within(screen.getByTestId("auth-forgot-password-screen")).queryByTestId("auth-forgot-feedback")).toBeNull();
    const signInButtons = screen.getAllByRole("button", { name: "backToSignIn" });
    fireEvent.press(signInButtons[signInButtons.length - 1]);
    expect(onSwitchToSignIn).toHaveBeenCalledTimes(1);
  });

  it("keeps the send button disabled after success even when feedback is dismissed", async () => {
    jest.useFakeTimers();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const screen = render(
      <PaperProvider>
        <ForgotPasswordScreen onSubmit={onSubmit} onDismiss={() => undefined} />
      </PaperProvider>
    );

    const sendButton = screen.getByTestId("auth-forgot-submit");
    expect(sendButton).toBeEnabled();
    fireEvent.press(sendButton);
    await waitFor(() => expect(sendButton).toBeDisabled());
    await waitFor(() => expect(screen.getByText("forgotPasswordSuccessMessage")).toBeTruthy());
    fireEvent(screen.UNSAFE_getByType(Snackbar), "dismiss");
    expect(screen.UNSAFE_getByType(Snackbar).props.visible).toBe(false);
    expect(sendButton).toBeDisabled();
    fireEvent.press(sendButton);
    expect(onSubmit).toHaveBeenCalledTimes(1);
    act(() => jest.runOnlyPendingTimers());
    jest.useRealTimers();
  });

  it("shows an error snackbar when the recovery request fails", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("network failure"));
    const screen = render(
      <PaperProvider>
        <ForgotPasswordScreen onSubmit={onSubmit} onSwitchToSignIn={() => undefined} onDismiss={() => undefined} />
      </PaperProvider>
    );

    fireEvent.changeText(screen.getByTestId("auth-forgot-password-email"), "person@example.com");
    fireEvent.press(screen.getByTestId("auth-forgot-submit"));

    await waitFor(() => {
      expect(screen.getByText("forgotPasswordErrorMessage")).toBeTruthy();
    });
    expect(screen.queryByTestId("auth-forgot-success-icon", { includeHiddenElements: true })).toBeNull();
    expect(within(screen.getByTestId("auth-forgot-password-screen")).queryByTestId("auth-forgot-feedback")).toBeNull();
    expect(screen.getByTestId("auth-forgot-submit")).toBeEnabled();
  });
});
