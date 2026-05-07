import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

type ClaimNode = {
  id: string;
  needId: string;
  claimerAccountId: string;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  settledAt: string | null;
  settledByAccountId: string | null;
  needByNeedId: {
    id: string;
    title: string;
    creatorAccountId: string;
    proposedTopesAmount: number | null;
  };
  accountByClaimerAccountId: {
    id: string;
    displayName: string | null;
    externalSubject: string;
  } | null;
  claimConversationsByNeedClaimId: {
    nodes: Array<{ id: string }>;
  };
};

const CLAIM_OVERVIEW_QUERY_DOC = { kind: "Document", name: "claims-overview" };
const mockUseQuery = jest.fn();

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children)
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push: jest.fn() })
}));

jest.mock("@apollo/client/react", () => ({
  useQuery: mockUseQuery,
  useMutation: jest.fn(() => [jest.fn(), { loading: false }])
}));

jest.mock("../../src/features/needs/needClaims.queries", () => ({
  VIEWER_CLAIM_OVERVIEW_QUERY: CLAIM_OVERVIEW_QUERY_DOC,
  CANCEL_NEED_CLAIM_MUTATION: {},
  DECLINE_NEED_CLAIM_MUTATION: {},
  SETTLE_NEED_CLAIM_MUTATION: {}
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

jest.mock("../../src/features/ui/NeedCard", () => ({
  NeedCard: ({ title, actions, chips, creatorName, description, footer }: {
    title: string;
    actions: ReactNode;
    chips: ReactNode;
    creatorName: string;
    description: ReactNode;
    footer: ReactNode;
  }) => createElement("section", { "data-testid": "need-card" },
    createElement("h3", null, title),
    createElement("div", null, creatorName),
    createElement("div", null, chips),
    createElement("div", null, description),
    createElement("div", null, footer),
    createElement("div", null, actions)
  )
}));

jest.mock("../../src/features/needs/NeedClaimStatusChip", () => ({
  NeedClaimStatusChip: ({ status }: { status: string }) => createElement("span", { "data-status": status }, status)
}));

jest.mock("../../src/services/graphql/errorMessages", () => ({
  getUserFacingGraphQLErrorMessage: () => null
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        title: "Claims",
        workspaceTitle: "Claims workspace",
        workspaceSubtitle: "Track claims",
        loading: "Loading",
        sentCount: `${String(opts?.count ?? "")} sent`,
        receivedCount: `${String(opts?.count ?? "")} received`,
        notificationsCount: `${String(opts?.count ?? "")} notifications`,
        noDateYet: "No date",
        sentSection: "Sent section",
        receivedSection: "Received section",
        sentEmpty: "No sent claims",
        receivedEmpty: "No received claims",
        sentFilterEmpty: "No sent match filter",
        receivedFilterEmpty: "No received match filter",
        loadMore: "Load more",
        you: "You",
        needOwner: "Need owner",
        yourNote: "Your note",
        openClaimHint: "Open claim",
        helperNote: "Helper note",
        reviewClaimHint: "Review claim",
        sent: "Sent",
        received: "Received",
        updated: "Updated",
        threadOpen: "thread open",
        topesAmount: `${String(opts?.amount ?? "")} Topes`,
        noTopes: "No Topes",
        "filter.active": "Active",
        "filter.inactive": "Inactive",
        "filter.all": "All",
        "actions.viewClaim": "View claim",
        "actions.viewNeed": "View need",
        "actions.viewNeedOwner": "View need owner",
        "actions.reviewClaim": "Review claim",
        "actions.viewClaimer": "View claimer",
        "actions.chat": "Chat",
        "actions.cancel": "Cancel claim",
        "actions.decline": "Decline",
        "actions.settle": "Settle",
        "settleDisabledHint": `Need ${String(opts?.amount ?? "")} Topes`,
        "settleConfirm.title": "Settle?",
        "settleConfirm.message": "Settlement is final",
        "settleConfirm.cancel": "Cancel",
        "settleConfirm.confirm": "Settle",
        "inactive.settled": "Settled",
        "inactive.declined": "Declined",
        "inactive.withdrawn": "Cancelled",
        "inactive.expired": "Expired"
      };
      return dict[key] ?? key;
    }
  })
}));

function buildClaim(overrides: Partial<ClaimNode> & {
  id: string;
  needId: string;
  claimerAccountId: string;
  creatorAccountId: string;
}): ClaimNode {
  const now = "2026-05-05T12:00:00.000Z";
  return {
    id: overrides.id,
    needId: overrides.needId,
    claimerAccountId: overrides.claimerAccountId,
    message: overrides.message ?? null,
    status: overrides.status ?? "OPEN",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    settledAt: overrides.settledAt ?? null,
    settledByAccountId: overrides.settledByAccountId ?? null,
    needByNeedId: overrides.needByNeedId ?? {
      id: overrides.needId,
      title: `Need ${overrides.id}`,
      creatorAccountId: overrides.creatorAccountId,
      proposedTopesAmount: 50
    },
    accountByClaimerAccountId: overrides.accountByClaimerAccountId ?? {
      id: overrides.claimerAccountId,
      displayName: "Claimer",
      externalSubject: "claimer-sub"
    },
    claimConversationsByNeedClaimId: overrides.claimConversationsByNeedClaimId ?? { nodes: [] }
  };
}

function makeQueryResult(claims: ClaimNode[], balance: number | null = 100) {
  const sent = claims.filter(claim => claim.claimerAccountId === "acct-me");
  const received = claims.filter(claim => claim.needByNeedId.creatorAccountId === "acct-me");
  return {
    loading: false,
    error: undefined,
    refetch: jest.fn(),
    data: {
      currentTokenBalance: balance,
      sentNeedClaims: { nodes: sent },
      receivedNeedClaims: { nodes: received },
      allNeedClaimNotifications: { nodes: [] }
    }
  };
}

import ClaimsPage from "../../src/pages/claims";

describe("ClaimsPage rendering and filters", () => {
  it("shows empty state when no claims at all", () => {
    mockUseQuery.mockReturnValue(makeQueryResult([]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    expect(html).toContain("No sent claims");
    expect(html).toContain("No received claims");
  });

  it("renders sent and received sections with correct titles", () => {
    const sent = buildClaim({ id: "c1", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner" });
    const received = buildClaim({ id: "c2", needId: "n2", claimerAccountId: "acct-helper", creatorAccountId: "acct-me" });
    mockUseQuery.mockReturnValue(makeQueryResult([sent, received]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    expect(html).toContain("Sent section");
    expect(html).toContain("Received section");
    expect(html).toContain(`Need ${sent.id}`);
    expect(html).toContain(`Need ${received.id}`);
  });

  it("summary chips show total counts regardless of filter", () => {
    const open = buildClaim({ id: "c1", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "OPEN" });
    const withdrawn = buildClaim({ id: "c2", needId: "n2", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "WITHDRAWN" });
    mockUseQuery.mockReturnValue(makeQueryResult([open, withdrawn]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    // Total sent is 2 regardless of default active filter
    expect(html).toContain("2 sent");
  });

  it("default active filter hides inactive claims in sent section", () => {
    const openClaim = buildClaim({ id: "c1", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "OPEN" });
    const settledClaim = buildClaim({ id: "c2", needId: "n2", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "SETTLED" });
    mockUseQuery.mockReturnValue(makeQueryResult([openClaim, settledClaim]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    // Open claim should be visible, settled should not
    expect(html).toContain(`Need ${openClaim.id}`);
    expect(html).not.toContain(`Need ${settledClaim.id}`);
  });

  it("shows sentFilterEmpty when active filter returns no results for sent", () => {
    const settled = buildClaim({ id: "c1", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "SETTLED" });
    mockUseQuery.mockReturnValue(makeQueryResult([settled]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    // All sent claims are inactive; default active filter shows empty message (not sentEmpty)
    expect(html).toContain("No sent match filter");
    expect(html).not.toContain("No sent claims");
  });

  it("shows load-more when more than 5 active claims exist", () => {
    const claims = Array.from({ length: 7 }, (_, i) =>
      buildClaim({ id: `c${i}`, needId: `n${i}`, claimerAccountId: "acct-me", creatorAccountId: "acct-owner", status: "OPEN" })
    );
    mockUseQuery.mockReturnValue(makeQueryResult(claims));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    expect(html).toContain("Load more");
    // Only first 5 visible
    expect(html).toContain("Need c0");
    expect(html).toContain("Need c4");
    expect(html).not.toContain("Need c5");
  });

  it("renders filter toggle buttons in each section", () => {
    const claim = buildClaim({ id: "c1", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner" });
    mockUseQuery.mockReturnValue(makeQueryResult([claim]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    expect(html).toContain("Active");
    expect(html).toContain("Inactive");
    expect(html).toContain("All");
  });

  it("orders claims by updatedAt descending", () => {
    const older = buildClaim({ id: "c-old", needId: "n1", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", updatedAt: "2026-01-01T00:00:00.000Z" });
    const newer = buildClaim({ id: "c-new", needId: "n2", claimerAccountId: "acct-me", creatorAccountId: "acct-owner", updatedAt: "2026-05-05T00:00:00.000Z" });
    mockUseQuery.mockReturnValue(makeQueryResult([older, newer]));
    const html = renderToStaticMarkup(createElement(ClaimsPage));
    const posOlder = html.indexOf("Need c-old");
    const posNewer = html.indexOf("Need c-new");
    expect(posNewer).toBeLessThan(posOlder);
  });
});
