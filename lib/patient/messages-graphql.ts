import { gql } from "@apollo/client";

export const PATIENT_MESSAGE_THREADS_QUERY = gql`
  query PatientMessageThreads($limit: Int, $includeArchived: Boolean, $unreadOnly: Boolean) {
    messageThreads(
      limit: $limit
      includeArchived: $includeArchived
      unreadOnly: $unreadOnly
      participantRole: "patient"
    ) {
      id
      patientId
      appointmentId
      encounterId
      status
      patientName
      unreadCount
      unreadMessageCount
      unreadThread
      lastMessageAt
      updatedAt
      lastMessage {
        id
        sequenceNumber
        senderUserId
        senderName
        body
        priority
        sentAt
      }
    }
  }
`;

export const PATIENT_CONVERSATION_MESSAGES_QUERY = gql`
  query PatientConversationMessages($conversationId: UUID!, $limit: Int, $before: DateTime) {
    conversationMessages(conversationId: $conversationId, limit: $limit, before: $before) {
      id
      conversationId
      sequenceNumber
      senderUserId
      senderName
      patientName
      body
      priority
      sentAt
      deliveredAt
      isReadByMe
      readByMeAt
      isReadByRecipient
      readByRecipientAt
      attachments {
        id
        originalName
        contentType
        sizeBytes
        fileUrl
      }
    }
  }
`;

export const PATIENT_SEND_MESSAGE_MUTATION = gql`
  mutation PatientSendMessage(
    $conversationId: UUID
    $appointmentId: UUID
    $body: String
    $priority: String
  ) {
    sendMessage(
      conversationId: $conversationId
      appointmentId: $appointmentId
      body: $body
      priority: $priority
      participantRole: "patient"
    ) {
      id
      conversationId
      sequenceNumber
      senderUserId
      senderName
      patientName
      body
      priority
      sentAt
      attachments {
        id
        originalName
        fileUrl
      }
    }
  }
`;

export const PATIENT_MARK_CONVERSATION_READ_MUTATION = gql`
  mutation PatientMarkConversationRead($conversationId: UUID!) {
    markConversationRead(conversationId: $conversationId)
  }
`;

export const PATIENT_UNREAD_MESSAGES_PREVIEW_QUERY = gql`
  query PatientUnreadMessagesPreview($limit: Int) {
    unreadMessagesPreview(limit: $limit, participantRole: "patient") {
      unreadCount
      unreadThreadCount
      items {
        id
        conversationId
        sequenceNumber
        senderUserId
        senderName
        patientName
        body
        priority
        sentAt
        hasAttachments
      }
    }
  }
`;
