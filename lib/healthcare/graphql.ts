import { gql } from "@apollo/client";

export const CONSULTANTS_QUERY = gql`
  query PatientConsultants($specialty: String, $clinicId: UUID) {
    consultants(specialty: $specialty, clinicId: $clinicId) {
      id
      displayName
      firstName
      lastName
      specialty
      biography
      languages
      acceptingPatients
      status
      clinic {
        id
        name
      }
    }
  }
`;

export const CONSULTANT_QUERY = gql`
  query PatientConsultant($id: UUID!) {
    consultant(id: $id) {
      id
      displayName
      specialty
      biography
      languages
      acceptingPatients
      status
      clinic {
        id
        name
      }
    }
  }
`;

export const REQUEST_CONSULTATION_MUTATION = gql`
  mutation PatientRequestConsultation($consultantId: UUID!, $reason: String) {
    requestConsultation(consultantId: $consultantId, reason: $reason) {
      success
      message
      errors {
        code
        message
      }
      data {
        consultationRequest {
          id
          status
          reason
          consultant {
            id
            displayName
            specialty
          }
        }
      }
    }
  }
`;

export const ACCEPT_PATIENT_INVITATION_MUTATION = gql`
  mutation AcceptPatientInvitation($token: String!) {
    acceptPatientInvitation(token: $token) {
      success
      message
      errors {
        code
        message
      }
      data {
        patientProfile {
          id
          source
          status
          primaryClinic {
            id
            name
          }
          assignedConsultant {
            id
            displayName
            specialty
          }
        }
      }
    }
  }
`;

export const CLINIC_PATIENT_CONSULTANT_VISIBILITY_QUERY = gql`
  query ClinicPatientConsultantVisibility($id: UUID!) {
    organization(id: $id) {
      id
      name
      patientConsultantVisibility
    }
  }
`;

export const UPDATE_CLINIC_PATIENT_CONSULTANT_VISIBILITY_MUTATION = gql`
  mutation UpdateClinicPatientConsultantVisibility(
    $id: UUID!
    $patientConsultantVisibility: String!
  ) {
    updateOrganization(
      id: $id
      input: { patientConsultantVisibility: $patientConsultantVisibility }
    ) {
      success
      message
      errors {
        code
        message
      }
      data {
        organization {
          id
          patientConsultantVisibility
        }
      }
    }
  }
`;
