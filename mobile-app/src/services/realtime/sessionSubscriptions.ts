import { apolloClient } from "../graphql/client";
import { ACCOUNT_NOTIFICATIONS_QUERY } from "../graphql/operations";

export interface SessionSubscriptionHandle {
  stop: () => void;
}

export interface SessionSubscriptionCallbacks {
  onUnreadCountChanged?: (count: number) => void;
  onNewNotification?: (notificationId: string) => void;
  onSessionInvalidated?: (reason: string) => void;
}

const DEFAULT_POLL_INTERVAL_MS = 30_000;

export function startSessionSubscriptions(
  accountId: string | null,
  callbacks: SessionSubscriptionCallbacks = {}
): SessionSubscriptionHandle {
  if (!accountId) {
    return { stop: () => undefined };
  }

  const pollUnread = async (): Promise<void> => {
    try {
      const { data } = await apolloClient.query({
        query: ACCOUNT_NOTIFICATIONS_QUERY,
        variables: {
          condition: { recipientAccountId: accountId },
          first: 1
        },
        fetchPolicy: "network-only"
      });

      const nodes = (data as Record<string, unknown>)?.allAccountNotifications as
        | { nodes: Array<{ id: string; readAt: string | null }> }
        | undefined;

      if (nodes?.nodes) {
        const unreadCount = nodes.nodes.filter((n) => !n.readAt).length;
        callbacks.onUnreadCountChanged?.(unreadCount);

        const firstUnread = nodes.nodes.find((n) => !n.readAt);
        if (firstUnread) {
          callbacks.onNewNotification?.(firstUnread.id);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      // If we get an auth error, the session may be invalid
      if (message.includes("auth") || message.includes("unauthorized") || message.includes("JWT")) {
        callbacks.onSessionInvalidated?.(message);
      }
    }
  };

  // Initial poll
  void pollUnread();

  const intervalId = setInterval(() => {
    void pollUnread();
  }, DEFAULT_POLL_INTERVAL_MS);

  return {
    stop: () => clearInterval(intervalId)
  };
}
