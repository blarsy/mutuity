import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import en from "../../src/locales/en/contribution.json";
import fr from "../../src/locales/fr/contribution.json";
import { CONTRIBUTION_OVERVIEW_QUERY } from "../../src/features/contribution/contribution.queries";
import ContributionPage from "../../src/pages/contribution";

const mockUseQuery = jest.fn();

jest.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => mockUseQuery(...args) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({
  useAuth: () => ({ session: { authenticated: true, account: { id: "viewer" } } })
}));
jest.mock("../../src/features/auth/requireAuth", () => ({
  useRequireAuth: () => ({ isAuthenticated: true })
}));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: ReactNode }) => createElement("a", { href }, children)
}));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      const copy: Record<string, string> = {
        "movements.gift_tokens_sent": "Gift sent",
        "movements.gift_tokens_received": "Gift received",
        "movementDetails.giftSent": "Sent to {{name}}",
        "movementDetails.giftReceived": "Received from {{name}}",
        "movementDetails.unknownAccount": "another account",
        ledgerEntriesCount: "{{count}} ledger entries",
        topesAmount: "{{amount}} Topes"
      };
      return (copy[key] ?? key).replace(/{{(\w+)}}/g, (_, name: string) => String(options?.[name] ?? ""));
    }
  })
}));

describe("Contribution gift history", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requests newest movements first with a stable tie-breaker, before pagination", () => {
    expect(CONTRIBUTION_OVERVIEW_QUERY.loc?.source.body).toContain("orderBy: [CREATED_AT_DESC, ID_DESC]");
    expect(CONTRIBUTION_OVERVIEW_QUERY.loc?.source.body).toContain("condition: { accountId: $viewerId }");
  });

  it.each([
    ["gift_tokens_sent", -7, { recipientName: "Bertrand" }, "Gift sent", "Sent to Bertrand", "-7 Topes"],
    ["gift_tokens_received", 7, { senderName: "Tope-là salle du trésor" }, "Gift received", "Received from Tope-là salle du trésor", "+7 Topes"]
  ])("renders %s with the counterparty and message", (eventType, amountDelta, payload, title, detail, amount) => {
    mockUseQuery.mockReturnValue({
      loading: false,
      refetch: jest.fn(),
      data: {
        currentTokenBalance: 53,
        allTokenMovements: {
          edges: [{ cursor: "cursor", node: {
            id: "gift", eventType, amountDelta, payload: { ...payload, message: "Coucou" },
            referenceType: "gift_transfer", referenceId: "transfer", createdAt: "2026-10-06T08:37:27Z"
          } }],
          totalCount: 39,
          pageInfo: { endCursor: "cursor", hasNextPage: true }
        }
      }
    });

    const html = renderToStaticMarkup(createElement(ContributionPage));
    expect(html).toContain(title);
    expect(html).toContain(detail);
    expect(html).toContain(amount);
    expect(html).toContain("Coucou");
    expect(html).toContain('data-testid="token-amount"');
    expect(html).toContain('aria-label="53 Topes"');
    expect(html).toContain("width:40px");
    expect(mockUseQuery).toHaveBeenCalledWith(CONTRIBUTION_OVERVIEW_QUERY, expect.objectContaining({
      variables: { first: 10, viewerId: "viewer" }
    }));
  });

  it.each([en, fr])("has localized gift labels and details", locale => {
    expect(locale.movements.gift_tokens_sent).toBeTruthy();
    expect(locale.movements.gift_tokens_received).toBeTruthy();
    expect(locale.movementDetails.giftSent).toContain("{{name}}");
    expect(locale.movementDetails.giftReceived).toContain("{{name}}");
  });
});