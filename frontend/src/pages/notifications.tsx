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

function notificationMessage(notification: UnifiedNotification) {
  const needName = asText(notification.payload.needName) ?? asText(notification.payload.needTitle);
  const resourceName = asText(notification.payload.resourceName) ?? asText(notification.payload.resourceTitle);
  const campaignName = asText(notification.payload.campaignName);
  const senderName = asText(notification.payload.senderName);
  const amount = asNumber(notification.payload.amountReceived);

  switch (notification.eventType) {
    case "claim_created":
      return `You got a claim for your need ${needName ?? "(unknown need)"}`;
    case "resource_bid_created":
      return `You got a bid for your resource ${resourceName ?? "(unknown resource)"}`;
    case "resource_bid_expiring_soon":
      return "A bid you received is about to expire";
    case "campaign_airdrop_coming_soon":
      return `The airdrop of campaign ${campaignName ?? "(unknown campaign)"} is coming soon !`;
    case "campaign_airdrop_done":
      return `Airdrop done on campaign ${campaignName ?? "(unknown campaign)"} ! Check your contribution page to see if you got it`;
    case "welcome_profile_reward":
      return "Welcome to tope-la, make a polished profile, and earn some Topes !";
    case "gift_tokens_received":
      return `${senderName ?? "Someone"} gave you ${amount ?? 0} Topes !`;
    case "claim_settled":
      return `Congratulations, your claim on ${needName ?? "(unknown need)"} has been settled`;
    case "resource_bid_accepted":
      return `Congratulations, your bid on ${resourceName ?? "(unknown resource)"} has been accepted`;
    case "resource_bid_declined":
      return `Your bid on ${resourceName ?? "(unknown resource)"} has been rejected`;
    case "resource_bid_cancelled":
      return `Your bid on ${resourceName ?? "(unknown resource)"} has been cancelled`;
    case "resource_bid_expired":
      return `Your bid on ${resourceName ?? "(unknown resource)"} has expired without a response`;
    default:
      return formatEvent(notification.eventType);
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
        message: notificationMessage(baseNotification),
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
        message: notificationMessage(baseNotification),
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
        message: notificationMessage(baseNotification),
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
    data?.allResourceBids.nodes
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
            Notifications
          </Typography>
          <Alert severity="info">
            {isChecking ? "Checking your session..." : isRedirecting ? "Redirecting to sign in..." : "Please sign in to continue."}
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
                Notifications
              </Typography>
              <Typography color="text.secondary">
                Events requiring your attention across needs, resources, campaigns, profile completion, and Topes transfers.
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              <Chip color={unreadCount > 0 ? "warning" : "success"} label={`${unreadCount} unread`} />
              <Button
                disabled={busy || unreadCount === 0}
                onClick={() => setConfirmOpen(true)}
                variant="outlined"
              >
                Set all as read
              </Button>
            </Stack>
          </Stack>

          {loading ? <Alert severity="info">Loading your notifications...</Alert> : null}
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {items.length === 0 ? (
            <Alert severity="info">No notifications yet.</Alert>
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
                          Open
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
        <DialogTitle>Mark all notifications as read?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This will set all unread notifications as read.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={markAllLoading} onClick={() => setConfirmOpen(false)}>
            No
          </Button>
          <Button disabled={markAllLoading} onClick={() => void markAllUnreadAsRead()} variant="contained">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
