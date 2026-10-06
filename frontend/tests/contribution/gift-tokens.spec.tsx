import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Button, Dialog, IconButton, TextField } from "@mui/material";
import { useMutation } from "@apollo/client/react";

import { useAuth } from "../../src/features/auth/AuthProvider";
import { GiftTokensButton, GiftTokensDialog, parseGiftAmount } from "../../src/features/contribution/GiftTokensButton";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn() }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@apollo/client/react", () => ({ useMutation: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

type Props = {
  children?: ReactNode;
  label?: string;
  disabled?: boolean;
  onClick?: () => void | Promise<void>;
  onClose?: () => void;
};

function findElements(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const matches: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) matches.push(child);
    matches.push(...findElements(child.props.children, type));
  });
  return matches;
}

describe("parseGiftAmount", () => {
  it.each(["", " ", "0", "-1", "1.5", "12abc", "NaN", "Infinity", "2147483648"])("rejects invalid amount %s", value => {
    expect(parseGiftAmount(value)).toBeNull();
  });

  it.each(["1", "75", "2147483647"])("accepts positive GraphQL integers: %s", value => {
    expect(parseGiftAmount(value)).toBe(Number(value));
  });
});

describe("contextual gifts", () => {
  const giftTokens = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useState as jest.Mock).mockImplementation(initial => [initial, jest.fn()]);
    (useAuth as jest.Mock).mockReturnValue({ session: { authenticated: true, account: { id: "sender" } } });
    (useMutation as unknown as jest.Mock).mockReturnValue([giftTokens, { loading: false, error: null }]);
    giftTokens.mockResolvedValue({ data: {} });
  });

  it("opens the dialog from an accessible gift icon button", () => {
    const setOpen = jest.fn();
    (useState as jest.Mock).mockReturnValueOnce([false, setOpen]);
    const tree = GiftTokensButton({ recipientAccountId: "recipient" });
    const button = findElements(tree, IconButton)[0];
    expect(button).toBeDefined();
    button.props.onClick?.();
    expect(setOpen).toHaveBeenCalledWith(true);
  });

  it("uses the supplied recipient and does not render a recipient input", () => {
    (useState as jest.Mock).mockReturnValueOnce([true, jest.fn()]);
    const tree = GiftTokensButton({ recipientAccountId: "recipient", recipientDisplayName: "Alice" });
    const dialog = findElements(tree, GiftTokensDialog)[0];
    expect(dialog.props).toMatchObject({ recipientAccountId: "recipient", recipientDisplayName: "Alice" });
    const dialogTree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    expect(findElements(dialogTree, TextField).map(field => field.props.label)).toEqual([
      "giftForm.amountLabel", "giftForm.messageLabel"
    ]);
  });

  it.each([
    { authenticated: false, account: null },
    { authenticated: true, account: { id: "recipient" } }
  ])("hides gifting when signed out or viewing your own account", session => {
    (useAuth as jest.Mock).mockReturnValue({ session });
    expect(GiftTokensButton({ recipientAccountId: "recipient" })).toBeNull();
  });

  it("sends to the contextual account and refreshes active balance/history queries", async () => {
    const setSent = jest.fn();
    (useState as jest.Mock)
      .mockReturnValueOnce(["75", jest.fn()])
      .mockReturnValueOnce(["  Thank you!  ", jest.fn()])
      .mockReturnValueOnce([false, setSent]);
    const tree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    const send = findElements(tree, Button)[1];
    expect(send.props.disabled).toBe(false);
    send.props.onClick?.();
    await Promise.resolve();
    expect(giftTokens).toHaveBeenCalledWith({ variables: { input: {
      recipientAccountId: "recipient", amount: 75, message: "Thank you!"
    } } });
    expect(setSent).toHaveBeenCalledWith(true);
    expect(useMutation).toHaveBeenCalledWith(expect.anything(), {
      refetchQueries: ["TokenBalance", "ContributionOverview"]
    });
  });

  it("disables sending invalid amounts", () => {
    (useState as jest.Mock).mockReturnValueOnce(["1.5", jest.fn()]);
    const tree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    const send = findElements(tree, Button)[1];
    expect(send.props.disabled).toBe(true);
    send.props.onClick?.();
    expect(giftTokens).not.toHaveBeenCalled();
  });

  it("prevents closing or resending while a gift is being submitted", () => {
    (useMutation as unknown as jest.Mock).mockReturnValue([giftTokens, { loading: true, error: null }]);
    const tree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    expect(findElements(tree, Dialog)[0].props.onClose).toBeUndefined();
    expect(findElements(tree, Button).every(button => button.props.disabled)).toBe(true);
  });

  it("keeps failed submissions available for retry without marking them successful", async () => {
    const setSent = jest.fn();
    giftTokens.mockRejectedValueOnce(new Error("Request failed"));
    (useState as jest.Mock)
      .mockReturnValueOnce(["75", jest.fn()])
      .mockReturnValueOnce(["", jest.fn()])
      .mockReturnValueOnce([false, setSent]);
    const tree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    findElements(tree, Button)[1].props.onClick?.();
    await Promise.resolve();
    expect(setSent).not.toHaveBeenCalled();
  });

  it("removes the send action after success to prevent duplicate gifts", () => {
    (useState as jest.Mock)
      .mockReturnValueOnce(["75", jest.fn()])
      .mockReturnValueOnce(["", jest.fn()])
      .mockReturnValueOnce([true, jest.fn()]);
    const tree = GiftTokensDialog({ recipientAccountId: "recipient", onClose: jest.fn() });
    expect(findElements(tree, Button)).toHaveLength(1);
    expect(findElements(tree, TextField)).toHaveLength(0);
  });
});