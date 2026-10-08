import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createInstance } from "i18next";

import en from "../../src/locales/en/notifications.json";
import fr from "../../src/locales/fr/notifications.json";
import NotificationsPage from "../../src/pages/notifications";
import { notificationUrlForEvent } from "../../src/features/notifications/notificationRouting";
import {
  buildNotificationsOverviewData,
  NOTIFICATION_FIXTURES
} from "../../src/stories/fixtures/notifications";

const mockUseQuery = jest.fn();
const mockI18n = createInstance();
void mockI18n.init({
  initAsync: false,
  lng: "en",
  fallbackLng: "en",
  defaultNS: "notifications",
  resources: { en: { notifications: en }, fr: { notifications: fr } },
  interpolation: { escapeValue: false }
});

jest.mock("@apollo/client/react", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: () => [jest.fn(), { loading: false }]
}));
jest.mock("next/router", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("../../src/features/auth/requireAuth", () => ({
  useRequireAuth: () => ({ isAuthenticated: true })
}));
jest.mock("../../src/services/graphql/accountEvents", () => ({ useAccountEventSignal: jest.fn() }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: mockI18n.t.bind(mockI18n) })
}));

const missingEvents = [
  ["claim_declined", "claimDeclined", "denied.svg"],
  ["claim_withdrawn", "claimWithdrawn", "gone.svg"],
  ["claim_expired", "claimExpired", "time-up.svg"],
  ["claim_need_deactivated", "claimNeedDeactivated", "gone.svg"],
  ["need_expired_claims_declined", "needExpiredClaimsDeclined", "time-up.svg"]
];

function renderNotification(eventType: string, payload: Record<string, unknown>) {
  mockUseQuery.mockReturnValue({
    loading: false,
    refetch: jest.fn(),
    data: buildNotificationsOverviewData([{ eventType, source: "need-claim", payload }])
  });
  return renderToStaticMarkup(createElement(NotificationsPage)).replaceAll("&#x27;", "'");
}

describe.each(["en", "fr"])("claim lifecycle notification copy (%s)", language => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await mockI18n.changeLanguage(language);
  });

  it.each(missingEvents)("renders %s with localized copy and its own icon", (eventType, key, icon) => {
    const html = renderNotification(eventType, { needName: "Community garden", declinedCount: 3 });
    expect(html).toContain(mockI18n.t(`events.${key}.headline1`));
    expect(html).toContain(mockI18n.t(`events.${key}.description`, { needName: "Community garden", count: 3 }));
    expect(html).toContain(`/topela/notifications/${icon}`);
    expect(html).not.toContain(eventType.replaceAll("_", " "));
  });

  it.each(missingEvents.slice(0, 4))("handles legacy %s payloads without names", eventType => {
    const html = renderNotification(eventType, { needId: "need-123" });
    expect(html).toContain(mockI18n.t("eventFallback.unknownNeed"));
    expect(html).not.toContain("undefined");
  });

  it.each([1, 3])("pluralizes the need-expiry summary for %i claims", count => {
    const html = renderNotification("need_expired_claims_declined", { declinedCount: count });
    const copy = language === "en" ? en : fr;
    const template = count === 1
      ? copy.events.needExpiredClaimsDeclined.description_one
      : copy.events.needExpiredClaimsDeclined.description_other;
    expect(html).toContain(template.replace("{{count}}", String(count)));
  });

  it.each(NOTIFICATION_FIXTURES.filter(item => item.eventType !== "some_future_event_type"))(
    "does not use raw event text for $eventType",
    fixture => {
      const html = renderNotification(fixture.eventType, fixture.payload);
      expect(html).not.toContain(fixture.eventType.replaceAll("_", " "));
      expect(html).not.toContain("events.fallback");
      expect(html).not.toMatch(/events\.[\w]+\.(headline1|headline2|description)/);
    }
  );

  it("retains the generic fallback for unknown future events", () => {
    expect(renderNotification("future_event", {})).toContain("future event");
  });
});

describe("claim lifecycle notification routing", () => {
  it.each(["claim_created", "claim_settled", ...missingEvents.map(([eventType]) => eventType)])(
    "opens the referenced claim for %s, with a claims-workspace fallback",
    eventType => {
      expect(notificationUrlForEvent(eventType, { needClaimId: "claim/123" })).toBe(
        "/claims?claimId=claim%2F123"
      );
      expect(notificationUrlForEvent(eventType, {})).toBe("/claims");
    }
  );
});