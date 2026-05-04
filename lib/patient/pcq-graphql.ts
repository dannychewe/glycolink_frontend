import { gql } from "@apollo/client";

export const PATIENT_PCQ_FOR_APPOINTMENT_QUERY = gql`
  query PatientPCQForAppointment($appointmentId: UUID!) {
    getPcqForAppointment(appointmentId: $appointmentId) {
      id
      appointmentId
      status
      submittedAt
      lockedAt
      template {
        id
        name
        consultationType
        status
        isGlobal
      }
      questions {
        id
        questionText
        questionType
        isRequired
        order
        options
      }
      answers {
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
        status
        submittedAt
        lockedAt
      }
    }
  }
`;
