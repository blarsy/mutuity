import { renderToStaticMarkup } from "react-dom/server";
import { CampaignModerationListingGroup } from "../../src/features/campaigns/CampaignModerationListingGroup";
import { formatPublicDateTime } from "../../src/features/shared/publicDateTime";
import en from "../../src/locales/en/campaigns.json";
import fr from "../../src/locales/fr/campaigns.json";

let mockLanguage: "en" | "fr" = "en";
jest.mock("react-i18next", () => ({ useTranslation: () => ({
  i18n: { language: mockLanguage },
  t: (key: string, values?: { date?: string }) => {
    const locale = mockLanguage === "fr" ? fr : en;
    const value = key.split(".").reduce<unknown>((object, part) => (object as Record<string, unknown>)[part], locale);
    return String(value).replace("{{date}}", values?.date ?? "");
  }
}) }));

const pending = { id: "pending", status: "PENDING" as const, submittedAt: "2026-01-03T10:00:00Z", actedAt: null };
const accepted = { id: "accepted", status: "ACCEPTED" as const, submittedAt: "2026-01-01T10:00:00Z", actedAt: "2026-01-04T10:00:00Z" };
const rejected = { id: "rejected", status: "REJECTED" as const, submittedAt: "2026-01-02T10:00:00Z", actedAt: "2026-01-05T10:00:00Z" };

describe("campaign moderation listing groups", () => {
  beforeEach(() => { mockLanguage = "en"; });

  it("mixes pending and accepted newest-action first, leaves input untouched and renders below-card actions", () => {
    const items = [pending, accepted];
    const actions = jest.fn(item => <button>{`action-${item.id}`}</button>);
    const html = renderToStaticMarkup(<CampaignModerationListingGroup items={items}
      getKey={item => item.id} rejectedLabel="Rejected resources"
      renderCard={item => <div data-card={item.id}>{`card-${item.id}`}</div>} renderActions={actions} />);

    expect(html.indexOf("card-accepted")).toBeLessThan(html.indexOf("card-pending"));
    expect(items).toEqual([pending, accepted]);
    expect(html).toContain(formatPublicDateTime(pending.submittedAt, "en"));
    expect(html).toContain(formatPublicDateTime(accepted.actedAt, "en"));
    expect(html.indexOf("Last action:")).toBeLessThan(html.indexOf("card-accepted"));
    expect(html.indexOf("card-pending")).toBeLessThan(html.indexOf("action-pending"));
    expect(actions).toHaveBeenCalledTimes(1);
    expect(actions).toHaveBeenCalledWith(pending);
    expect(html).toContain("MuiDivider-root");
    expect(html).toContain("MuiChip-outlinedDefault");
    expect(html).not.toContain("MuiChip-colorSuccess");
    expect(html).not.toContain("MuiChip-colorWarning");
  });

  it.each(["en", "fr"] as const)("keeps rejected cards collapsed by default with %s labels", language => {
    mockLanguage = language;
    const locale = language === "fr" ? fr : en;
    const actions = jest.fn(() => <button>action</button>);
    const html = renderToStaticMarkup(<CampaignModerationListingGroup items={[rejected, accepted]}
      getKey={item => item.id} rejectedLabel={locale.moderationListings.rejectedNeeds}
      renderCard={item => <div>{`card-${item.id}`}</div>} renderActions={actions} />);

    expect(html).toContain(locale.moderationListings.rejectedNeeds);
    expect(html).toContain("(1)");
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("card-accepted");
    expect(html).not.toContain("card-rejected");
    expect(html).toContain(locale.listingLifecycle.status.ACCEPTED);
    expect(actions).not.toHaveBeenCalled();
  });

  it("omits an empty rejected accordion and superseded cards", () => {
    const html = renderToStaticMarkup(<CampaignModerationListingGroup
      items={[{ ...pending, status: "SUPERSEDED" as const }]}
      getKey={item => item.id} rejectedLabel="Rejected resources"
      renderCard={() => <div>hidden</div>} renderActions={() => null} />);
    expect(html).not.toContain("Rejected resources");
    expect(html).not.toContain("hidden");
  });

  it("provides newest-action-first rejected contents without moderation actions when expanded", () => {
    const actions = jest.fn(() => <button>action</button>);
    // Inspect/render the accordion's supplied contents; expansion itself is MUI's responsibility.
    function ExpandedContents() {
      const tree = CampaignModerationListingGroup({
        items: [rejected, { ...rejected, id: "latest", actedAt: "2026-01-06T10:00:00Z" }],
        getKey: item => item.id, rejectedLabel: "Rejected resources",
        renderCard: item => <div>{`card-${item.id}`}</div>, renderActions: actions
      });
      const accordion = tree.props.children[1];
      expect(accordion.props.defaultExpanded).toBe(false);
      expect(accordion.props.TransitionProps.unmountOnExit).toBe(true);
      return accordion.props.children[1];
    }
    const html = renderToStaticMarkup(<ExpandedContents />);
    expect(html.indexOf("card-latest")).toBeLessThan(html.indexOf("card-rejected"));
    expect(actions).not.toHaveBeenCalled();
  });
});