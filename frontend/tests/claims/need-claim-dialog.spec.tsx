import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Button, Dialog, IconButton, TextField, Tooltip } from "@mui/material";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import { useMutation } from "@apollo/client/react";
import { NeedClaimDialog } from "../../src/features/needs/NeedClaimDialog";

jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useEffect: jest.fn(), useMemo: (fn: () => unknown) => fn() }));
jest.mock("@apollo/client/react", () => ({ useMutation: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

type Props = {
  children?: ReactNode;
  title?: string;
  label?: string;
  value?: string;
  disabled?: boolean;
  onClick?: () => void;
  onClose?: () => void;
  onChange?: (event: { target: { value: string } }) => void;
};
function find(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const result: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) result.push(child);
    result.push(...find(child.props.children, type));
  });
  return result;
}

describe("need volunteering dialog", () => {
  const claimNeed = jest.fn();
  const setOpen = jest.fn();
  const setMessage = jest.fn();
  const props = { needId: "need", needTitle: "Need", iconOnly: true };

  beforeEach(() => {
    jest.clearAllMocks();
    (useState as jest.Mock).mockImplementation(initial => [initial, jest.fn()]);
    (useState as jest.Mock).mockReturnValueOnce([true, setOpen]).mockReturnValueOnce(["", setMessage]);
    (useMutation as unknown as jest.Mock).mockReturnValue([claimNeed, { loading: false, error: null }]);
    claimNeed.mockResolvedValue({ data: { claimNeed: { needClaim: { id: "claim" } } } });
  });

  it("opens an optional-message dialog from a primary waving-hand icon with tooltip", () => {
    const tree = NeedClaimDialog(props);
    expect(find(tree, WavingHandIcon)).toHaveLength(1);
    expect(find(tree, Tooltip)[0].props.title).toBe("claimDialog.claimThisNeed");
    expect(find(tree, IconButton)[0].props).toMatchObject({ color: "primary", "aria-label": "claimDialog.claimThisNeed" });
    find(tree, IconButton)[0].props.onClick?.();
    expect(setOpen).toHaveBeenCalledWith(true);
    const field = find(tree, TextField)[0];
    expect(field.props.label).toBe("claimDialog.optionalMessage");
    field.props.onChange?.({ target: { value: "I can help" } });
    expect(setMessage).toHaveBeenCalledWith("I can help");
  });

  it.each(["", "   ", "  I can help  "])("submits volunteering with optional message %j", async message => {
    (useState as jest.Mock).mockReset().mockReturnValueOnce([true, setOpen]).mockReturnValueOnce([message, setMessage]);
    const onClaimed = jest.fn();
    const tree = NeedClaimDialog({ ...props, onClaimed });
    find(tree, Button)[1].props.onClick?.();
    await Promise.resolve();
    expect(claimNeed).toHaveBeenCalledWith({ variables: { input: { needId: "need", message: message.trim() || null } } });
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(onClaimed).toHaveBeenCalledWith("claim");
  });

  it("prefills an existing claim and offers to update its note", () => {
    (useState as jest.Mock).mockReset().mockImplementation(initial => [initial, jest.fn()]);
    const tree = NeedClaimDialog({ ...props, existingClaim: { id: "claim", status: "OPEN", message: "Existing note" } });
    expect(find(tree, Tooltip)[0].props.title).toBe("claimDialog.updateClaimNote");
    expect(find(tree, TextField)[0].props.value).toBe("Existing note");
  });

  it("keeps the dialog and message available after mutation failure", async () => {
    claimNeed.mockRejectedValueOnce(new Error("Request failed"));
    const onClaimed = jest.fn();
    find(NeedClaimDialog({ ...props, onClaimed }), Button)[1].props.onClick?.();
    await Promise.resolve();
    expect(setOpen).not.toHaveBeenCalledWith(false);
    expect(setMessage).not.toHaveBeenCalled();
    expect(onClaimed).not.toHaveBeenCalled();
  });

  it("blocks closing and resending during submission", () => {
    (useMutation as unknown as jest.Mock).mockReturnValue([claimNeed, { loading: true }]);
    const tree = NeedClaimDialog(props);
    expect(find(tree, Button).every(button => button.props.disabled)).toBe(true);
    find(tree, Dialog)[0].props.onClose?.();
    find(tree, Button)[1].props.onClick?.();
    expect(setOpen).not.toHaveBeenCalled();
    expect(claimNeed).not.toHaveBeenCalled();
  });

  it("blocks submitting unavailable needs", () => {
    const tree = NeedClaimDialog({ ...props, disabled: true });
    expect(find(tree, IconButton)[0].props.disabled).toBe(true);
    find(tree, Button)[1].props.onClick?.();
    expect(claimNeed).not.toHaveBeenCalled();
  });
});