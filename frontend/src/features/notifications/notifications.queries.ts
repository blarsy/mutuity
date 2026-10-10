import { gql } from "@apollo/client";

// Migration 161 exposes timestamp ordering for every notification source.
// Preserve a deterministic tie-breaker when timestamps are identical.
export const NOTIFICATIONS_OVERVIEW_QUERY = gql`
  query NotificationsOverview($viewerId: UUID!, $first: Int = 25) {
    allNeedClaimNotifications(first: $first, condition: { recipientAccountId: $viewerId }, orderBy: [CREATED_AT_DESC, ID_DESC]) {
      pageInfo { hasNextPage }
      nodes {
        id
        needClaimId
        eventType
        payload
        createdAt
        readAt
      }
    }
    allResourceBidNotifications(first: $first, condition: { recipientAccountId: $viewerId }, orderBy: [CREATED_AT_DESC, ID_DESC]) {
      pageInfo { hasNextPage }
      nodes {
        id
        resourceBidId
        eventType
        payload
        createdAt
        readAt
      }
    }
    allAccountNotifications(first: $first, condition: { recipientAccountId: $viewerId }, orderBy: [CREATED_AT_DESC, ID_DESC]) {
      pageInfo { hasNextPage }
      nodes {
        id
        eventType
        payload
        createdAt
        readAt
      }
    }
  }
`;

export const COUNT_UNREAD_NOTIFICATIONS_QUERY = gql`
  query CountUnreadNotifications {
    countUnreadNotifications
  }
`;

export const MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNeedClaimNotificationRead($input: MarkNeedClaimNotificationReadInput!) {
    markNeedClaimNotificationRead(input: $input) {
      needClaimNotification {
        id
        readAt
      }
    }
  }
`;

export const MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkResourceBidNotificationRead($input: MarkResourceBidNotificationReadInput!) {
    markResourceBidNotificationRead(input: $input) {
      resourceBidNotification {
        id
        readAt
      }
    }
  }
`;

export const MARK_ACCOUNT_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkAccountNotificationRead($input: MarkAccountNotificationReadInput!) {
    markAccountNotificationRead(input: $input) {
      accountNotification {
        id
        readAt
      }
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($input: MarkAllNotificationsReadInput!) {
    markAllNotificationsRead(input: $input) {
      integer
    }
  }
`;
