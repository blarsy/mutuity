import { useMemo, useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { getUserFacingGraphQLErrorMessage } from "../services/graphql/errorMessages";

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
  allNeedClaims: {
    nodes: Array<{
      id: string;
      needId: string;
      needByNeedId: {
        id: string;
        title: string;
      } | null;
    }>;
  };
  allResourceBids: {
    nodes: Array<{
      id: string;
      resourceId: string;
      resourceByResourceId: {
        id: string;
        title: string;
      } | null;
    }>;
  };
};

type UnifiedNotification = {
  id: string;
  source: "need-claim" | "resource-bid" | "account";
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  readAt: string | null;
  message: string;
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

function notificationMessage(notification: UnifiedNotification, t: TranslateFn) {
  const needName = asText(notification.payload.needName) ?? asText(notification.payload.needTitle);
  const resourceName = asText(notification.payload.resourceName) ?? asText(notification.payload.resourceTitle);
  const campaignName = asText(notification.payload.campaignName);
  const senderName = asText(notification.payload.senderName);
  const amount = asNumber(notification.payload.amountReceived);
  const unknownNeed = t("eventFallback.unknownNeed");
  const unknownResource = t("eventFallback.unknownResource");
  const unknownCampaign = t("eventFallback.unknownCampaign");
  const someone = t("eventFallback.someone");

  switch (notification.eventType) {
    case "claim_created":
      return t("events.claimCreated", { needName: needName ?? unknownNeed });
    case "resource_bid_created":
      return t("events.resourceBidCreated", { resourceName: resourceName ?? unknownResource });
    case "resource_bid_expiring_soon":
      return t("events.resourceBidExpiringSoon");
    case "campaign_airdrop_coming_soon":
      return t("events.campaignAirdropComingSoon", { campaignName: campaignName ?? unknownCampaign });
    case "campaign_airdrop_done":
      return t("events.campaignAirdropDone", { campaignName: campaignName ?? unknownCampaign });
    case "welcome_profile_reward":
      return t("events.welcomeProfileReward");
    case "gift_tokens_received":
      return t("events.giftTokensReceived", { senderName: senderName ?? someone, amount: amount ?? 0 });
    case "claim_settled":
      return t("events.claimSettled", { needName: needName ?? unknownNeed });
    case "resource_bid_accepted":
      return t("events.resourceBidAccepted", { resourceName: resourceName ?? unknownResource });
    case "resource_bid_declined":
      return t("events.resourceBidDeclined", { resourceName: resourceName ?? unknownResource });
    case "resource_bid_cancelled":
      return t("events.resourceBidCancelled", { resourceName: resourceName ?? unknownResource });
    case "resource_bid_expired":
      return t("events.resourceBidExpired", { resourceName: resourceName ?? unknownResource });
    default:
      return t("events.fallback", { eventType: formatEvent(notification.eventType) });
  }
}

function notificationUrl(notification: UnifiedNotification) {
  switch (notification.eventType) {
    case "claim_created":
    case "claim_settled":
      return "/claims";
    case "resource_bid_created":
    case "resource_bid_expiring_soon":
    case "resource_bid_accepted":
    case "resource_bid_declined":
    case "resource_bid_cancelled":
    case "resource_bid_expired":
      return "/bids";
    case "campaign_airdrop_done":
    case "gift_tokens_received":
      return "/contribution";
    case "campaign_airdrop_coming_soon": {
      const campaignUrl = asText(notification.payload.url);
      return campaignUrl ?? "/";
    }
    case "welcome_profile_reward":
      return "/profile";
    default: {
      const fallbackUrl = asText(notification.payload.url);
      return fallbackUrl ?? "/notifications";
    }
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useTranslation("notifications");
  const { isAuthenticated, isChecking, isRedirecting } = useRequireAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery<NotificationsOverviewData>(NOTIFICATIONS_OVERVIEW_QUERY, {
    pollInterval: isAuthenticated ? 15000 : 0,
    skip: !isAuthenticated,
    variables: { first: 200 }
  });

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
    const needTitleByClaimId = new Map(
      (data?.allNeedClaims.nodes ?? []).map(claim => [claim.id, claim.needByNeedId?.title ?? null] as const)
    );
    const resourceTitleByBidId = new Map(
      (data?.allResourceBids.nodes ?? []).map(bid => [bid.id, bid.resourceByResourceId?.title ?? null] as const)
    );

    const needItems: UnifiedNotification[] = (data?.allNeedClaimNotifications.nodes ?? []).map(notification => {
      const payload = notification.payload ?? {};
      const needTitle = needTitleByClaimId.get(notification.needClaimId) ?? null;
      const normalizedPayload = {
        ...payload,
        needName: asText(payload.needName) ?? needTitle
      };
      const baseNotification: UnifiedNotification = {
        id: notification.id,
        source: "need-claim",
        eventType: notification.eventType,
        payload: normalizedPayload,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        message: "",
        url: ""
      };

      return {
        ...baseNotification,
        message: notificationMessage(baseNotification, t),
        url: notificationUrl(baseNotification)
      };
    });

    const resourceItems: UnifiedNotification[] = (data?.allResourceBidNotifications.nodes ?? []).map(notification => {
      const payload = notification.payload ?? {};
      const resourceTitle = resourceTitleByBidId.get(notification.resourceBidId) ?? null;
      const normalizedPayload = {
        ...payload,
        resourceName: asText(payload.resourceName) ?? resourceTitle
      };
      const baseNotification: UnifiedNotification = {
        id: notification.id,
        source: "resource-bid",
        eventType: notification.eventType,
        payload: normalizedPayload,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        message: "",
        url: ""
      };

      return {
        ...baseNotification,
        message: notificationMessage(baseNotification, t),
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
        message: "",
        url: ""
      };

      return {
        ...baseNotification,
        message: notificationMessage(baseNotification, t),
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
    data?.allNeedClaims.nodes,
    data?.allResourceBids.nodes,
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
    <Container maxWidth="lg">
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
            <Stack spacing={1.5}>
              {items.map(item => (
                <Card key={`${item.source}-${item.id}`} variant="outlined">
                  <CardContent>
                    <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
                      <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                        <Typography variant="body1">{item.message}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {formatTimestamp(item.createdAt)}
                        </Typography>
                      </Stack>

                      <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }} direction={{ xs: "column", sm: "row" }} spacing={1}>
                        <Checkbox
                          checked={Boolean(item.readAt)}
                          disabled={busy || Boolean(item.readAt)}
                          onChange={() => {
                            void markSingleRead(item);
                          }}
                        />
                        <Button
                          disabled={busy}
                          onClick={() => {
                            void navigateFromNotification(item);
                          }}
                          size="small"
                          variant="contained"
                        >
                          {t("open")}
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
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
