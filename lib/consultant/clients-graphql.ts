import { gql } from "@apollo/client";

export const CONSULTANT_CLIENTS_QUERY = gql`
  query ConsultantClients($limit: Int, $search: String) {
    consultantClients(limit: $limit, search: $search) {
      patientId
      patientName
      email
      phone
      diabetesType
      onboardingStatus
      profileComplete
      lastAppointmentAt
      nextAppointmentAt
      activeConversationId
      unreadMessageCount
      pendingPcqCount
      pendingLabReviewCount
      latestAlertSeverity
    }
  }
`;

export const INVITE_PATIENT_MUTATION = gql`
  mutation ConsultantInvitePatient(
    $email: String!
    $fullName: String
    $phone: String
    $note: String
  ) {
    invitePatient(
      email: $email
      fullName: $fullName
      phone: $phone
      note: $note
    ) {
      patient {
        id
        email
        fullName
      }
      conversation {
        id
      }
      setupToken
    }
  }
`;

export function mapInviteError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("PATIENT_INVITE_EMAIL_REQUIRED")) return "An email address is required to invite a patient.";
  if (msg.includes("PROVIDER_NOT_FOUND")) return "Your provider profile could not be found. Ensure your profile is complete.";
  if (msg.includes("TENANT_NOT_FOUND")) return "Tenant configuration error. Please contact support.";
  return "Failed to send invitation. Please try again.";
}
