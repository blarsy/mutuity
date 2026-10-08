import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { PaperProvider } from "react-native-paper";

import { GiftTokensButton, GiftTokensDialog, parseGiftAmount } from "../../src/components/contribution/GiftTokensButton";
import { useCurrentAccount } from "../../src/services/auth/useCurrentAccount";
import { giftTokens, getGiftErrorMessage } from "../../src/services/graphql/contribution";
import i18n from "../../src/i18n";

jest.mock("../../src/services/auth/useCurrentAccount", () => ({ useCurrentAccount: jest.fn() }));
jest.mock("../../src/services/graphql/contribution", () => ({ giftTokens: jest.fn(), getGiftErrorMessage: jest.fn() }));

function renderDialog(onClose = jest.fn()) {
  return render(
    <PaperProvider>
      <GiftTokensDialog recipientAccountId="recipient" recipientDisplayName="Nora" onClose={onClose} />
    </PaperProvider>
  );
}

describe("mobile token gifting", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage("en");
    (useCurrentAccount as jest.Mock).mockReturnValue({ authenticated: true, accountId: "sender" });
    (giftTokens as jest.Mock).mockResolvedValue(undefined);
    (getGiftErrorMessage as jest.Mock).mockReturnValue("Insufficient token balance.");
  });

  it.each(["", " ", "0", "-1", "1.5", "NaN", "Infinity", "2147483648"])("rejects invalid amounts: %j", value => {
    expect(parseGiftAmount(value)).toBeNull();
  });

  it.each([["1", 1], [" 12 ", 12], ["2147483647", 2147483647]])("accepts valid integer amounts: %s", (value, expected) => {
    expect(parseGiftAmount(String(value))).toBe(expected);
  });

  it.each([
    { authenticated: false, accountId: null },
    { authenticated: true, accountId: null },
    { authenticated: true, accountId: "recipient" }
  ])("does not offer gifting without an eligible sender: %j", session => {
    (useCurrentAccount as jest.Mock).mockReturnValue(session);
    const screen = render(<PaperProvider><GiftTokensButton recipientAccountId="recipient" /></PaperProvider>);
    expect(screen.queryByRole("button", { name: "Send a gift" })).toBeNull();
  });

  it("opens and closes the dialog and resets the form on reopening", () => {
    const screen = render(<PaperProvider><GiftTokensButton recipientAccountId="recipient" recipientDisplayName="Nora" /></PaperProvider>);
    fireEvent.press(screen.getByRole("button", { name: "Send a gift" }));
    expect(screen.getByText("Send Topes to Nora.")).toBeTruthy();
    fireEvent.changeText(screen.getByLabelText("Amount"), "12");
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByLabelText("Amount")).toBeNull();
    fireEvent.press(screen.getByRole("button", { name: "Send a gift" }));
    expect(screen.getByLabelText("Amount")).toHaveProp("value", "");
  });

  it("disables submission until the amount is a positive whole integer", () => {
    const screen = renderDialog();
    expect(screen.getByRole("button", { name: "Send gift" })).toBeDisabled();
    fireEvent.changeText(screen.getByLabelText("Amount"), "1.5");
    expect(screen.getByRole("button", { name: "Send gift" })).toBeDisabled();
    fireEvent.press(screen.getByRole("button", { name: "Send gift" }));
    expect(giftTokens).not.toHaveBeenCalled();
    fireEvent.changeText(screen.getByLabelText("Amount"), "12");
    expect(screen.getByRole("button", { name: "Send gift" })).toBeEnabled();
  });

  it("sends the gift to the account and shows a success state without a second send action", async () => {
    const screen = renderDialog();
    fireEvent.changeText(screen.getByLabelText("Amount"), "12");
    fireEvent.changeText(screen.getByLabelText("Optional message"), "Thank you!");
    fireEvent.press(screen.getByRole("button", { name: "Send gift" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Gift sent."));
    expect(giftTokens).toHaveBeenCalledWith("recipient", 12, "Thank you!");
    expect(screen.queryByRole("button", { name: "Send gift" })).toBeNull();
    expect(screen.queryByLabelText("Amount")).toBeNull();
  });

  it("blocks duplicate submission and closing while the transfer is pending", async () => {
    let resolveGift!: () => void;
    (giftTokens as jest.Mock).mockReturnValue(new Promise<void>(resolve => { resolveGift = resolve; }));
    const onClose = jest.fn();
    const screen = renderDialog(onClose);
    fireEvent.changeText(screen.getByLabelText("Amount"), "12");
    fireEvent.press(screen.getByRole("button", { name: "Send gift" }));
    expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
    expect(screen.getByLabelText("Amount")).toBeDisabled();
    fireEvent.press(screen.getByRole("button", { name: "Sending…" }));
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(giftTokens).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => resolveGift());
    fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("preserves the form after a rejected gift and allows retry", async () => {
    (giftTokens as jest.Mock).mockRejectedValueOnce(new Error("failed"));
    const screen = renderDialog();
    fireEvent.changeText(screen.getByLabelText("Amount"), "12");
    fireEvent.changeText(screen.getByLabelText("Optional message"), "Thank you!");
    fireEvent.press(screen.getByRole("button", { name: "Send gift" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Insufficient token balance."));
    expect(screen.getByLabelText("Amount")).toHaveProp("value", "12");
    expect(screen.getByLabelText("Optional message")).toHaveProp("value", "Thank you!");
    fireEvent.press(screen.getByRole("button", { name: "Send gift" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Gift sent."));
    expect(giftTokens).toHaveBeenCalledTimes(2);
  });

  it("provides French dialog labels", async () => {
    await i18n.changeLanguage("fr");
    const screen = renderDialog();
    expect(screen.getByLabelText("Montant")).toBeTruthy();
    expect(screen.getByText("Envoyez des Topes à Nora.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Envoyer le don" })).toBeDisabled();
  });
});