import { gql } from "@apollo/client";

export const MESSAGE_THREADS_QUERY = gql`
  query ConsultantMessageThreads($limit: Int, $includeArchived: Boolean, $unreadOnly: Boolean) {
    messageThreads(
      limit: $limit
      includeArchived: $includeArchived
      unreadOnly: $unreadOnly
      participantRole: "provider"
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

export const CONVERSATION_MESSAGES_QUERY = gql`
  query ConsultantConversationMessages($conversationId: UUID!, $limit: Int, $before: DateTime) {
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

export const UNREAD_MESSAGES_PREVIEW_QUERY = gql`
  query ConsultantUnreadMessagesPreview($limit: Int) {
    unreadMessagesPreview(limit: $limit, participantRole: "provider") {
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

export const SEND_MESSAGE_MUTATION = gql`
  mutation ConsultantSendMessage(
    $conversationId: UUID
    $appointmentId: UUID
    $body: String
    $attachments: [Upload]
    $priority: String
  ) {
    sendMessage(
      conversationId: $conversationId
      appointmentId: $appointmentId
      body: $body
      attachments: $attachments
      priority: $priority
      participantRole: "provider"
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

export const MARK_CONVERSATION_READ_MUTATION = gql`
  mutation ConsultantMarkConversationRead($conversationId: UUID!) {
    markConversationRead(conversationId: $conversationId)
  }
`;

export const ARCHIVE_CONVERSATION_MUTATION = gql`
  mutation ConsultantArchiveConversation($conversationId: UUID!) {
    archiveConversation(conversationId: $conversationId) {
      id
      status
    }
  }
`;

export const CLOSE_CONVERSATION_MUTATION = gql`
  mutation ConsultantCloseConversation($conversationId: UUID!) {
    closeConversation(conversationId: $conversationId) {
      id
      status
    }
  }
`;

export const REOPEN_CONVERSATION_MUTATION = gql`
  mutation ConsultantReopenConversation($conversationId: UUID!) {
    reopenConversation(conversationId: $conversationId) {
      id
      status
    }
  }
`;

// ─── Thread-to-Consult actions ────────────────────────────

export const SCHEDULE_FOLLOWUP_FROM_THREAD_MUTATION = gql`
  mutation ScheduleFollowUpFromThread(
    $conversationId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $consultationType: String
  ) {
    scheduleFollowUpFromThread(
      conversationId: $conversationId
      startTime: $startTime
      endTime: $endTime
      consultationType: $consultationType
    ) {
      id
      patientId
      providerId
      startsAt
      endsAt
      consultationType
      source
      status
    }
  }
`;

export const START_CONSULTATION_FROM_THREAD_MUTATION = gql`
  mutation StartConsultationFromThread($conversationId: UUID!) {
    startConsultationFromThread(conversationId: $conversationId) {
      id
      appointmentId
      patientId
      providerId
      status
      startedAt
    }
  }
`;

export const CREATE_CLINICAL_NOTE_FROM_THREAD_MUTATION = gql`
  mutation CreateClinicalNoteFromThread(
    $conversationId: UUID!
    $encounterId: UUID
    $data: ThreadClinicalNoteInput
  ) {
    createClinicalNoteFromThread(
      conversationId: $conversationId
      encounterId: $encounterId
      data: $data
    ) {
      id
      versionNumber
      subjective
      objective
      assessment
      plan
      createdAt
    }
  }
`;

export const MESSAGE_PRIORITY_OPTIONS = [
  { value: "NORMAL", label: "Normal" },
  { value: "URGENT", label: "Urgent" },
] as const;

export const CONSULTATION_TYPE_OPTIONS = [
  { value: "telemedicine", label: "Telemedicine" },
  { value: "in_person", label: "In-person" },
  { value: "home_visit", label: "Home visit" },
] as const;
