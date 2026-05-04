import { gql } from "@apollo/client";

export const NOTIFICATIONS_PREVIEW_QUERY = gql`
  query ConsultantNotificationsPreview($limit: Int) {
    notificationsPreview(limit: $limit) {
      unreadCount
      items {
        id
        title
        message
        type
        isRead
        createdAt
      }
    }
  }
`;

export const NOTIFICATIONS_FEED_QUERY = gql`
  query ConsultantNotifications($page: Int, $limit: Int) {
    myNotifications(page: $page, limit: $limit) {
      items {
        id
        title
        message
        type
        isRead
        createdAt
      }
      page
      limit
      total
    }
  }
`;

export const MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation ConsultantMarkNotificationRead($notificationId: UUID!) {
    markNotificationRead(notificationId: $notificationId) {
      notification {
        id
        isRead
      }
    }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation ConsultantMarkAllNotificationsRead {
    markAllNotificationsRead {
      updatedCount
    }
  }
`;
