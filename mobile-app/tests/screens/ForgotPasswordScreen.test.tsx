import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { ForgotPasswordScreen } from "../../src/screens/auth/ForgotPasswordScreen";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

describe("ForgotPasswordScreen", () => {
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

    fireEvent.press(screen.getAllByRole("button", { name: "backToSignIn" })[0]);
    expect(onSwitchToSignIn).toHaveBeenCalledTimes(1);
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
  });
});
