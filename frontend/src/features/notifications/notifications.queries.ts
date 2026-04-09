import { gql } from "@apollo/client";

export const NOTIFICATIONS_OVERVIEW_QUERY = gql`
  query NotificationsOverview($first: Int = 200) {
    allNeedClaimNotifications(first: $first) {
      nodes {
        id
        needClaimId
        eventType
        payload
        createdAt
        readAt
      }
    }
    allResourceBidNotifications(first: $first) {
      nodes {
        id
        resourceBidId
        eventType
        payload
        createdAt
        readAt
      }
    }
    allNeedClaims(first: $first) {
      nodes {
        id
        needId
        needByNeedId {
          id
          title
        }
      }
    }
    allResourceBids(first: $first) {
      nodes {
        id
        resourceId
        resourceByResourceId {
          id
          title
        }
      }
    }
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

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead($input: MarkAllNotificationsReadInput!) {
    markAllNotificationsRead(input: $input) {
      integer
    }
  }
`;
