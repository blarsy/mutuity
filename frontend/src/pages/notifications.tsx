import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { useRequireAuth } from "../features/auth/requireAuth";
import {
  MARK_ACCOUNT_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION,
  MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION,
  MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION,
  NOTIFICATIONS_OVERVIEW_QUERY
} from "../features/notifications/notifications.queries";
import { notificationUrlForEvent } from "../features/notifications/notificationRouting";
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";
import { useAccountEventSignal } from "../services/graphql/accountEvents";

type NeedClaimNotificationNode = {
  id: string;
  needClaimId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
};

type ResourceBidNotificationNode = {
  id: string;
  resourceBidId: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
};

type AccountNotificationNode = {
  id: string;
  eventType: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
  readAt: string | null;
};

type NotificationsOverviewData = {
  allNeedClaimNotifications: {
    nodes: NeedClaimNotificationNode[];
  };
  allResourceBidNotifications: {
    nodes: ResourceBidNotificationNode[];
  };
  allAccountNotifications: {
    nodes: AccountNotificationNode[];
  };
};

type UnifiedNotification = {
  id: string;
  source: "need-claim" | "resource-bid" | "account";
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  headline1: string;
  headline2: string;
  description: string;
  url: string;
};

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

function asText(value: unknown) {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : null;
}

function formatEvent(eventType: string) {
  return eventType.replaceAll("_", " ").toLowerCase();
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

// Icons ported from Tope-là's notification artwork (frontend/public/topela/notifications).
const EXACT_EVENT_TYPE_ICONS: Record<string, string> = {
  gift_tokens_received: "money-in.svg",
  gift_tokens_sent: "gift-sent.svg",
  campaign_airdrop_coming_soon: "airdrop.svg",
  campaign_airdrop_done: "thumb-up.svg",
  welcome_profile_reward: "hey.svg",
  campaign_approved: "prize-won.svg",
  campaign_moderation_note_received: "moderation.svg",
  campaign_creator_adaptation_submitted: "moderation.svg",
  resource_bid_expiring_soon: "time-up.svg",
  resource_bid_accepted: "prize-won.svg",
  resource_bid_declined: "denied.svg",
  resource_bid_expired: "gone.svg",
  resource_bid_cancelled: "time-up.svg",
  claim_created: "claim.svg",
  claim_settled: "bid-received.svg",
  claim_declined: "denied.svg"
};

const PREFIX_EVENT_TYPE_ICONS: Array<[prefix: string, icon: string]> = [
  ["campaign_airdrop", "thumb-up.svg"],
  ["campaign", "campaign.svg"],
  ["resource_bid", "bid-received.svg"],
  ["gift_tokens", "money-in.svg"],
  ["claim", "claim.svg"]
];

function notificationIcon(eventType: string) {
  const exactMatch = EXACT_EVENT_TYPE_ICONS[eventType];
  const prefixMatch = PREFIX_EVENT_TYPE_ICONS.find(([prefix]) => eventType.startsWith(prefix));
  return `/topela/notifications/${exactMatch ?? prefixMatch?.[1] ?? "thanks.svg"}`;
}

function notificationCopy(notification: UnifiedNotification, t: TranslateFn) {
  const needName = asText(notification.payload.needName) ?? asText(notification.payload.needTitle);
  const resourceName = asText(notification.payload.resourceName) ?? asText(notification.payload.resourceTitle);
  const campaignName = asText(notification.payload.campaignName);
  const creatorName = asText(notification.payload.creatorName);
  const senderName = asText(notification.payload.senderName);
  const claimerName = asText(notification.payload.claimerDisplayName);
  const bidderName = asText(notification.payload.bidderDisplayName);
  const responderName = asText(notification.payload.responderDisplayName);
  const amount = asNumber(notification.payload.amountReceived);
  const unknownNeed = t("eventFallback.unknownNeed");
  const unknownResource = t("eventFallback.unknownResource");
  const unknownCampaign = t("eventFallback.unknownCampaign");
  const someone = t("eventFallback.someone");

  const build = (key: string, vars: Record<string, unknown> = {}) => ({
    headline1: t(`events.${key}.headline1`, vars),
    headline2: t(`events.${key}.headline2`, vars),
    description: t(`events.${key}.description`, vars)
  });

  switch (notification.eventType) {
    case "claim_created":
      return build("claimCreated", { claimerName: claimerName ?? someone, needName: needName ?? unknownNeed });
    case "resource_bid_created":
      return build("resourceBidCreated", { bidderName: bidderName ?? someone, resourceName: resourceName ?? unknownResource });
    case "resource_bid_expiring_soon":
      return build("resourceBidExpiringSoon", { resourceName: resourceName ?? unknownResource });
    case "campaign_airdrop_coming_soon":
      return build("campaignAirdropComingSoon", { campaignName: campaignName ?? unknownCampaign });
    case "campaign_airdrop_done":
      return build("campaignAirdropDone", { campaignName: campaignName ?? unknownCampaign, amount: amount ?? 0 });
    case "welcome_profile_reward":
      return build("welcomeProfileReward");
    case "gift_tokens_received":
      return build("giftTokensReceived", { senderName: senderName ?? someone, amount: amount ?? 0 });
    case "claim_settled":
      return build("claimSettled", { needName: needName ?? unknownNeed });
    case "resource_bid_accepted":
      return build("resourceBidAccepted", { responderName: responderName ?? someone, resourceName: resourceName ?? unknownResource });
    case "resource_bid_declined":
      return build("resourceBidDeclined", { responderName: responderName ?? someone, resourceName: resourceName ?? unknownResource });
    case "resource_bid_cancelled":
      return build("resourceBidCancelled", { resourceName: resourceName ?? unknownResource });
    case "resource_bid_expired":
      return build("resourceBidExpired", { resourceName: resourceName ?? unknownResource });
    case "campaign_moderation_note_received":
      return build("campaignModerationNoteReceived", { campaignName: campaignName ?? unknownCampaign });
    case "campaign_approved":
      return build("campaignApproved", { campaignName: campaignName ?? unknownCampaign });
    case "campaign_creator_adaptation_submitted":
      return build("campaignCreatorAdaptationSubmitted", {
        creatorName: creatorName ?? someone,
        campaignName: campaignName ?? unknownCampaign
      });
    default:
      return build("fallback", { eventType: formatEvent(notification.eventType) });
  }
}

function notificationUrl(notification: UnifiedNotification) {
  return notificationUrlForEvent(notification.eventType, notification.payload);
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation("notifications");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery<NotificationsOverviewData>(NOTIFICATIONS_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !isAuthenticated,
    variables: { first: 200 }
  });

  useAccountEventSignal(() => { void refetch(); }, isAuthenticated);

  const [markNeedClaimRead, { loading: markNeedClaimLoading }] = useMutation(
    MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION
  );
  const [markResourceBidRead, { loading: markResourceBidLoading }] = useMutation(
    MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION
  );
  const [markAccountRead, { loading: markAccountLoading }] = useMutation(
    MARK_ACCOUNT_NOTIFICATION_READ_MUTATION
  );
  const [markAllRead, { loading: markAllLoading }] = useMutation(MARK_ALL_NOTIFICATIONS_READ_MUTATION);

  const items = useMemo<UnifiedNotification[]>(() => {
    const needItems: UnifiedNotification[] = (data?.allNeedClaimNotifications.nodes ?? []).map(notification => {
      const payload = notification.payload ?? {};
      const normalizedPayload = {
        ...payload,
        needClaimId: notification.needClaimId,
        needName: asText(payload.needName)
      };
      const baseNotification: UnifiedNotification = {
        id: notification.id,
        source: "need-claim",
        eventType: notification.eventType,
        payload: normalizedPayload,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        headline1: "",
        headline2: "",
        description: "",
        url: ""
      };

      return {
        ...baseNotification,
        ...notificationCopy(baseNotification, t),
        url: notificationUrl(baseNotification)
      };
    });

    const resourceItems: UnifiedNotification[] = (data?.allResourceBidNotifications.nodes ?? []).map(notification => {
      const payload = notification.payload ?? {};
      const normalizedPayload = {
        ...payload,
        resourceName: asText(payload.resourceName)
      };
      const baseNotification: UnifiedNotification = {
        id: notification.id,
        source: "resource-bid",
        eventType: notification.eventType,
        payload: normalizedPayload,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        headline1: "",
        headline2: "",
        description: "",
        url: ""
      };

      return {
        ...baseNotification,
        ...notificationCopy(baseNotification, t),
        url: notificationUrl(baseNotification)
      };
    });

    const accountItems: UnifiedNotification[] = (data?.allAccountNotifications.nodes ?? []).map(notification => {
      const payload = notification.payload ?? {};
      const baseNotification: UnifiedNotification = {
        id: notification.id,
        source: "account",
        eventType: notification.eventType,
        payload,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        headline1: "",
        headline2: "",
        description: "",
        url: ""
      };

      return {
        ...baseNotification,
        ...notificationCopy(baseNotification, t),
        url: notificationUrl(baseNotification)
      };
    });

    return [...needItems, ...resourceItems, ...accountItems].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }, [
    data?.allNeedClaimNotifications.nodes,
    data?.allResourceBidNotifications.nodes,
    data?.allAccountNotifications.nodes,
    t
  ]);

  const unreadCount = items.filter(item => !item.readAt).length;
  const busy = markNeedClaimLoading || markResourceBidLoading || markAccountLoading || markAllLoading;
  const errorMessage = getUserFacingGraphQLErrorMessage(error);

  const markSingleRead = async (item: UnifiedNotification) => {
    if (item.readAt) {
      return;
    }

    if (item.source === "need-claim") {
      await markNeedClaimRead({ variables: { input: { notificationId: item.id } } });
    } else if (item.source === "resource-bid") {
      await markResourceBidRead({ variables: { input: { notificationId: item.id } } });
    } else {
      await markAccountRead({ variables: { input: { notificationId: item.id } } });
    }

    await refetch();
  };

  const navigateFromNotification = async (item: UnifiedNotification) => {
    await markSingleRead(item);
    await router.push(item.url);
  };

  const markAllUnreadAsRead = async () => {
    await markAllRead({ variables: { input: {} } });
    await refetch();
    setConfirmOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md">
        <Box sx={{ py: 6 }}>
          <Typography component="h1" gutterBottom variant="h4">
            {t("title")}
          </Typography>
          <Alert severity="info">
            {isChecking ? t("authGuard.checking", { ns: "common" }) : isRedirecting ? t("authGuard.redirecting", { ns: "common" }) : t("authGuard.signInRequired", { ns: "common" })}
          </Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 6 }}>
        <Stack spacing={3}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
            <Box>
              <Typography component="h1" gutterBottom variant="h4">
                {t("title")}
              </Typography>
              <Typography color="text.secondary">
                {t("subtitle")}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Chip color={unreadCount > 0 ? "warning" : "success"} label={t("unreadCount", { count: unreadCount })} />
              <Button
                disabled={busy || unreadCount === 0}
                onClick={() => setConfirmOpen(true)}
                variant="outlined"
              >
                {t("markAllAsRead")}
              </Button>
            </Stack>
          </Stack>

          {loading ? <Alert severity="info">{t("loading")}</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {items.length === 0 ? (
            <Alert severity="info">{t("empty")}</Alert>
          ) : (
            <Stack divider={<Divider />} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
              {items.map(item => {
                const unread = !item.readAt;

                return (
                  <Box
                    key={`${item.source}-${item.id}`}
                    onClick={() => {
                      void navigateFromNotification(item);
                    }}
                    sx={{
                      alignItems: "center",
                      cursor: busy ? "default" : "pointer",
                      display: "flex",
                      gap: 2,
                      p: 1.5,
                      pointerEvents: busy ? "none" : "auto"
                    }}
                  >
                    <Box
                      alt=""
                      component="img"
                      src={notificationIcon(item.eventType)}
                      sx={{ borderRadius: 1.5, flexShrink: 0, height: 56, width: 56 }}
                    />

                    <Stack spacing={0.25} sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography color="text.secondary" noWrap variant="body2">
                        {item.headline1}
                      </Typography>
                      {item.headline2 ? (
                        <Typography color="text.secondary" noWrap variant="body2">
                          {item.headline2}
                        </Typography>
                      ) : null}
                      <Typography color="primary" noWrap sx={{ fontWeight: unread ? 700 : 400 }} variant="body1">
                        {item.description}
                      </Typography>
                    </Stack>

                    <Stack alignItems="flex-end" spacing={0.5} sx={{ flexShrink: 0 }}>
                      <Typography color="primary" sx={{ fontWeight: unread ? 700 : 400 }} variant="caption">
                        {formatTimestamp(item.createdAt)}
                      </Typography>
                      {unread ? (
                        <Box sx={{ bgcolor: "primary.main", borderRadius: "50%", height: 10, width: 10 }} />
                      ) : null}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Box>

      <Dialog onClose={() => setConfirmOpen(false)} open={confirmOpen}>
        <DialogTitle>{t("confirmDialog.title")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            {t("confirmDialog.body")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={markAllLoading} onClick={() => setConfirmOpen(false)}>
            {t("actions.cancel", { ns: "common" })}
          </Button>
          <Button disabled={markAllLoading} onClick={() => void markAllUnreadAsRead()} variant="contained">
            {t("confirmDialog.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
