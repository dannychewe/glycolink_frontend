import { gql } from "@apollo/client";

// Shared field selections to keep the detail-style queries consistent.
const PCQ_QUESTION_FIELDS = `
  id
  questionText
  questionType
  isRequired
  order
  options
`;

const PCQ_ANSWER_FIELDS = `
  id
  questionId
  answerText
  answerNumeric
  answerBoolean
  answerJson
`;

const PCQ_TEMPLATE_FIELDS = `
  id
  name
  consultationType
  status
  specialtyId
  isGlobal
`;

const PCQ_TEMPLATE_VERSION_FIELDS = `
  id
  versionNumber
  isCurrent
  publishedAt
`;

export const PATIENT_PCQ_LIST_QUERY = gql`
  query PatientPCQList {
    myPcqResponses {
      id
      appointmentId
      patientId
      assignedByProviderId
      assignedByProviderName
      responseScope
      status
      assignmentReason
      dueAt
      submittedAt
      lockedAt
      template {
        ${PCQ_TEMPLATE_FIELDS}
      }
      templateVersion {
        ${PCQ_TEMPLATE_VERSION_FIELDS}
      }
    }
  }
`;

export const PATIENT_PCQ_DETAIL_QUERY = gql`
  query PatientPCQDetail($id: UUID!) {
    pcqResponse(id: $id) {
      id
      appointmentId
      patientId
      assignedByProviderId
      assignedByProviderName
      responseScope
      status
      assignmentReason
      dueAt
      submittedAt
      lockedAt
      template {
        ${PCQ_TEMPLATE_FIELDS}
      }
      templateVersion {
        ${PCQ_TEMPLATE_VERSION_FIELDS}
      }
      questions {
        ${PCQ_QUESTION_FIELDS}
      }
      answers {
        ${PCQ_ANSWER_FIELDS}
      }
    }
  }
`;

export const PATIENT_BASELINE_PCQ_QUERY = gql`
  query PatientBaselinePCQ {
    baselinePcq {
      id
      appointmentId
      patientId
      assignedByProviderId
      assignedByProviderName
      responseScope
      status
      assignmentReason
      dueAt
      submittedAt
      lockedAt
      template {
        ${PCQ_TEMPLATE_FIELDS}
      }
      templateVersion {
        ${PCQ_TEMPLATE_VERSION_FIELDS}
      }
      questions {
        ${PCQ_QUESTION_FIELDS}
      }
      answers {
        ${PCQ_ANSWER_FIELDS}
      }
    }
  }
`;

export const PATIENT_PCQ_FOR_APPOINTMENT_QUERY = gql`
  query PatientPCQForAppointment($appointmentId: UUID!) {
    getPcqForAppointment(appointmentId: $appointmentId) {
      id
      appointmentId
      patientId
      assignedByProviderId
      assignedByProviderName
      responseScope
      status
      assignmentReason
      dueAt
      submittedAt
      lockedAt
      template {
        ${PCQ_TEMPLATE_FIELDS}
      }
      templateVersion {
        ${PCQ_TEMPLATE_VERSION_FIELDS}
      }
      questions {
        ${PCQ_QUESTION_FIELDS}
      }
      answers {
        ${PCQ_ANSWER_FIELDS}
      }
    }
  }
`;

export const PATIENT_SAVE_PCQ_DRAFT_MUTATION = gql`
  mutation PatientSavePCQDraft($responseId: UUID!, $questionId: UUID!, $value: JSONString) {
    savePcqDraft(responseId: $responseId, questionId: $questionId, value: $value) {
      answer {
        id
        questionId
        answerText
        answerNumeric
        answerBoolean
        answerJson
      }
    }
  }
`;

export const PATIENT_SAVE_PCQ_ANSWER_MUTATION = gql`
  mutation PatientSavePCQAnswer($responseId: UUID!, $questionId: UUID!, $value: JSONString) {
    savePcqAnswer(responseId: $responseId, questionId: $questionId, value: $value) {
      answer {
        id
        questionId
        answerText
        answerNumeric
        answerBoolean
        answerJson
      }
    }
  }
`;

export const PATIENT_SUBMIT_PCQ_MUTATION = gql`
  mutation PatientSubmitPCQ($responseId: UUID!) {
    submitPcq(responseId: $responseId) {
      response {
        id
        appointmentId
        patientId
        assignedByProviderId
        assignedByProviderName
        responseScope
        status
        assignmentReason
        dueAt
        submittedAt
        lockedAt
        template {
          ${PCQ_TEMPLATE_FIELDS}
        }
        templateVersion {
          ${PCQ_TEMPLATE_VERSION_FIELDS}
        }
        questions {
          ${PCQ_QUESTION_FIELDS}
        }
        answers {
          ${PCQ_ANSWER_FIELDS}
        }
      }
    }
  }
`;
