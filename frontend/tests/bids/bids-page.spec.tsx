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
  resourceConversationsByResourceBidId: { nodes: Array<{ id: string }> };
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

let sentQueryResult: {
  data?: { sentResourceBids: { nodes: BidNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null }; totalCount: number } };
  loading: boolean;
  error?: unknown;
  fetchMore: jest.Mock;
};

let receivedQueryResult: {
  data?: { receivedResourceBids: { nodes: BidNode[]; pageInfo: { hasNextPage: boolean; endCursor: string | null }; totalCount: number } };
  loading: boolean;
  error?: unknown;
  fetchMore: jest.Mock;
};

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
      if (key === "receivedAt") return `Received: ${String(opts?.date ?? "")}`;
      if (key === "reviewedAt") return `Reviewed: ${String(opts?.date ?? "")}`;
      if (key === "validity") return `Valid until ${String(opts?.date ?? "")}`;
      if (key === "yourNote") return `Your note: ${String(opts?.message ?? "")}`;

      return dict[key] ?? key;
    }
  })
}));

describe("BidsPage", () => {
  beforeEach(() => {
    mockUseMutation.mockReturnValue([jest.fn()]);
    sentQueryResult = {
      loading: false,
      fetchMore: jest.fn(),
      data: {
        sentResourceBids: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
          totalCount: 0
        }
      }
    };
    receivedQueryResult = {
      loading: false,
      fetchMore: jest.fn(),
      data: {
        receivedResourceBids: {
          nodes: [],
          pageInfo: { hasNextPage: false, endCursor: null },
          totalCount: 0
        }
      }
    };

    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === SENT_QUERY_DOC) return sentQueryResult;
      if (query === RECEIVED_QUERY_DOC) return receivedQueryResult;
      throw new Error("Unexpected query document");
    });
  });

  it("renders both sections with filters and preserves query-provided status ordering", () => {
    const sharedNow = "2026-05-03T10:00:00.000Z";

    sentQueryResult = {
      loading: false,
      fetchMore: jest.fn(),
      data: {
        sentResourceBids: {
          nodes: [
            {
              id: "sent-newest",
              resourceId: "resource-2",
              bidderAccountId: "acct-me",
              message: "Newest sent",
              proposedTokenAmount: 120,
              status: "WITHDRAWN",
              isActive: false,
              validUntil: sharedNow,
              createdAt: sharedNow,
              updatedAt: sharedNow,
              respondedAt: sharedNow,
              respondedByAccountId: "acct-owner-2",
              resourceConversationsByResourceBidId: { nodes: [] },
              accountByBidderAccountId: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" },
              resourceByResourceId: {
                id: "resource-2",
                creatorAccountId: "acct-owner-2",
                title: "Sent card newest",
                description: "Newest",
                location: "Town",
                defaultTokenAmount: 120,
                imageUrls: [],
                categoryLabels: [],
                isProduct: true,
                isService: false,
                canBeExchanged: true,
                isActive: true,
                expiresAt: null,
                accountByCreatorAccountId: { id: "acct-owner-2", displayName: "Owner Two", externalSubject: "owner-two" }
              }
            },
            {
              id: "sent-older",
              resourceId: "resource-1",
              bidderAccountId: "acct-me",
              message: "Older sent",
              proposedTokenAmount: 90,
              status: "OPEN",
              isActive: true,
              validUntil: sharedNow,
              createdAt: sharedNow,
              updatedAt: sharedNow,
              respondedAt: null,
              respondedByAccountId: null,
              resourceConversationsByResourceBidId: { nodes: [] },
              accountByBidderAccountId: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" },
              resourceByResourceId: {
                id: "resource-1",
                creatorAccountId: "acct-owner-1",
                title: "Sent card older",
                description: "Older",
                location: "Town",
                defaultTokenAmount: 90,
                imageUrls: [],
                categoryLabels: [],
                isProduct: true,
                isService: false,
                canBeExchanged: true,
                isActive: true,
                expiresAt: null,
                accountByCreatorAccountId: { id: "acct-owner-1", displayName: "Owner One", externalSubject: "owner-one" }
              }
            }
          ],
          pageInfo: { hasNextPage: true, endCursor: "cursor-sent-1" },
          totalCount: 2
        }
      }
    };

    receivedQueryResult = {
      loading: false,
      fetchMore: jest.fn(),
      data: {
        receivedResourceBids: {
          nodes: [
            {
              id: "recv-1",
              resourceId: "resource-3",
              bidderAccountId: "acct-bidder-1",
              message: "Incoming bid",
              proposedTokenAmount: 150,
              status: "OPEN",
              isActive: true,
              validUntil: sharedNow,
              createdAt: sharedNow,
              updatedAt: sharedNow,
              respondedAt: null,
              respondedByAccountId: null,
              resourceConversationsByResourceBidId: { nodes: [] },
              accountByBidderAccountId: { id: "acct-bidder-1", displayName: "Bidder One", externalSubject: "bidder-one" },
              resourceByResourceId: {
                id: "resource-3",
                creatorAccountId: "acct-me",
                title: "Received card",
                description: "Incoming",
                location: "Town",
                defaultTokenAmount: 150,
                imageUrls: [],
                categoryLabels: [],
                isProduct: true,
                isService: false,
                canBeExchanged: true,
                isActive: true,
                expiresAt: null,
                accountByCreatorAccountId: { id: "acct-me", displayName: "Me", externalSubject: "me-sub" }
              }
            }
          ],
          pageInfo: { hasNextPage: false, endCursor: null },
          totalCount: 1
        }
      }
    };

    const { default: BidsPage } = require("../../src/pages/bids");
    const markup = renderToStaticMarkup(createElement(BidsPage));

    expect(markup).toContain("Bids workspace");
    expect(markup).toContain("Sent section");
    expect(markup).toContain("Received section");
    expect(markup).toContain("All");
    expect(markup).toContain("Active only");
    expect(markup).toContain("Load more");

    expect(markup.indexOf("Sent card newest")).toBeLessThan(markup.indexOf("Sent card older"));
    expect(markup).toContain("Received card");
  });
});
