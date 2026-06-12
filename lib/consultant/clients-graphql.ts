import { gql } from "@apollo/client";
import { getGraphQLErrorMessage } from "@/lib/auth/session";

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
      inviteId
      inviteStatus
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
      activeConversationId
      inviteId
      inviteStatus
      setupToken
      patientProfile {
        id
        fullName
        email
        phone
        onboardingStatus
        profileComplete
      }
    }
  }
`;

export function mapInviteError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("PATIENT_INVITE_EMAIL_REQUIRED")) return "An email address is required to invite a patient.";
  if (msg.includes("PATIENT_INVITE_INVALID")) return "The invitation details are invalid. Check the email and try again.";
  if (msg.includes("PATIENT_INVITE_NOT_FOUND")) return "That invitation could not be found.";
  if (msg.includes("PATIENT_INVITE_NOT_PENDING")) return "This invitation is no longer pending.";
  if (msg.includes("PROVIDER_NOT_FOUND")) return "Your provider profile could not be found. Ensure your profile is complete.";
  if (msg.includes("TENANT_NOT_FOUND")) return "Tenant configuration error. Please contact support.";
  return getGraphQLErrorMessage(error, "Failed to send invitation. Please try again.");
}
