import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type BidNode = {
  id: string;
  resourceId: string;
  bidderAccountId: string;
  message: string | null;
  proposedTokenAmount: number | null;
  status: "OPEN" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";
  isActive: boolean;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  respondedByAccountId: string | null;
  resourceConversationByConversationId: { id: string } | null;
  accountByBidderAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
  resourceByResourceId: {
    id: string;
    creatorAccountId: string;
    title: string;
    description: string | null;
    location: string;
    defaultTokenAmount: number | null;
    imageUrls: string[];
    categoryLabels: string[];
    isProduct: boolean;
    isService: boolean;
    canBeExchanged: boolean;
    isActive: boolean;
    expiresAt: string | null;
    accountByCreatorAccountId: {
      id: string;
      displayName: string | null;
      externalSubject: string;
    } | null;
  };
};

const SENT_QUERY_DOC = { kind: "Document", name: "sent" };
const RECEIVED_QUERY_DOC = { kind: "Document", name: "received" };

const mockUseQuery = jest.fn();
const mockUseMutation = jest.fn(() => [jest.fn()]);

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children)
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation
}));

jest.mock("../../src/features/resources/resources.queries", () => ({
  SENT_BIDS_QUERY: SENT_QUERY_DOC,
  RECEIVED_BIDS_QUERY: RECEIVED_QUERY_DOC,
  CANCEL_RESOURCE_BID_MUTATION: { kind: "Document", name: "cancel" },
  RESPOND_TO_RESOURCE_BID_MUTATION: { kind: "Document", name: "respond" }
}));

jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { account: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" } } })
}));

jest.mock("../../src/features/auth/requireAuth", () => ({
  useRequireAuth: () => ({ isAuthenticated: true, isChecking: false, isRedirecting: false })
}));

jest.mock("../../src/services/graphql/accountEvents", () => ({
  useAccountEventSignal: jest.fn()
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {} })
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        workspaceTitle: "Bids workspace",
        workspaceSubtitle: "Track bids",
        "sections.sent": "Sent section",
        "sections.received": "Received section",
        "filters.all": "All",
        "filters.activeOnly": "Active only",
        "actions.loadMore": "Load more",
        "actions.viewResource": "View resource",
        "actions.viewCreator": "View creator",
        "actions.viewBidder": "View bidder",
        "actions.chat": "Chat",
        "actions.cancel": "Cancel bid",
        "actions.accept": "Accept bid",
        "actions.decline": "Decline bid",
        "acceptConfirm.title": "Confirm acceptance",
        "acceptConfirm.message": "Acceptance is final",
        "acceptConfirm.confirm": "Yes, accept",
        "acceptConfirm.cancel": "Go back",
        "statuses.OPEN": "open",
        "statuses.DECLINED": "declined",
        "statuses.WITHDRAWN": "withdrawn",
        "statuses.ACCEPTED": "accepted",
        "statuses.EXPIRED": "expired",
        "inactive.accepted": "Accepted",
        "inactive.declined": "Declined",
        "inactive.withdrawn": "Withdrawn",
        "inactive.expired": "Expired",
        "sentEmpty": "No sent bids",
        "receivedEmpty": "No received bids"
      };

      if (key === "chips.tokens") return `${opts?.value as string} tokens`;
      if (key === "reserved") return `${opts?.value as string} Topes reserved`;
      if (key === "sentAt") return `Sent: ${String(opts?.date ?? "")}`;
      if (key === "reviewedAt") return `Reviewed: ${String(opts?.date ?? "")}`;
      if (key === "validity") return `Valid until ${String(opts?.date ?? "")}`;
      if (key === "yourNote") return `Your note: ${String(opts?.message ?? "")}`;

      return dict[key] ?? key;
    }
  })
}));

function makeQueryResult(sentNodes: BidNode[], receivedNodes: BidNode[]) {
  return (query: unknown) => {
    const empty = { nodes: [], pageInfo: { hasNextPage: false, endCursor: null }, totalCount: 0 };
    if (query === SENT_QUERY_DOC) {
      return {
        loading: false, error: undefined, fetchMore: jest.fn(), refetch: jest.fn(),
        data: { sentResourceBids: { nodes: sentNodes, pageInfo: { hasNextPage: false, endCursor: null }, totalCount: sentNodes.length } }
      };
    }
    if (query === RECEIVED_QUERY_DOC) {
      return {
        loading: false, error: undefined, fetchMore: jest.fn(), refetch: jest.fn(),
        data: { receivedResourceBids: { nodes: receivedNodes, pageInfo: { hasNextPage: false, endCursor: null }, totalCount: receivedNodes.length } }
      };
    }
    return { loading: false, data: { sentResourceBids: empty, receivedResourceBids: empty }, fetchMore: jest.fn(), refetch: jest.fn() };
  };
}

const NOW = "2026-05-03T12:00:00.000Z";
const RESOURCE_ID = "resource-abc";
const CREATOR_ACCOUNT_ID = "acct-creator";
const BIDDER_ACCOUNT_ID = "acct-bidder";
const CONVERSATION_ID = "conv-xyz";

function makeResource(creatorAccountId: string) {
  return {
    id: RESOURCE_ID,
    creatorAccountId,
    title: "Test resource",
    description: null,
    location: "Town",
    defaultTokenAmount: 100,
    imageUrls: [],
    categoryLabels: [],
    isProduct: true,
    isService: false,
    canBeExchanged: false,
    isActive: true,
    expiresAt: null,
    accountByCreatorAccountId: { id: creatorAccountId, displayName: "Creator", externalSubject: "creator-sub" }
  };
}

describe("BidsPage navigation links", () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue([jest.fn()]);
  });

  it("sent bid card links to the resource, creator account, and chat when conversation exists", () => {
    const sentBid: BidNode = {
      id: "bid-sent-1",
      resourceId: RESOURCE_ID,
      bidderAccountId: "acct-me",
      message: null,
      proposedTokenAmount: 100,
      status: "OPEN",
      isActive: true,
      validUntil: NOW,
      createdAt: NOW,
      updatedAt: NOW,
      respondedAt: null,
      respondedByAccountId: null,
      resourceConversationByConversationId: { id: CONVERSATION_ID },
      accountByBidderAccountId: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" },
      resourceByResourceId: makeResource(CREATOR_ACCOUNT_ID)
    };

    mockUseQuery.mockImplementation(makeQueryResult([sentBid], []));

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).toContain(`href="/resources/${RESOURCE_ID}"`);
    expect(markup).toContain(`href="/accounts/${CREATOR_ACCOUNT_ID}"`);
    expect(markup).toContain(`href="/chat?kind=resource&amp;id=${CONVERSATION_ID}"`);
    expect(markup).toContain("Chat");
  });

  it("sent bid card omits chat button when no conversation exists", () => {
    const sentBid: BidNode = {
      id: "bid-sent-2",
      resourceId: RESOURCE_ID,
      bidderAccountId: "acct-me",
      message: null,
      proposedTokenAmount: 100,
      status: "OPEN",
      isActive: true,
      validUntil: NOW,
      createdAt: NOW,
      updatedAt: NOW,
      respondedAt: null,
      respondedByAccountId: null,
      resourceConversationByConversationId: null,
      accountByBidderAccountId: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" },
      resourceByResourceId: makeResource(CREATOR_ACCOUNT_ID)
    };

    mockUseQuery.mockImplementation(makeQueryResult([sentBid], []));

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).not.toContain(`href="/chat`);
  });

  it("received bid card links to the resource, bidder account, and chat when conversation exists", () => {
    const receivedBid: BidNode = {
      id: "bid-recv-1",
      resourceId: RESOURCE_ID,
      bidderAccountId: BIDDER_ACCOUNT_ID,
      message: null,
      proposedTokenAmount: 100,
      status: "OPEN",
      isActive: true,
      validUntil: NOW,
      createdAt: NOW,
      updatedAt: NOW,
      respondedAt: null,
      respondedByAccountId: null,
      resourceConversationByConversationId: { id: CONVERSATION_ID },
      accountByBidderAccountId: { id: BIDDER_ACCOUNT_ID, displayName: "Bidder", externalSubject: "bidder-sub" },
      resourceByResourceId: makeResource("acct-me")
    };

    mockUseQuery.mockImplementation(makeQueryResult([], [receivedBid]));

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).toContain(`href="/resources/${RESOURCE_ID}"`);
    expect(markup).toContain(`href="/accounts/${BIDDER_ACCOUNT_ID}"`);
    expect(markup).toContain(`href="/chat?kind=resource&amp;id=${CONVERSATION_ID}"`);
    expect(markup).toContain("Chat");
  });

  it("received bid card omits chat button when no conversation exists", () => {
    const receivedBid: BidNode = {
      id: "bid-recv-2",
      resourceId: RESOURCE_ID,
      bidderAccountId: BIDDER_ACCOUNT_ID,
      message: null,
      proposedTokenAmount: 100,
      status: "OPEN",
      isActive: true,
      validUntil: NOW,
      createdAt: NOW,
      updatedAt: NOW,
      respondedAt: null,
      respondedByAccountId: null,
      resourceConversationByConversationId: null,
      accountByBidderAccountId: { id: BIDDER_ACCOUNT_ID, displayName: "Bidder", externalSubject: "bidder-sub" },
      resourceByResourceId: makeResource("acct-me")
    };

    mockUseQuery.mockImplementation(makeQueryResult([], [receivedBid]));

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).not.toContain(`href="/chat`);
  });
});
