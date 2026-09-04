import { gql } from "@apollo/client";

export const PATIENT_NOTIFICATIONS_PREVIEW_QUERY = gql`
  query PatientNotificationsPreview($limit: Int) {
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

export const PATIENT_NOTIFICATIONS_FEED_QUERY = gql`
  query PatientNotifications($page: Int, $limit: Int) {
    myNotifications(page: $page, limit: $limit) {
      items {
        id
        title
        message
        type
        isRead
        createdAt
        sourceType
        sourceId
      }
      page
      limit
      total
    }
  }
`;

export const PATIENT_MARK_NOTIFICATION_READ_MUTATION = gql`
  mutation PatientMarkNotificationRead($notificationId: UUID!) {
    markNotificationRead(notificationId: $notificationId) {
      notification {
        id
        isRead
      }
    }
  }
`;

export const PATIENT_MARK_ALL_NOTIFICATIONS_READ_MUTATION = gql`
  mutation PatientMarkAllNotificationsRead {
    markAllNotificationsRead {
      updatedCount
    }
  }
`;
