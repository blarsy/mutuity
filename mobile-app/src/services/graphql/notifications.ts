import { apolloClient } from "./client";
import {
  type MarkAccountNotificationReadInput,
  type MarkAllNotificationsReadInput,
  type Mutation,
  type QueryAllAccountNotificationsArgs
} from "./generated";
import {
  ACCOUNT_NOTIFICATIONS_QUERY,
  MARK_ACCOUNT_NOTIFICATION_READ_MUTATION,
  MARK_ALL_NOTIFICATIONS_READ_MUTATION
} from "./operations";
import type { NotificationFeedItem } from "../../screens/notifications/NotificationsScreen";

const DEFAULT_PAGE_SIZE = 50;

export interface NotificationPage {
  items: NotificationFeedItem[];
  endCursor: string | null;
  hasNextPage: boolean;
}

interface AccountNotificationsQueryResult {
  allAccountNotifications: {
    nodes: Array<{
      id: string;
      eventType: string;
      payload: unknown;
      createdAt: string;
      readAt: string | null;
    }>;
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
  } | null;
}

interface MarkAccountNotificationReadMutationResult {
  markAccountNotificationRead: Pick<Mutation, "markAccountNotificationRead">["markAccountNotificationRead"];
}

interface MarkAllNotificationsReadMutationResult {
  markAllNotificationsRead: Pick<Mutation, "markAllNotificationsRead">["markAllNotificationsRead"];
}

function toDisplayCopy(eventType: string, payload: unknown): { title: string; body: string } {
  const safePayload = typeof payload === "object" && payload !== null ? payload as Record<string, unknown> : {};

  const payloadTitle = typeof safePayload.title === "string" ? safePayload.title : null;
  const payloadBody = typeof safePayload.body === "string" ? safePayload.body : null;

  return {
    title: payloadTitle ?? eventType,
    body: payloadBody ?? ""
  };
}

export async function fetchNotifications(accountId: string, after?: string | null): Promise<NotificationPage> {
  const variables: QueryAllAccountNotificationsArgs = {
    condition: { recipientAccountId: accountId },
    first: DEFAULT_PAGE_SIZE,
    ...(after ? { after } : {})
  };

  const { data } = await apolloClient.query<AccountNotificationsQueryResult, QueryAllAccountNotificationsArgs>({
    query: ACCOUNT_NOTIFICATIONS_QUERY,
    variables,
    fetchPolicy: "network-only"
  });

  const connection = data?.allAccountNotifications;

  const items = (connection?.nodes ?? []).map((node) => {
    const copy = toDisplayCopy(node.eventType, node.payload);

    return {
      id: node.id,
      title: copy.title,
      body: copy.body,
      createdAt: node.createdAt,
      readAt: node.readAt
    } satisfies NotificationFeedItem;
  });

  return {
    items,
    endCursor: connection?.pageInfo.endCursor ?? null,
    hasNextPage: connection?.pageInfo.hasNextPage ?? false
  };
}

export async function markNotificationRead(notificationId: string): Promise<void> {
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
