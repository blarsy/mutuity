import i18n from "../../../src/i18n";
import { apolloClient } from "../../../src/services/graphql/client";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "../../../src/services/graphql/notifications";
import {
  ACCOUNT_NOTIFICATIONS_QUERY,
  NEED_CLAIM_NOTIFICATIONS_QUERY,
  RESOURCE_BID_NOTIFICATIONS_QUERY,
  MARK_ACCOUNT_NOTIFICATION_READ_MUTATION,
  MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
  MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION
} from "../../../src/services/graphql/operations";
import en from "../../../src/i18n/locales/en/us4.json";
import fr from "../../../src/i18n/locales/fr/us4.json";

jest.mock("../../../src/services/graphql/client", () => ({
  apolloClient: { query: jest.fn(), mutate: jest.fn() }
}));
jest.mock("../../../src/i18n", () => {
  const instance = require("i18next").createInstance();
  void instance.init({
    initAsync: false,
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: { us4: require("../../../src/i18n/locales/en/us4.json") },
      fr: { us4: require("../../../src/i18n/locales/fr/us4.json") }
    }
  });
  return { __esModule: true, default: instance };
});

const events = [
  ["claim_created", "claimCreated", "need-claim"],
  ["claim_settled", "claimSettled", "need-claim"],
  ["claim_declined", "claimDeclined", "need-claim"],
  ["claim_withdrawn", "claimWithdrawn", "need-claim"],
  ["claim_expired", "claimExpired", "need-claim"],
  ["claim_need_deactivated", "claimNeedDeactivated", "need-claim"],
  ["need_expired_claims_declined", "needExpiredClaimsDeclined", "need-claim"],
  ["resource_bid_created", "resourceBidCreated", "resource-bid"],
  ["resource_bid_accepted", "resourceBidAccepted", "resource-bid"],
  ["resource_bid_declined", "resourceBidDeclined", "resource-bid"],
  ["resource_bid_cancelled", "resourceBidCancelled", "resource-bid"],
  ["resource_bid_expired", "resourceBidExpired", "resource-bid"],
  ["resource_bid_expiring_soon", "resourceBidExpiringSoon", "resource-bid"],
  ["gift_tokens_received", "giftTokensReceived", "account"],
  ["campaign_airdrop_coming_soon", "campaignAirdropComingSoon", "account"],
  ["campaign_airdrop_done", "campaignAirdropDone", "account"],
  ["welcome_profile_reward", "welcomeProfileReward", "account"],
  ["campaign_approved", "campaignApproved", "account"],
  ["campaign_moderation_note_received", "campaignModerationNoteReceived", "account"],
  ["campaign_creator_adaptation_submitted", "campaignCreatorAdaptationSubmitted", "account"]
] as const;

const payload = {
  needId: "need-123", needName: "Community garden", resourceName: "Cargo bike",
  campaignName: "Local project", claimerDisplayName: "Alice", bidderDisplayName: "Bob",
  responderDisplayName: "Charlie", creatorName: "Dana", senderName: "Erin",
  amountReceived: 30, declinedCount: 3, noteBody: "Please add a photo", airdropAt: "2026-10-08T12:00:00Z"
};

function mockFeed(eventType: string, source: string, eventPayload: unknown) {
  const node = { id: "notification-123", eventType, payload: eventPayload, createdAt: "2026-10-07T12:00:00Z", readAt: null };
  (apolloClient.query as jest.Mock).mockImplementation(({ query }) => Promise.resolve({ data: {
    ...(query === ACCOUNT_NOTIFICATIONS_QUERY ? {
      allAccountNotifications: { nodes: source === "account" ? [node] : [], pageInfo: { hasNextPage: false, endCursor: null } }
    } : {}),
    ...(query === NEED_CLAIM_NOTIFICATIONS_QUERY ? { allNeedClaimNotifications: { nodes: source === "need-claim" ? [node] : [] } } : {}),
    ...(query === RESOURCE_BID_NOTIFICATIONS_QUERY ? { allResourceBidNotifications: { nodes: source === "resource-bid" ? [node] : [] } } : {})
  } }));
}

describe.each(["en", "fr"])("mobile notification formatting (%s)", language => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage(language);
  });

  it.each(events)("formats %s from its correct notification source", async (eventType, key, source) => {
    mockFeed(eventType, source, payload);
    const { items } = await fetchNotifications("viewer");
    const item = items[0]!;
    expect(item.source).toBe(source);
    expect(item.payload).toEqual(payload);
    expect(item.headline1).toBe(i18n.t(`notifications.events.${key}.headline1`, { ns: "us4" }));
    expect(item.headline1).not.toBe(eventType);
    expect(`${item.headline1} ${item.headline2} ${item.description}`).not.toMatch(/notifications\.|undefined|{{/);
  });

  it.each(["claim_declined", "claim_withdrawn", "claim_expired", "claim_need_deactivated"])(
    "handles legacy %s payloads without a need name",
    async eventType => {
      mockFeed(eventType, "need-claim", { needId: "need-123" });
      expect((await fetchNotifications("viewer")).items[0]?.description)
        .toBe(i18n.t("notifications.unknownNeed", { ns: "us4" }));
    }
  );

  it.each([1, 3])("pluralizes expiry summaries for %i claims", async count => {
    mockFeed("need_expired_claims_declined", "need-claim", { declinedCount: count });
    const locale = language === "en" ? en : fr;
    const template = count === 1 ? locale.notifications.events.needExpiredClaimsDeclined.description_one
      : locale.notifications.events.needExpiredClaimsDeclined.description_other;
    expect((await fetchNotifications("viewer")).items[0]?.description).toBe(template.replace("{{count}}", String(count)));
  });

  it("uses a translated fallback for unknown events", async () => {
    mockFeed("some_future_event", "account", null);
    const item = (await fetchNotifications("viewer")).items[0]!;
    expect(item.headline1).toBe("Notification");
    expect(item.description).toBe("some future event");
  });

  it.each([null, {}, { airdropAt: "not-a-date" }])("does not crash on incomplete airdrop payloads: %j", async eventPayload => {
    mockFeed("campaign_airdrop_coming_soon", "account", eventPayload);
    const item = (await fetchNotifications("viewer")).items[0]!;
    expect(item.headline2).toBe(i18n.t("notifications.unknownCampaign", { ns: "us4" }));
  });
});

describe("mobile notification read state and pagination", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    ["account", MARK_ACCOUNT_NOTIFICATION_READ_MUTATION],
    ["need-claim", MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION],
    ["resource-bid", MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION]
  ] as const)("marks %s notifications read via the matching mutation", async (source, mutation) => {
    await markNotificationRead("notification-123", source);
    expect(apolloClient.mutate).toHaveBeenCalledWith({ mutation, variables: { input: { notificationId: "notification-123" } } });
  });

  it("marks all notifications read", async () => {
    await markAllNotificationsRead();
    expect(apolloClient.mutate).toHaveBeenCalledWith({ mutation: MARK_ALL_NOTIFICATIONS_READ_MUTATION, variables: { input: {} } });
  });

  it("does not duplicate secondary-source notifications when loading earlier account events", async () => {
    mockFeed("claim_withdrawn", "need-claim", payload);
    expect((await fetchNotifications("viewer")).items).toHaveLength(1);
    jest.clearAllMocks();
    expect((await fetchNotifications("viewer", "cursor")).items).toHaveLength(0);
    expect(apolloClient.query).toHaveBeenCalledTimes(1);
    expect(apolloClient.query).toHaveBeenCalledWith(expect.objectContaining({
      query: ACCOUNT_NOTIFICATIONS_QUERY,
      variables: { condition: { recipientAccountId: "viewer" }, first: 50, after: "cursor" }
    }));
  });
});