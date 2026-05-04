import { gql } from "@apollo/client";

export const PCQ_FOR_APPOINTMENT_QUERY = gql`
  query ConsultantPCQForAppointment($appointmentId: UUID!) {
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
      templateVersion {
        id
        versionNumber
        isCurrent
        publishedAt
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

export const ACTIVE_PCQ_TEMPLATE_QUERY = gql`
  query ConsultantActivePCQTemplate($consultationType: String) {
    activePcqTemplate(consultationType: $consultationType) {
      id
      name
      consultationType
      status
      specialtyId
      isGlobal
    }
  }
`;

export const ACTIVE_PCQ_TEMPLATE_VERSION_QUERY = gql`
  query ConsultantActivePCQTemplateVersion($consultationType: String) {
    activePcqTemplateVersion(consultationType: $consultationType) {
      id
      versionNumber
      isCurrent
      publishedAt
      questions {
        id
        questionText
        questionType
        isRequired
        order
        options
      }
    }
  }
`;

export const SUBMIT_PCQ_QUESTION_CONTRIBUTION_MUTATION = gql`
  mutation ConsultantSubmitPCQQuestionContribution($data: PCQQuestionContributionInput!) {
    submitPcqQuestionContribution(data: $data) {
      contribution {
        id
        status
        consultationType
        questionText
        questionType
        isRequired
        order
        options
        createdAt
      }
    }
  }
`;

export const MY_PCQ_QUESTION_CONTRIBUTIONS_QUERY = gql`
  query ConsultantMyPCQQuestionContributions($status: String) {
    pcqQuestionContributions(status: $status, mine: true) {
      id
      status
      consultationType
      questionText
      questionType
      isRequired
      order
      options
      adminNote
      appliedQuestionId
      reviewedAt
      createdAt
    }
  }
`;

export const PCQ_QUESTION_TYPE_OPTIONS = [
  { value: "text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Yes / No" },
  { value: "single_select", label: "Single select" },
  { value: "multi_select", label: "Multi select" },
  { value: "date", label: "Date" },
  { value: "json", label: "JSON / File" },
] as const;

export const CONSULTATION_TYPE_OPTIONS = [
  { value: "initial", label: "Initial" },
  { value: "follow_up", label: "Follow-up" },
  { value: "review", label: "Review" },
  { value: "urgent", label: "Urgent" },
  { value: "telemedicine", label: "Telemedicine" },
] as const;
