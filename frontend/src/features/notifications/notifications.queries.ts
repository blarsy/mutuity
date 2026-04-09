import { gql } from "@apollo/client";

export const NOTIFICATIONS_OVERVIEW_QUERY = gql`
  query NotificationsOverview($first: Int = 200) {
    allNeedClaimNotifications(first: $first) {
      nodes {
        id
        eventType
        payload
        createdAt
        readAt
        needClaimByNeedClaimId {
          id
          needId
          status
          needByNeedId {
            id
            title
          }
        }
      }
    }
    allResourceBidNotifications(first: $first) {
      nodes {
        id
        eventType
        payload
        createdAt
        readAt
        resourceBidByResourceBidId {
          id
          resourceId
          status
          resourceByResourceId {
            id
            title
          }
        }
      }
    }
  }
`;

export const MARK_NEED_CLAIM_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkNeedClaimNotificationRead($notificationId: UUID!) {
    markNeedClaimNotificationRead(notificationId: $notificationId) {
      id
      readAt
    }
  }
`;

export const MARK_RESOURCE_BID_NOTIFICATION_READ_MUTATION = gql`
  mutation MarkResourceBidNotificationRead($notificationId: UUID!) {
    markResourceBidNotificationRead(notificationId: $notificationId) {
      id
      readAt
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;
