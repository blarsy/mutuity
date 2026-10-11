import { Children, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import { Button, TextField } from "@mui/material";
import { useMutation, useQuery } from "@apollo/client/react";
import { ClaimConversationPanel, ClaimConversationThreadView } from "../../src/features/needs/ClaimConversationPanel";
import { ChatImageUploadDialog } from "../../src/features/chat/ChatImageUploadDialog";

const mockPush = jest.fn();
jest.mock("react", () => ({ ...jest.requireActual("react"), useState: jest.fn(), useEffect: jest.fn() }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock("@apollo/client/react", () => ({ useMutation: jest.fn(), useQuery: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("../../src/features/chat/ConversationThread", () => ({ parseImageUrls: jest.fn(), MAX_IMAGE_ATTACHMENTS: 5 }));
jest.mock("../../src/features/chat/ChatImageUploadDialog", () => ({ ChatImageUploadDialog: () => null }));

type Props = { children?: ReactNode; disabled?: boolean; href?: string; value?: string; onClick?: () => void; onChange?: (event: { target: { value: string } }) => void };
function find(node: ReactNode, type: unknown): ReactElement<Props>[] {
  const result: ReactElement<Props>[] = [];
  Children.forEach(node, child => {
    if (!isValidElement<Props>(child)) return;
    if (child.type === type) result.push(child);
    result.push(...find(child.props.children, type));
  });
  return result;
}

describe("claim conversation navigation", () => {
  const send = jest.fn();
  const setBody = jest.fn();
  const setImages = jest.fn();
  const refetch = jest.fn();
  const claim = { id: "claim", needId: "need", claimerAccountId: "helper", status: "OPEN", message: "I can help",
    needByNeedId: { creatorAccountId: "owner", title: "Need" } };
  let conversation: { id: string } | null;
  let conversationLoading: boolean;
  let conversationError: Error | undefined;
  let sendLoading: boolean;
  const render = (account = "owner") => ClaimConversationPanel({ claimId: "claim", currentAccountId: account });

  beforeEach(() => {
    jest.clearAllMocks();
    conversation = null;
    conversationLoading = false;
    conversationError = undefined;
    sendLoading = false;
    (useState as jest.Mock).mockReturnValueOnce(["  First reply  ", setBody])
      .mockReturnValueOnce([["https://example.com/photo.jpg"], setImages]).mockReturnValueOnce([false, jest.fn()]);
    (useQuery as unknown as jest.Mock).mockImplementation((_query, options) => options.variables.claimId
      ? { data: { needClaimById: claim }, loading: false, refetch }
      : { data: { claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId: conversation },
          loading: conversationLoading, error: conversationError, refetch });
    (useMutation as unknown as jest.Mock).mockImplementation(() => [send, { loading: sendLoading }]);
    send.mockResolvedValue({ data: { sendClaimMessage: { claimMessage: { conversationId: "new-thread" } } } });
    mockPush.mockResolvedValue(true);
  });

  it("retains the first reply and attachment composer until a conversation exists", () => {
    const tree = render();
    expect(find(tree, TextField)[0].props).toMatchObject({ disabled: false, value: "  First reply  ", label: "claimConversation.firstReply" });
    find(tree, TextField)[0].props.onChange?.({ target: { value: "Edited reply" } });
    expect(setBody).toHaveBeenCalledWith("Edited reply");
    expect(find(tree, ChatImageUploadDialog)).toHaveLength(1);
  });

  it("redirects to the created chat using the mutation's conversation ID without refetching", async () => {
    find(render(), Button)[0].props.onClick?.();
    await Promise.resolve();
    expect(send).toHaveBeenCalledWith({ variables: { input: {
      needClaimId: "claim", body: "First reply", imageUrls: ["https://example.com/photo.jpg"]
    } } });
    expect(mockPush).toHaveBeenCalledWith("/chat?kind=need&id=new-thread");
    expect(refetch).not.toHaveBeenCalled();
    expect(setBody).toHaveBeenCalledWith("");
    expect(setImages).toHaveBeenCalledWith([]);
  });

  it("shows only a navigation button for an existing conversation and does not mark messages read", () => {
    conversation = { id: "existing-thread" };
    const tree = render();
    expect(find(tree, Button)[0].props.href).toBe("/chat?kind=need&id=existing-thread");
    expect(find(tree, TextField)).toHaveLength(0);
    expect(find(tree, ClaimConversationThreadView)).toHaveLength(0);
    expect(find(tree, ChatImageUploadDialog)).toHaveLength(0);
    expect(useMutation).toHaveBeenCalledTimes(1);
    expect(send).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("preserves the draft and stays on the claim when sending fails", async () => {
    send.mockRejectedValueOnce(new Error("Offline"));
    find(render(), Button)[0].props.onClick?.();
    await Promise.resolve();
    expect(mockPush).not.toHaveBeenCalled();
    expect(setBody).not.toHaveBeenCalled();
    expect(setImages).not.toHaveBeenCalled();
  });

  it.each(["loading", "error", "sending", "helper"])("prevents sending while %s", guard => {
    conversationLoading = guard === "loading";
    conversationError = guard === "error" ? new Error("Offline") : undefined;
    sendLoading = guard === "sending";
    const tree = render(guard === "helper" ? "helper" : "owner");
    expect(find(tree, Button)[0].props.disabled).toBe(true);
    find(tree, Button)[0].props.onClick?.();
    expect(send).not.toHaveBeenCalled();
  });
});