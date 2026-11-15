import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInstance } from "i18next";
import en from "../../src/locales/en/notifications.json";
import fr from "../../src/locales/fr/notifications.json";
import NotificationsPage from "../../src/pages/notifications";
import { notificationUrlForEvent } from "../../src/features/notifications/notificationRouting";

const mockUseQuery = jest.fn();
const mockI18n = createInstance();
void mockI18n.init({ initAsync: false, lng: "en", fallbackLng: false, defaultNS: "notifications",
  resources: { en: { notifications: en }, fr: { notifications: fr } }, interpolation: { escapeValue: false } });
jest.mock("@apollo/client/react", () => ({ useQuery: (...args: unknown[]) => mockUseQuery(...args), useMutation: () => [jest.fn(), { loading: false }] }));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({ useRequireAuth: () => ({ isAuthenticated: true }) }));
jest.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ session: { account: { id: "viewer" } } }) }));
jest.mock("../../src/features/notifications/useUnreadNotifications", () => ({ useUnreadNotifications: () => ({ count: 1, refetch: jest.fn() }) }));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("react-i18next", () => ({ useTranslation: () => ({ t: mockI18n.t.bind(mockI18n) }) }));

const events = [
  ["campaign_listing_pending", "campaignListingPending", "moderation.svg"],
  ["campaign_listing_accepted", "campaignListingAccepted", "prize-won.svg"],
  ["campaign_listing_rejected", "campaignListingRejected", "denied.svg"]
] as const;
function renderNotification(eventType: string, payload: Record<string, unknown>) {
  mockUseQuery.mockReturnValue({ loading: false, refetch: jest.fn(), data: {
    allAccountNotifications: { nodes: [{ id: "notice", eventType, payload, createdAt: "2026-11-14T12:00:00Z", readAt: null }], pageInfo: {} },
    allNeedClaimNotifications: { nodes: [], pageInfo: {} }, allResourceBidNotifications: { nodes: [], pageInfo: {} }
  } });
  return renderToStaticMarkup(createElement(NotificationsPage));
}

describe.each(["en", "fr"])("campaign listing notifications (%s)", language => {
  beforeEach(async () => { jest.clearAllMocks(); await mockI18n.changeLanguage(language); });
  it.each(events)("renders %s with dedicated localized copy and artwork", (eventType, key, icon) => {
    for (const listingKind of ["need", "resource"]) {
      const html = renderNotification(eventType, { listingKind, campaignName: "Autumn", listingName: "Garden tools", rejectionNote: "Owner-only feedback" });
      expect(html).toContain(mockI18n.t(`events.${key}.headline1`));
      expect(html).toContain("Autumn");
      expect(html).toContain("Garden tools");
      expect(html).toContain(mockI18n.t(`listingKind.${listingKind}`));
      expect(html).toContain(`/topela/notifications/${icon}`);
      expect(html).not.toMatch(/events\.|undefined|\{\{/);
      if (eventType === "campaign_listing_rejected") {
        expect(html).toContain(mockI18n.t("privateFeedback", { note: "Owner-only feedback" }));
      } else expect(html).not.toContain("Owner-only feedback");
    }
  });
  it.each([null, "", "  ", 42])("handles absent/malformed private feedback %j", rejectionNote => {
    const html = renderNotification("campaign_listing_rejected", { listingKind: "need", rejectionNote });
    expect(html).toContain(mockI18n.t("eventFallback.unknownNeed"));
    expect(html).not.toContain(mockI18n.t("privateFeedback", { note: "" }));
  });
  it("renders private feedback as escaped text, not markup", () => {
    const html = renderNotification("campaign_listing_rejected", { rejectionNote: "<script>alert(1)</script>\nDetails" });
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
    expect(html).toContain("Details");
  });
});

describe("campaign listing URLs", () => {
  it("targets campaign moderation for pending submissions", () => {
    expect(notificationUrlForEvent("campaign_listing_pending", { campaignId: "campaign/1", url: "https://untrusted.invalid" }))
      .toBe("/campaigns/campaign%2F1/moderation");
  });
  it.each([
    ["need", "/needs/create?needId=listing%2F1", "/needs/listing%2F1"],
    ["resource", "/resources/create?resourceId=listing%2F1", "/resources/listing%2F1"]
  ])("opens rejected %s in the owner editor, not its public page", (listingKind, editUrl, publicUrl) => {
    expect(notificationUrlForEvent("campaign_listing_rejected", { listingKind, listingId: "listing/1", submissionId: "wrong", url: "/wrong" }))
      .toBe(editUrl);
    expect(notificationUrlForEvent("campaign_listing_accepted", { listingKind, listingId: "listing/1" }))
      .toBe(publicUrl);
  });
  it.each([{}, { listingId: "x" }, { listingId: "x", listingKind: "other" }])("does not trust arbitrary URLs on malformed payloads %j", payload => {
    expect(notificationUrlForEvent("campaign_listing_rejected", { ...payload, url: "https://untrusted.invalid" })).toBe("/notifications");
  });
});