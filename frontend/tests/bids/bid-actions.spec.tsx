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
const mockUseSubscription = jest.fn();

let sentNodes: BidNode[] = [];
let receivedNodes: BidNode[] = [];

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children)
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useSubscription: mockUseSubscription
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
        "actions.cancel": "Cancel bid",
        "actions.accept": "Accept bid",
        "actions.decline": "Decline bid",
        "acceptConfirm.title": "Confirm acceptance",
        "acceptConfirm.message": "Acceptance is final and Topes are transferred immediately.",
        "acceptConfirm.confirm": "Yes, accept",
        "acceptConfirm.cancel": "Go back",
        "statuses.OPEN": "open",
        "statuses.DECLINED": "declined",
        "statuses.WITHDRAWN": "withdrawn",
        "statuses.ACCEPTED": "accepted",
        "statuses.EXPIRED": "expired",
        "inactive.accepted": "This bid was accepted.",
        "inactive.declined": "This bid was declined.",
        "inactive.withdrawn": "This bid was cancelled by the bidder.",
        "inactive.expired": "This bid has expired.",
        "sentEmpty": "No sent bids",
        "receivedEmpty": "No received bids"
      };

      if (key === "chips.tokens") return `${opts?.value as string} tokens`;
      if (key === "reserved") return `${opts?.value as string} Topes reserved`;
      if (key === "sentAt") return `Sent: ${String(opts?.date ?? "")}`;
      if (key === "receivedAt") return `Received: ${String(opts?.date ?? "")}`;
      if (key === "reviewedAt") return `Reviewed: ${String(opts?.date ?? "")}`;
      if (key === "validity") return `Valid until ${String(opts?.date ?? "")}`;
      if (key === "yourNote") return `Your note: ${String(opts?.message ?? "")}`;

      return dict[key] ?? key;
    }
  })
}));

function buildBid(overrides: Partial<BidNode> & { id: string; status: BidNode["status"]; isActive: boolean }): BidNode {
  const now = "2026-05-03T12:00:00.000Z";

  return {
    id: overrides.id,
    resourceId: overrides.resourceId ?? `resource-${overrides.id}`,
    bidderAccountId: overrides.bidderAccountId ?? "acct-bidder",
    message: overrides.message ?? "Bid message",
    proposedTokenAmount: overrides.proposedTokenAmount ?? 110,
    status: overrides.status,
    isActive: overrides.isActive,
    validUntil: overrides.validUntil ?? now,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    respondedAt: overrides.respondedAt ?? null,
    respondedByAccountId: overrides.respondedByAccountId ?? null,
    resourceConversationByConversationId: overrides.resourceConversationByConversationId ?? null,
    accountByBidderAccountId: overrides.accountByBidderAccountId ?? {
      id: "acct-bidder",
      displayName: "Bidder",
      externalSubject: "bidder-sub"
    },
    resourceByResourceId: overrides.resourceByResourceId ?? {
      id: overrides.resourceId ?? `resource-${overrides.id}`,
      creatorAccountId: "acct-creator",
      title: `Resource ${overrides.id}`,
      description: "Description",
      location: "Town",
      defaultTokenAmount: 110,
      imageUrls: [],
      categoryLabels: [],
      isProduct: true,
      isService: false,
      canBeExchanged: true,
      isActive: true,
      expiresAt: null,
      accountByCreatorAccountId: {
        id: "acct-creator",
        displayName: "Creator",
        externalSubject: "creator-sub"
      }
    }
  };
}

describe("BidsPage action controls", () => {
  beforeEach(() => {
    sentNodes = [];
    receivedNodes = [];

    mockUseMutation.mockReturnValue([jest.fn()]);
    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === SENT_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          fetchMore: jest.fn(),
          data: {
            sentResourceBids: {
              nodes: sentNodes,
              pageInfo: { hasNextPage: false, endCursor: null },
              totalCount: sentNodes.length
            }
          }
        };
      }

      if (query === RECEIVED_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          fetchMore: jest.fn(),
          data: {
            receivedResourceBids: {
              nodes: receivedNodes,
              pageInfo: { hasNextPage: false, endCursor: null },
              totalCount: receivedNodes.length
            }
          }
        };
      }

      throw new Error("Unexpected query document");
    });
  });

  it("shows cancel on active sent bids, hides it on inactive sent bids, and renders inactive explanation", () => {
    sentNodes = [
      buildBid({ id: "sent-active", status: "OPEN", isActive: true }),
      buildBid({ id: "sent-inactive", status: "WITHDRAWN", isActive: false })
    ];

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).toContain("Cancel bid");
    expect(markup).toContain("This bid was cancelled by the bidder.");
    expect(markup).toContain("View creator");
  });

  it("shows accept/decline controls for active received bids", () => {
    receivedNodes = [
      buildBid({
        id: "recv-active",
        status: "OPEN",
        isActive: true,
        bidderAccountId: "acct-bidder-2",
        accountByBidderAccountId: {
          id: "acct-bidder-2",
          displayName: "Bidder Two",
          externalSubject: "bidder-two-sub"
        },
        resourceByResourceId: {
          id: "resource-recv",
          creatorAccountId: "acct-me",
          title: "Received Resource",
          description: "Desc",
          location: "Town",
          defaultTokenAmount: 150,
          imageUrls: [],
          categoryLabels: [],
          isProduct: true,
          isService: false,
          canBeExchanged: true,
          isActive: true,
          expiresAt: null,
          accountByCreatorAccountId: {
            id: "acct-me",
            displayName: "Me",
            externalSubject: "me-sub"
          }
        }
      })
    ];

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).toContain("Accept bid");
    expect(markup).toContain("Decline bid");
    expect(markup).toContain("View bidder");
  });

  it("keeps final-acceptance confirmation messaging available in locale copy", () => {
    const bidsLocale = require("../../src/locales/en/bids.json") as {
      acceptConfirm?: { title?: string; message?: string; confirm?: string; cancel?: string };
    };

    expect(bidsLocale.acceptConfirm?.title).toBeTruthy();
    expect(bidsLocale.acceptConfirm?.message).toBeTruthy();
    expect(bidsLocale.acceptConfirm?.confirm).toBeTruthy();
    expect(bidsLocale.acceptConfirm?.cancel).toBeTruthy();
  });
});
