import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WorkspaceChatButton } from "../../src/features/chat/WorkspaceChatButton";
import { CLAIM_CONVERSATION_LOOKUP_QUERY, RESOURCE_CONVERSATION_LOOKUP_QUERY } from "../../src/features/chat/chat.queries";

let mockAccountId = "participant";
const mockUseQuery = jest.fn();
jest.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => mockUseQuery(...args) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { account: { id: mockAccountId } } })
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...props }, children)
}));

describe("workspace chat button", () => {
  beforeEach(() => {
    mockAccountId = "participant";
    mockUseQuery.mockReset();
    mockUseQuery.mockReturnValue({ data: undefined, loading: false });
  });

  it.each(["resource", "need"] as const)("opens a linked %s conversation without another lookup", kind => {
    const html = renderToStaticMarkup(createElement(WorkspaceChatButton, {
      kind, contextId: "listing", creatorAccountId: "owner", participantAccountId: "participant",
      title: "Listing", label: "Chat", linkedConversationId: "linked-thread"
    }));
    expect(html).toContain(`/chat?kind=${kind}&amp;id=linked-thread`);
    expect(mockUseQuery.mock.calls[0][1].skip).toBe(true);
  });

  it.each(["resource", "need"] as const)("finds an existing %s conversation by listing and pair, even without a bid/claim link", kind => {
    const field = kind === "resource"
      ? "resourceConversationByResourceIdAndOwnerAccountIdAndBidderAccountId"
      : "claimConversationByNeedIdAndCreatorAccountIdAndClaimerAccountId";
    mockUseQuery.mockReturnValue({ data: { [field]: { id: "pre-existing" } }, loading: false });
    const html = renderToStaticMarkup(createElement(WorkspaceChatButton, {
      kind, contextId: "listing", creatorAccountId: "owner", participantAccountId: "participant",
      title: "Listing", label: "Chat"
    }));
    expect(html).toContain(`/chat?kind=${kind}&amp;id=pre-existing`);
    expect(html).not.toContain("draft=1");
    expect(mockUseQuery.mock.calls[0][0]).toBe(kind === "resource"
      ? RESOURCE_CONVERSATION_LOOKUP_QUERY : CLAIM_CONVERSATION_LOOKUP_QUERY);
    expect(mockUseQuery.mock.calls[0][1].variables).toEqual(kind === "resource"
      ? { resourceId: "listing", ownerAccountId: "owner", bidderAccountId: "participant" }
      : { needId: "listing", creatorAccountId: "owner", claimerAccountId: "participant" });
  });

  it.each([
    ["resource", "participant", "owner"],
    ["resource", "owner", "participant"],
    ["need", "participant", "owner"],
    ["need", "owner", "participant"]
  ] as const)("opens a %s draft as %s addressed to %s", (kind, viewer, counterparty) => {
    mockAccountId = viewer;
    const html = renderToStaticMarkup(createElement(WorkspaceChatButton, {
      kind, contextId: "listing", creatorAccountId: "owner", participantAccountId: "participant",
      title: "Listing title", label: "Chat", ...(kind === "need" ? { needClaimId: "claim" } : {})
    }));
    expect(html).toContain(`kind=${kind}&amp;draft=1&amp;contextId=listing`);
    expect(html).toContain(`otherAccountId=${counterparty}`);
    expect(html).toContain("title=Listing+title");
    if (kind === "need") expect(html).toContain("needClaimId=claim");
    expect(html).not.toContain('aria-disabled="true"');
    expect(html).toContain('aria-label="Chat"');
    expect(html).toContain("MuiIconButton-colorPrimary");
    expect(html).toContain('href="/topela/CHAT.svg"');
    expect(html).toContain('flood-color="currentColor"');
    expect(html).not.toContain(">Chat<");
  });

  it("keeps chat visible but prevents opening a draft while lookup is pending or failed", () => {
    for (const result of [{ loading: true }, { loading: false, error: new Error("Network error") }]) {
      mockUseQuery.mockReturnValue(result);
      const html = renderToStaticMarkup(createElement(WorkspaceChatButton, {
        kind: "need", contextId: "listing", creatorAccountId: "owner", participantAccountId: "participant",
        title: "Listing", label: "Chat"
      }));
      expect(html).toContain('aria-label="Chat"');
      expect(html).toContain('aria-disabled="true"');
    }
  });
});