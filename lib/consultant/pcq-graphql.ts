import { gql } from "@apollo/client";

export const PCQ_FOR_APPOINTMENT_QUERY = gql`
  query ConsultantPCQForAppointment($appointmentId: UUID!) {
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
      versions {
        id
        versionNumber
        isCurrent
        publishedAt
      }
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
    }
  }
`;

export const SUBMIT_PCQ_QUESTION_CONTRIBUTION_MUTATION = gql`
  mutation ConsultantSubmitPCQQuestionContribution($data: PCQQuestionContributionInput!) {
    submitPcqQuestionContribution(data: $data) {
      contribution {
        id
        status
        templateId
        consultationType
        submittedByProviderId
        submittedByProviderName
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

// Accepted consultationType values per the PCQ contract.
export const CONSULTATION_TYPE_OPTIONS = [
  { value: "telemedicine", label: "Telemedicine" },
  { value: "in_person", label: "In Person" },
  { value: "home_visit", label: "Home Visit" },
] as const;

export const DEFAULT_CONSULTATION_TYPE = "telemedicine";

// ─── Supplemental Template Management ─────────────────────

export const PCQ_TEMPLATES_QUERY = gql`
  query ConsultantPCQTemplates {
    pcqTemplates {
      id
      name
      consultationType
      status
      specialtyId
      isGlobal
      versions {
        id
        versionNumber
        isCurrent
        publishedAt
      }
    }
  }
`;

export const PCQ_TEMPLATE_DETAIL_QUERY = gql`
  query ConsultantPCQTemplate($id: UUID!) {
    pcqTemplate(id: $id) {
      id
      name
      consultationType
      status
      specialtyId
      isGlobal
      versions {
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
  }
`;

export const CREATE_PCQ_TEMPLATE_MUTATION = gql`
  mutation ConsultantCreatePCQTemplate($name: String!, $consultationType: String!) {
    createPcqTemplate(name: $name, consultationType: $consultationType) {
      template {
        id
        name
        consultationType
        status
        specialtyId
        isGlobal
        versions {
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
    }
  }
`;

export const UPDATE_PCQ_TEMPLATE_MUTATION = gql`
  mutation ConsultantUpdatePCQTemplate($templateId: UUID!, $data: PCQTemplateUpdateInput!) {
    updatePcqTemplate(templateId: $templateId, data: $data) {
      template {
        id
        name
        consultationType
        status
        specialtyId
        isGlobal
        versions {
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
    }
  }
`;

export const DELETE_PCQ_TEMPLATE_MUTATION = gql`
  mutation ConsultantDeletePCQTemplate($templateId: UUID!) {
    deletePcqTemplate(templateId: $templateId) {
      ok
    }
  }
`;

export const CREATE_PCQ_TEMPLATE_VERSION_MUTATION = gql`
  mutation ConsultantCreatePCQTemplateVersion($templateId: UUID!) {
    createPcqTemplateVersion(templateId: $templateId) {
      templateVersion {
        id
        versionNumber
        isCurrent
        publishedAt
        template {
          id
          name
          consultationType
          status
          specialtyId
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
      }
    }
  }
`;

export const PUBLISH_PCQ_TEMPLATE_VERSION_MUTATION = gql`
  mutation ConsultantPublishPCQTemplateVersion($versionId: UUID!) {
    publishPcqTemplateVersion(versionId: $versionId) {
      templateVersion {
        id
        versionNumber
        isCurrent
        publishedAt
        template {
          id
          name
          consultationType
          status
          specialtyId
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
      }
    }
  }
`;

export const ADD_PCQ_QUESTION_MUTATION = gql`
  mutation ConsultantAddPCQQuestion($versionId: UUID!, $data: PCQQuestionInput!) {
    addPcqQuestion(versionId: $versionId, data: $data) {
      question {
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

export const UPDATE_PCQ_QUESTION_MUTATION = gql`
  mutation ConsultantUpdatePCQQuestion($questionId: UUID!, $data: PCQQuestionUpdateInput!) {
    updatePcqQuestion(questionId: $questionId, data: $data) {
      question {
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

export const DELETE_PCQ_QUESTION_MUTATION = gql`
  mutation ConsultantDeletePCQQuestion($questionId: UUID!) {
    deletePcqQuestion(questionId: $questionId) {
      ok
    }
  }
`;

// ─── Assignment & Response Review ─────────────────────────

export const ASSIGN_PCQ_TO_PATIENT_MUTATION = gql`
  mutation ConsultantAssignPCQ($data: AssignPCQInput!) {
    assignPcqToPatient(data: $data) {
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
          id
          name
          consultationType
          status
          specialtyId
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
  }
`;

export const ASSIGN_PCQ_TO_APPOINTMENT_MUTATION = gql`
  mutation ConsultantAssignAppointmentPCQ($data: AssignAppointmentPCQInput!) {
    assignPcqToAppointment(data: $data) {
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
          id
          name
          consultationType
          status
          specialtyId
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
  }
`;

export const PCQ_RESPONSE_QUERY = gql`
  query ConsultantPCQResponse($id: UUID!) {
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
