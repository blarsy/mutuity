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
const mockPush = jest.fn();
const mockCardProps = jest.fn();

jest.mock("../../src/features/needs/NeedClaimManagementPage", () => ({ NeedClaimManagementPage: () => null }));
jest.mock("../../src/graphql/generated", () => ({
  ...jest.requireActual("../../src/graphql/generated"),
  ViewerClaimOverviewDocument: CLAIM_OVERVIEW_QUERY_DOC
}));

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) =>
    createElement("a", { href }, children)
}));

jest.mock("next/router", () => ({
  useRouter: () => ({ query: {}, push: mockPush })
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
  NeedCard: (props: {
    title: string;
    actions: ReactNode;
    chips: ReactNode;
    creatorName: string;
    description: ReactNode;
    footer: ReactNode;
    onListingClick?: () => void;
    onCreatorClick?: () => void;
  }) => {
    mockCardProps(props);
    const { title, actions, chips, creatorName, description, footer } = props;
    return createElement("section", null,
    createElement("h3", null, title),
    createElement("div", null, creatorName),
    createElement("div", null, chips),
    createElement("div", null, description),
    createElement("div", null, footer),
    createElement("div", null, actions)
    );
  }
}));

jest.mock("../../src/features/needs/NeedClaimStatusChip", () => ({
  NeedClaimStatusChip: () => createElement("span", null, "status")
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      const dict: Record<string, string> = {
        title: "Claims",
        workspaceTitle: "Claims workspace",
        workspaceSubtitle: "Track claims",
        loading: "Loading",
        sentCount: "sent",
        receivedCount: "received",
        notificationsCount: "notifications",
        noDateYet: "No date",
        sentSection: "Sent section",
        receivedSection: "Received section",
        sentEmpty: "No sent claims",
        receivedEmpty: "No received claims",
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
        topesAmount: "Topes",
        noTopes: "No Topes",
        "actions.viewClaim": "View claim",
        "actions.reviewClaim": "Review claim",
        "actions.chat": "Chat"
      };

      if (key === "topesAmount") return `${String(opts?.amount ?? "")}`;
      return dict[key] ?? key;
    }
  })
}));

function buildClaim(overrides: Partial<ClaimNode> & { id: string; needId: string; claimerAccountId: string; creatorAccountId: string }): ClaimNode {
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

describe("ClaimsPage navigation links", () => {
  beforeEach(() => {
    mockCardProps.mockClear();
    mockPush.mockClear();
  });
  it("sent claim card links to need, need owner, and chat when conversation exists", () => {
    const sentClaim = buildClaim({
      id: "claim-sent-1",
      needId: "need-1",
      claimerAccountId: "acct-me",
      creatorAccountId: "acct-owner-1",
      claimConversationsByNeedClaimId: { nodes: [{ id: "conv-need-1" }] }
    });

    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === CLAIM_OVERVIEW_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          refetch: jest.fn(),
          data: {
            sentNeedClaims: { nodes: [sentClaim] },
            receivedNeedClaims: { nodes: [] },
            allNeedClaimNotifications: { nodes: [] }
          }
        };
      }
      return { loading: false, data: undefined };
    });

    const { default: ClaimsPage } = require("../../src/pages/claims");
    const markup = renderToStaticMarkup(createElement(ClaimsPage));

    const props = mockCardProps.mock.calls[0][0];
    props.onListingClick();
    props.onCreatorClick();
    expect(mockPush).toHaveBeenCalledWith("/needs/need-1");
    expect(mockPush).toHaveBeenCalledWith("/accounts/acct-owner-1");
    expect(markup).toContain('href="/chat?kind=need&amp;id=conv-need-1"');
  });

  it("sent claim card opens a draft addressed to the need owner when no conversation exists", () => {
    const sentClaim = buildClaim({
      id: "claim-sent-2",
      needId: "need-2",
      claimerAccountId: "acct-me",
      creatorAccountId: "acct-owner-2"
    });

    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === CLAIM_OVERVIEW_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          refetch: jest.fn(),
          data: {
            sentNeedClaims: { nodes: [sentClaim] },
            receivedNeedClaims: { nodes: [] },
            allNeedClaimNotifications: { nodes: [] }
          }
        };
      }
      return { loading: false, data: undefined };
    });

    const { default: ClaimsPage } = require("../../src/pages/claims");
    const markup = renderToStaticMarkup(createElement(ClaimsPage));

    expect(markup).toContain('href="/chat?kind=need&amp;draft=1&amp;contextId=need-2&amp;otherAccountId=acct-owner-2');
    expect(markup).toContain("needClaimId=claim-sent-2");
  });

  it("received claim card links to need, claimer account, and chat when conversation exists", () => {
    const receivedClaim = buildClaim({
      id: "claim-received-1",
      needId: "need-3",
      claimerAccountId: "acct-claimer-1",
      creatorAccountId: "acct-me",
      claimConversationsByNeedClaimId: { nodes: [{ id: "conv-need-3" }] }
    });

    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === CLAIM_OVERVIEW_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          refetch: jest.fn(),
          data: {
            sentNeedClaims: { nodes: [] },
            receivedNeedClaims: { nodes: [receivedClaim] },
            allNeedClaimNotifications: { nodes: [] }
          }
        };
      }
      return { loading: false, data: undefined };
    });

    const { default: ClaimsPage } = require("../../src/pages/claims");
    const markup = renderToStaticMarkup(createElement(ClaimsPage));

    const props = mockCardProps.mock.calls[0][0];
    props.onListingClick();
    props.onCreatorClick();
    expect(mockPush).toHaveBeenCalledWith("/needs/need-3");
    expect(mockPush).toHaveBeenCalledWith("/accounts/acct-claimer-1");
    expect(markup).toContain('href="/chat?kind=need&amp;id=conv-need-3"');
  });

  it("received claim card opens a draft addressed to the claimer when no conversation exists", () => {
    const receivedClaim = buildClaim({
      id: "claim-received-2",
      needId: "need-4",
      claimerAccountId: "acct-claimer-2",
      creatorAccountId: "acct-me"
    });

    mockUseQuery.mockImplementation((query: unknown) => {
      if (query === CLAIM_OVERVIEW_QUERY_DOC) {
        return {
          loading: false,
          error: undefined,
          refetch: jest.fn(),
          data: {
            sentNeedClaims: { nodes: [] },
            receivedNeedClaims: { nodes: [receivedClaim] },
            allNeedClaimNotifications: { nodes: [] }
          }
        };
      }
      return { loading: false, data: undefined };
    });

    const { default: ClaimsPage } = require("../../src/pages/claims");
    const markup = renderToStaticMarkup(createElement(ClaimsPage));

    expect(markup).toContain('href="/chat?kind=need&amp;draft=1&amp;contextId=need-4&amp;otherAccountId=acct-claimer-2');
    expect(markup).toContain("needClaimId=claim-received-2");
  });
});
