import { gql } from "@apollo/client";

export const MY_PATIENT_PROFILE_QUERY = gql`
  query MyPatientProfile {
    myPatientProfile {
      id
      fullName
      email
      dateOfBirth
      diabetesType
      diagnosisDate
      phone
      profileComplete
      onboardingStatus
    }
  }
`;

export const PROFILE_COMPLETION_STATUS_QUERY = gql`
  query ProfileCompletionStatus {
    profileCompletionStatus {
      isComplete
      pcqComplete
      consultationReady
      percentComplete
      missingItems
    }
  }
`;

// Hydrates the full clinical profile screen in a single round trip. The
// allergies / currentMedications / additionalNotes summary fields live on
// PatientSummary; structured records are read from the dedicated list fields below.
export const PATIENT_CLINICAL_WORKSPACE_QUERY = gql`
  query PatientClinicalProfileWorkspace {
    myPatientProfile {
      id
      fullName
      email
      dateOfBirth
      diabetesType
      diagnosisDate
      phone
      allergies
      currentMedications
      additionalNotes
      profileComplete
      onboardingStatus
      baselineWeight
      baselineBpSystolic
      baselineBpDiastolic
      notes
    }
    profileCompletionStatus {
      isComplete
      pcqComplete
      consultationReady
      percentComplete
      missingItems
    }
    myPatientAllergies {
      id
      substance
      reaction
      severity
      status
    }
    myPatientConditions {
      id
      description
      codeSystem
      code
      diagnosedAt
      status
    }
    myPatientMedications {
      id
      drugName
      dose
      frequency
      route
      status
    }
    myPatientContacts {
      id
      name
      relationship
      phone
      email
      isPrimary
    }
    myPatientDocuments {
      id
      docType
      recordedDate
      originalName
      fileUrl
    }
    myPatientConsents {
      id
      policyType
      version
      acceptedAt
    }
  }
`;

export const CREATE_PATIENT_PROFILE_MUTATION = gql`
  mutation CreatePatientProfile {
    createPatientProfile {
      patientProfile {
        id
        profileComplete
        onboardingStatus
      }
    }
  }
`;

export const COMPLETE_PATIENT_PROFILE_MUTATION = gql`
  mutation CompletePatientProfile($data: PatientProfileInput) {
    completePatientProfile(data: $data) {
      patientProfile {
        id
        fullName
        email
        dateOfBirth
        diabetesType
        diagnosisDate
        phone
        allergies
        currentMedications
        additionalNotes
        profileComplete
        onboardingStatus
      }
    }
  }
`;


export const UPDATE_PATIENT_PROFILE_MUTATION = gql`
  mutation UpdatePatientProfile($data: PatientProfileInput!) {
    updatePatientProfile(data: $data) {
      patientProfile {
        id
        fullName
        email
        dateOfBirth
        diabetesType
        diagnosisDate
        phone
        allergies
        currentMedications
        additionalNotes
        profileComplete
        onboardingStatus
      }
    }
  }
`;

export const ADD_ALLERGY_MUTATION = gql`
  mutation AddAllergy($data: AllergyInput!) {
    addAllergy(data: $data) {
      allergy {
        id
        substance
        reaction
        severity
        status
      }
    }
  }
`;

export const ADD_CONDITION_MUTATION = gql`
  mutation AddCondition($data: ConditionInput!) {
    addCondition(data: $data) {
      condition {
        id
        description
        codeSystem
        code
        diagnosedAt
        status
      }
    }
  }
`;

export const ADD_MEDICATION_MUTATION = gql`
  mutation AddMedication($data: MedicationInput!) {
    addMedication(data: $data) {
      medication {
        id
        drugName
        dose
        frequency
        route
        status
      }
    }
  }
`;

export const GET_PATIENT_CONTACTS_QUERY = gql`
  query GetPatientContacts {
    myPatientContacts {
      id
      name
      relationship
      phone
      email
      isPrimary
    }
  }
`;

export const GET_PATIENT_CONSENTS_QUERY = gql`
  query GetPatientConsents {
    myPatientConsents {
      id
      policyType
      version
      acceptedAt
      ipAddress
    }
  }
`;

export const UPDATE_PATIENT_CONTACT_MUTATION = gql`
  mutation UpdatePatientContact($contactId: UUID!, $data: UpdateContactInput!) {
    updatePatientContact(contactId: $contactId, data: $data) {
      contact {
        id
        name
        relationship
        phone
        email
        isPrimary
      }
    }
  }
`;

export const ADD_PATIENT_CONTACT_MUTATION = gql`
  mutation AddPatientContact($data: EmergencyContactInput!) {
    addPatientContact(data: $data) {
      contact {
        id
        name
        relationship
        phone
        email
        isPrimary
      }
    }
  }
`;

export const UPLOAD_PATIENT_DOCUMENT_MUTATION = gql`
  mutation UploadPatientDocument($file: Upload!, $docType: String, $recordedDate: Date) {
    uploadPatientDocument(file: $file, docType: $docType, recordedDate: $recordedDate) {
      document {
        id
        docType
        recordedDate
        originalName
      }
    }
  }
`;

export const ACCEPT_CONSENT_MUTATION = gql`
  mutation AcceptConsent($policyType: String!, $version: String!) {
    acceptConsent(policyType: $policyType, version: $version) {
      consent {
        id
        policyType
        version
        acceptedAt
      }
    }
  }
`;

export const DIABETES_TYPE_OPTIONS = [
  { value: "type_1", label: "Type 1" },
  { value: "type_2", label: "Type 2" },
  { value: "gestational", label: "Gestational" },
  { value: "prediabetes", label: "Prediabetes" },
  { value: "other", label: "Other" },
] as const;

export const ALLERGY_SEVERITY_OPTIONS = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
  { value: "life_threatening", label: "Life Threatening" },
] as const;

export const CONDITION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "resolved", label: "Resolved" },
  { value: "remission", label: "Remission" },
  { value: "inactive", label: "Inactive" },
] as const;

export const MEDICATION_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "on_hold", label: "On Hold" },
  { value: "stopped", label: "Stopped" },
  { value: "completed", label: "Completed" },
] as const;

export const CONSENT_POLICY_TYPE_OPTIONS = [
  { value: "privacy_policy", label: "Privacy Policy" },
  { value: "terms_of_service", label: "Terms of Service" },
  { value: "telemedicine", label: "Telemedicine" },
  { value: "data_sharing", label: "Data Sharing" },
  { value: "treatment", label: "Treatment" },
] as const;

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "identification", label: "Identification" },
  { value: "insurance", label: "Insurance" },
  { value: "referral", label: "Referral" },
  { value: "lab_report", label: "Lab Report" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "other", label: "Other" },
] as const;

