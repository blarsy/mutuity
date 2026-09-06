import i18n from "../../i18n";
import { apolloClient } from "./client";
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
  allNeedClaimNotifications: { nodes: RawNotificationNode[] } | null;
}

interface ResourceBidNotificationsQueryResult {
  allResourceBidNotifications: { nodes: RawNotificationNode[] } | null;
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
  return new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(text));
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

  const translateEvent = (key: string, vars: Record<string, unknown>, defaults: NotificationCopy): NotificationCopy => ({
    headline1: i18n.t(`notifications.events.${key}.headline1`, { ns: "us4", defaultValue: defaults.headline1, ...vars }),
    headline2: i18n.t(`notifications.events.${key}.headline2`, { ns: "us4", defaultValue: defaults.headline2, ...vars }),
    description: i18n.t(`notifications.events.${key}.description`, { ns: "us4", defaultValue: defaults.description, ...vars })
  });

  switch (eventType) {
    case "gift_tokens_received":
      return translateEvent("giftTokensReceived", { senderName: asText(p.senderName, someone), amount: asNumber(p.amountReceived) }, {
        headline1: "Tokens received!",
        headline2: asText(p.senderName, someone),
        description: `${asNumber(p.amountReceived)} tokens sent your way`
      });
    case "campaign_airdrop_coming_soon":
      return translateEvent("campaignAirdropComingSoon", { campaignName: asText(p.campaignName, unknownNeed), date: formatDate(p.airdropAt) }, {
        headline1: "Airdrop coming soon",
        headline2: asText(p.campaignName, ""),
        description: `Lands on ${formatDate(p.airdropAt)}`
      });
    case "campaign_airdrop_done":
      return translateEvent("campaignAirdropDone", { campaignName: asText(p.campaignName, ""), amount: asNumber(p.amountReceived) }, {
        headline1: "Airdrop received!",
        headline2: asText(p.campaignName, ""),
        description: `${asNumber(p.amountReceived)} tokens`
      });
    case "welcome_profile_reward":
      return translateEvent("welcomeProfileReward", {}, {
        headline1: "Welcome to Mutuity!",
        headline2: "Complete your profile",
        description: "Earn tokens for a polished profile."
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
      return translateEvent("claimDeclined", {}, { headline1: "Claim declined", headline2: "", description: "" });
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
      return translateEvent("fallback", { eventType }, {
        headline1: asText(p.title, eventType),
        headline2: "",
        description: asText(p.body, "")
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
    readAt: node.readAt
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

export async function markNotificationRead(notificationId: string, source: NotificationSource): Promise<void> {
  if (source === "need-claim") {
    const variables: { input: MarkNeedClaimNotificationReadInput } = { input: { notificationId } };
    await apolloClient.mutate<MarkNeedClaimNotificationReadMutationResult, { input: MarkNeedClaimNotificationReadInput }>({
      mutation: MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
      variables
    });
    return;
  }

  if (source === "resource-bid") {
    const variables: { input: MarkResourceBidNotificationReadInput } = { input: { notificationId } };
    await apolloClient.mutate<MarkResourceBidNotificationReadMutationResult, { input: MarkResourceBidNotificationReadInput }>({
      mutation: MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION,
      variables
    });
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
}

export async function markAllNotificationsRead(): Promise<void> {
  const variables: { input: MarkAllNotificationsReadInput } = {
    input: {}
  };

  await apolloClient.mutate<MarkAllNotificationsReadMutationResult, { input: MarkAllNotificationsReadInput }>({
    mutation: MARK_ALL_NOTIFICATIONS_READ_MUTATION,
    variables
  });
}
