import i18n from "../../i18n";
import { apolloClient } from "./client";
import { signalAccountRefresh } from "../realtime/accountEvents";
import {
  type MarkAccountNotificationReadInput,
  type MarkAllNotificationsReadInput,
  type MarkNeedClaimNotificationReadInput,
  type MarkResourceBidNotificationReadInput,
  type Mutation,
  type QueryAllAccountNotificationsArgs
} from "./generated";
import {
  ACCOUNT_NOTIFICATIONS_QUERY,
  COUNT_UNREAD_NOTIFICATIONS_QUERY,
  MARK_ACCOUNT_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
  MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION,
  NEED_CLAIM_NOTIFICATIONS_QUERY,
  RESOURCE_BID_NOTIFICATIONS_QUERY
} from "./operations";
import type { NotificationFeedItem, NotificationSource } from "../../screens/notifications/NotificationsScreen";

const DEFAULT_PAGE_SIZE = 50;

export interface NotificationPage {
  items: NotificationFeedItem[];
  endCursor: string | null;
  hasNextPage: boolean;
}

interface RawNotificationNode {
  id: string;
  eventType: string;
  payload: unknown;
  createdAt: string;
  readAt: string | null;
}

interface AccountNotificationsQueryResult {
  allAccountNotifications: {
    nodes: RawNotificationNode[];
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
}

interface NeedClaimNotificationsQueryResult {
  allNeedClaimNotifications: { nodes: RawNotificationNode[]; pageInfo?: { hasNextPage: boolean } } | null;
}

interface ResourceBidNotificationsQueryResult {
  allResourceBidNotifications: { nodes: RawNotificationNode[]; pageInfo?: { hasNextPage: boolean } } | null;
}

interface MarkAccountNotificationReadMutationResult {
  markAccountNotificationRead: Pick<Mutation, "markAccountNotificationRead">["markAccountNotificationRead"];
}

interface MarkAllNotificationsReadMutationResult {
  markAllNotificationsRead: Pick<Mutation, "markAllNotificationsRead">["markAllNotificationsRead"];
}

interface MarkNeedClaimNotificationReadMutationResult {
  markNeedClaimNotificationRead: Pick<Mutation, "markNeedClaimNotificationRead">["markNeedClaimNotificationRead"];
}

interface MarkResourceBidNotificationReadMutationResult {
  markResourceBidNotificationRead: Pick<Mutation, "markResourceBidNotificationRead">["markResourceBidNotificationRead"];
}

function asText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

function formatDate(value: unknown): string {
  const text = typeof value === "string" ? value : null;
  if (!text) {
    return "";
  }
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(date);
}

interface NotificationCopy {
  headline1: string;
  headline2: string;
  description: string;
}

// Formats every notification event type (account, need-claim, resource-bid tables) into the
// headline1/headline2/description triple used by the Tope-là inspired notification row layout.
function formatNotificationCopy(eventType: string, payload: unknown): NotificationCopy {
  const p = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};
  const someone = i18n.t("notifications.someone", { ns: "us4", defaultValue: "Someone" });
  const unknownNeed = i18n.t("notifications.unknownNeed", { ns: "us4", defaultValue: "your need" });
  const unknownResource = i18n.t("notifications.unknownResource", { ns: "us4", defaultValue: "your resource" });
  const unknownCampaign = i18n.t("notifications.unknownCampaign", { ns: "us4", defaultValue: "your campaign" });
  const needName = asText(p.needName, asText(p.needTitle, unknownNeed));

  const translateEvent = (key: string, vars: Record<string, unknown>, defaults: NotificationCopy): NotificationCopy => ({
    headline1: i18n.t(`notifications.events.${key}.headline1`, { ns: "us4", defaultValue: defaults.headline1, ...vars }),
    headline2: i18n.t(`notifications.events.${key}.headline2`, { ns: "us4", defaultValue: defaults.headline2, ...vars }),
    description: i18n.t(`notifications.events.${key}.description`, { ns: "us4", defaultValue: defaults.description, ...vars })
  });

  switch (eventType) {
    case "gift_tokens_received":
      return translateEvent("giftTokensReceived", { senderName: asText(p.senderName, someone), amount: asNumber(p.amountReceived) }, {
        headline1: "Topes received!",
        headline2: asText(p.senderName, someone),
        description: `${asNumber(p.amountReceived)} Topes sent your way`
      });
    case "campaign_airdrop_coming_soon":
      return translateEvent("campaignAirdropComingSoon", { campaignName: asText(p.campaignName, unknownCampaign), date: formatDate(p.airdropAt) }, {
        headline1: "Airdrop coming soon",
        headline2: asText(p.campaignName, ""),
        description: `Lands on ${formatDate(p.airdropAt)}`
      });
    case "campaign_airdrop_done":
      return translateEvent("campaignAirdropDone", { campaignName: asText(p.campaignName, ""), amount: asNumber(p.amountReceived) }, {
        headline1: "Airdrop received!",
        headline2: asText(p.campaignName, ""),
        description: `${asNumber(p.amountReceived)} Topes`
      });
    case "welcome_profile_reward":
      return translateEvent("welcomeProfileReward", {}, {
        headline1: "Welcome to Tope-là!",
        headline2: "Complete your profile",
        description: "Earn Topes for a polished profile."
      });
    case "campaign_approved":
      return translateEvent("campaignApproved", { campaignName: asText(p.campaignName, "") }, {
        headline1: "Campaign approved",
        headline2: asText(p.campaignName, ""),
        description: "Your campaign is now live."
      });
    case "campaign_moderation_note_received":
      return translateEvent("campaignModerationNoteReceived", { campaignName: asText(p.campaignName, ""), noteBody: asText(p.noteBody, "") }, {
        headline1: "Moderation note",
        headline2: asText(p.campaignName, ""),
        description: asText(p.noteBody, "")
      });
    case "campaign_creator_adaptation_submitted":
      return translateEvent("campaignCreatorAdaptationSubmitted", { creatorName: asText(p.creatorName, someone), campaignName: asText(p.campaignName, "") }, {
        headline1: "Campaign updated",
        headline2: asText(p.creatorName, someone),
        description: asText(p.campaignName, "")
      });
    case "claim_created":
      return translateEvent("claimCreated", { claimerName: asText(p.claimerDisplayName, someone), needName: asText(p.needName, unknownNeed) }, {
        headline1: "New claim",
        headline2: asText(p.claimerDisplayName, someone),
        description: asText(p.needName, unknownNeed)
      });
    case "claim_settled":
      return translateEvent("claimSettled", { needName: asText(p.needName, unknownNeed) }, {
        headline1: "Claim settled",
        headline2: "",
        description: asText(p.needName, unknownNeed)
      });
    case "claim_declined":
      return translateEvent("claimDeclined", { needName }, { headline1: "Claim declined", headline2: "", description: needName });
    case "claim_withdrawn":
      return translateEvent("claimWithdrawn", { needName }, {
        headline1: "Claim withdrawn",
        headline2: "The claimer withdrew their offer to help",
        description: needName
      });
    case "claim_expired":
      return translateEvent("claimExpired", { needName }, {
        headline1: "Claim expired",
        headline2: "The need has expired",
        description: needName
      });
    case "claim_need_deactivated":
      return translateEvent("claimNeedDeactivated", { needName }, {
        headline1: "Claim closed",
        headline2: "The need was deactivated",
        description: needName
      });
    case "need_expired_claims_declined": {
      const count = asNumber(p.declinedCount);
      return translateEvent("needExpiredClaimsDeclined", { count }, {
        headline1: "Your need has expired",
        headline2: "",
        description: `${count} open ${count === 1 ? "claim was" : "claims were"} closed`
      });
    }
    case "resource_bid_created":
      return translateEvent("resourceBidCreated", { bidderName: asText(p.bidderDisplayName, someone), resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "New bid",
        headline2: asText(p.bidderDisplayName, someone),
        description: asText(p.resourceName, unknownResource)
      });
    case "resource_bid_accepted":
      return translateEvent("resourceBidAccepted", { responderName: asText(p.responderDisplayName, someone), resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "Bid accepted",
        headline2: asText(p.responderDisplayName, someone),
        description: asText(p.resourceName, unknownResource)
      });
    case "resource_bid_declined":
      return translateEvent("resourceBidDeclined", { responderName: asText(p.responderDisplayName, someone), resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "Bid declined",
        headline2: asText(p.responderDisplayName, someone),
        description: asText(p.resourceName, unknownResource)
      });
    case "resource_bid_expired":
      return translateEvent("resourceBidExpired", { resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "Bid expired",
        headline2: "",
        description: asText(p.resourceName, unknownResource)
      });
    case "resource_bid_cancelled":
      return translateEvent("resourceBidCancelled", { resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "Bid cancelled",
        headline2: "",
        description: asText(p.resourceName, unknownResource)
      });
    case "resource_bid_expiring_soon":
      return translateEvent("resourceBidExpiringSoon", { resourceName: asText(p.resourceName, unknownResource) }, {
        headline1: "Bid expiring soon",
        headline2: "",
        description: asText(p.resourceName, unknownResource)
      });
    default:
      return translateEvent("fallback", { eventType: eventType.replaceAll("_", " ") }, {
        headline1: "Notification",
        headline2: "",
        description: eventType.replaceAll("_", " ")
      });
  }
}

function toFeedItem(source: NotificationSource, node: RawNotificationNode): NotificationFeedItem {
  const copy = formatNotificationCopy(node.eventType, node.payload);

  return {
    id: node.id,
    source,
    eventType: node.eventType,
    headline1: copy.headline1,
    headline2: copy.headline2,
    description: copy.description,
    createdAt: node.createdAt,
    readAt: node.readAt,
    payload: typeof node.payload === "object" && node.payload !== null ? node.payload as Record<string, unknown> : null
  } satisfies NotificationFeedItem;
}

export async function fetchNotifications(accountId: string, after?: string | null): Promise<NotificationPage> {
  const variables: QueryAllAccountNotificationsArgs = {
    condition: { recipientAccountId: accountId },
    first: DEFAULT_PAGE_SIZE,
    ...(after ? { after } : {})
  };

  // Need-claim / resource-bid notifications aren't cursor-paginated here; only merge them on a full reload.
  const shouldMergeSecondarySources = !after;

  const [accountResult, needClaimResult, resourceBidResult] = await Promise.all([
    apolloClient.query<AccountNotificationsQueryResult, QueryAllAccountNotificationsArgs>({
      query: ACCOUNT_NOTIFICATIONS_QUERY,
      variables,
      fetchPolicy: "network-only"
    }),
    shouldMergeSecondarySources
      ? apolloClient.query<NeedClaimNotificationsQueryResult>({
        query: NEED_CLAIM_NOTIFICATIONS_QUERY,
        variables: { first: DEFAULT_PAGE_SIZE },
        fetchPolicy: "network-only"
      })
      : null,
    shouldMergeSecondarySources
      ? apolloClient.query<ResourceBidNotificationsQueryResult>({
        query: RESOURCE_BID_NOTIFICATIONS_QUERY,
        variables: { first: DEFAULT_PAGE_SIZE },
        fetchPolicy: "network-only"
      })
      : null
  ]);

  const connection = accountResult.data?.allAccountNotifications;

  const items = [
    ...(connection?.nodes ?? []).map((node) => toFeedItem("account", node)),
    ...(needClaimResult?.data?.allNeedClaimNotifications?.nodes ?? []).map((node) => toFeedItem("need-claim", node)),
    ...(resourceBidResult?.data?.allResourceBidNotifications?.nodes ?? []).map((node) => toFeedItem("resource-bid", node))
  ].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return {
    items,
    endCursor: connection?.pageInfo.endCursor ?? null,
    hasNextPage: connection?.pageInfo.hasNextPage ?? false
  };
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const { data } = await apolloClient.query<{ countUnreadNotifications: number | null }>({
    query: COUNT_UNREAD_NOTIFICATIONS_QUERY, fetchPolicy: "network-only"
  });
  if (typeof data?.countUnreadNotifications !== "number") throw new Error("Unread count unavailable");
  return data.countUnreadNotifications;
}

/** Re-fetch an expanded, chronological window in every source; preserve it on realtime updates. */
export async function fetchNotificationWindow(accountId: string, first = DEFAULT_PAGE_SIZE): Promise<NotificationPage> {
  const [account, claims, bids] = await Promise.all([
    apolloClient.query<AccountNotificationsQueryResult>({ query: ACCOUNT_NOTIFICATIONS_QUERY,
      variables: { condition: { recipientAccountId: accountId }, first }, fetchPolicy: "network-only" }),
    apolloClient.query<NeedClaimNotificationsQueryResult>({ query: NEED_CLAIM_NOTIFICATIONS_QUERY,
      variables: { first, condition: { recipientAccountId: accountId } }, fetchPolicy: "network-only" }),
    apolloClient.query<ResourceBidNotificationsQueryResult>({ query: RESOURCE_BID_NOTIFICATIONS_QUERY,
      variables: { first, condition: { recipientAccountId: accountId } }, fetchPolicy: "network-only" })
  ]);
  if (!account.data?.allAccountNotifications || !claims.data?.allNeedClaimNotifications || !bids.data?.allResourceBidNotifications) {
    throw new Error("Notification feed unavailable");
  }
  const unique = new Map<string, NotificationFeedItem>();
  for (const [source, nodes] of [
    ["account", account.data.allAccountNotifications.nodes],
    ["need-claim", claims.data.allNeedClaimNotifications.nodes],
    ["resource-bid", bids.data.allResourceBidNotifications.nodes]
  ] as const) {
    for (const node of nodes) unique.set(`${source}:${node.id}`, toFeedItem(source, node));
  }
  return {
    items: [...unique.values()].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "") || b.id.localeCompare(a.id)),
    endCursor: account.data.allAccountNotifications.pageInfo.endCursor,
    hasNextPage: Boolean(account.data.allAccountNotifications.pageInfo.hasNextPage
      || claims.data.allNeedClaimNotifications.pageInfo?.hasNextPage || bids.data.allResourceBidNotifications.pageInfo?.hasNextPage)
  };
}

export async function markNotificationRead(notificationId: string, source: NotificationSource): Promise<void> {
  if (source === "need-claim") {
    const variables: { input: MarkNeedClaimNotificationReadInput } = { input: { notificationId } };
    await apolloClient.mutate<MarkNeedClaimNotificationReadMutationResult, { input: MarkNeedClaimNotificationReadInput }>({
      mutation: MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
      variables
    });
    signalAccountRefresh();
    return;
  }

  if (source === "resource-bid") {
    const variables: { input: MarkResourceBidNotificationReadInput } = { input: { notificationId } };
    await apolloClient.mutate<MarkResourceBidNotificationReadMutationResult, { input: MarkResourceBidNotificationReadInput }>({
      mutation: MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION,
      variables
    });
    signalAccountRefresh();
    return;
  }

  const variables: { input: MarkAccountNotificationReadInput } = {
    input: {
      notificationId
    }
  };

  await apolloClient.mutate<MarkAccountNotificationReadMutationResult, { input: MarkAccountNotificationReadInput }>({
    mutation: MARK_ACCOUNT_NOTIFICATION_READ_MUTATION,
    variables
  });
  signalAccountRefresh();
}

export async function markAllNotificationsRead(): Promise<void> {
  const variables: { input: MarkAllNotificationsReadInput } = {
    input: {}
  };

  await apolloClient.mutate<MarkAllNotificationsReadMutationResult, { input: MarkAllNotificationsReadInput }>({
    mutation: MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    variables
  });
  signalAccountRefresh();
}
