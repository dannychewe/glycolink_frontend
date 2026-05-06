import { gql } from "@apollo/client";

export const PATIENT_SETTINGS_PROFILE_QUERY = gql`
  query PatientSettingsProfile {
    myPatientProfile {
      id
      fullName
      email
      phone
      dateOfBirth
      diabetesType
      diagnosisDate
      allergies
      currentMedications
      additionalNotes
      profileComplete
    }
  }
`;

export const PATIENT_UPDATE_PROFILE_MUTATION = gql`
  mutation PatientUpdateProfile($data: PatientProfileInput!) {
    updatePatientProfile(data: $data) {
      patientProfile {
        id
        fullName
        phone
        dateOfBirth
        diabetesType
        diagnosisDate
      }
    }
  }
`;

export const PATIENT_PRIVACY_PREFERENCES_QUERY = gql`
  query PatientPrivacyPreferences {
    myPatientPrivacyPreferences {
      id
      allowConsultantRecordAccess
      allowDeviceDataSharing
      allowLabResultSharing
      allowPharmacySharing
      allowMarketing
      dataExportRequestedAt
      dataDeleteRequestedAt
      consentOverridesJson
      updatedAt
    }
  }
`;

export const PATIENT_UPDATE_PRIVACY_PREFERENCES_MUTATION = gql`
  mutation PatientUpdatePrivacyPreferences($data: PatientPrivacyPreferenceInput!) {
    updatePatientPrivacyPreferences(data: $data) {
      preferences {
        id
        allowConsultantRecordAccess
        allowDeviceDataSharing
        allowLabResultSharing
        allowPharmacySharing
        allowMarketing
        updatedAt
      }
    }
  }
`;

export const PATIENT_NOTIFICATION_PREFERENCES_QUERY = gql`
  query PatientNotificationPreferences {
    myNotificationPreferences {
      id
      emailEnabled
      smsEnabled
      pushEnabled
      appointmentRemindersEnabled
      messageAlertsEnabled
      labResultAlertsEnabled
      prescriptionRemindersEnabled
      marketingEnabled
      reminderSettingsJson
      updatedAt
    }
  }
`;

export const PATIENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation PatientUpdateNotificationPreferences($data: NotificationPreferenceInput!) {
    updateMyNotificationPreferences(data: $data) {
      preferences {
        id
        emailEnabled
        smsEnabled
        pushEnabled
        appointmentRemindersEnabled
        prescriptionRemindersEnabled
        reminderSettingsJson
        updatedAt
      }
    }
  }
`;

export const PATIENT_CONSENTS_QUERY = gql`
  query PatientConsents {
    myPatientConsents {
      id
      policyType
      version
      acceptedAt
    }
  }
`;

export const PATIENT_ACCEPT_CONSENT_MUTATION = gql`
  mutation PatientAcceptConsent($policyType: String!, $version: String!) {
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
