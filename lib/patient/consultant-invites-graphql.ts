import { gql } from "@apollo/client";
import { getGraphQLErrorMessage } from "@/lib/auth/session";

/**
 * Patient dashboard view of consultant invites and accepted consultants.
 * `status` filters by INVITED | ACCEPTED | REJECTED (omit for all).
 */
export const MY_PATIENT_CONSULTANTS_QUERY = gql`
  query MyPatientConsultants($status: String) {
    myPatientConsultants(status: $status) {
      inviteId
      status
      activeConversationId
      invitedAt
      acceptedAt
      rejectedAt
      provider {
        id
        displayName
        avatarUrl
        specialties
      }
    }
  }
`;

export const ACCEPT_PATIENT_CONSULTANT_INVITE_MUTATION = gql`
  mutation AcceptPatientConsultantInvite($inviteId: UUID!) {
    acceptPatientConsultantInvite(inviteId: $inviteId) {
      relationship {
        inviteId
        status
        activeConversationId
      }
    }
  }
`;

export const REJECT_PATIENT_CONSULTANT_INVITE_MUTATION = gql`
  mutation RejectPatientConsultantInvite($inviteId: UUID!) {
    rejectPatientConsultantInvite(inviteId: $inviteId) {
      relationship {
        inviteId
        status
        activeConversationId
      }
    }
  }
`;

export type InviteStatus = "INVITED" | "ACCEPTED" | "REJECTED";

export type PatientConsultantInvite = {
  inviteId: string;
  status: InviteStatus;
  activeConversationId: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  provider: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specialties: string[];
  };
};

export function mapConsultantInviteError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("PATIENT_INVITE_INVALID")) return "This invitation is invalid.";
  if (msg.includes("PATIENT_INVITE_NOT_FOUND")) return "This invitation could not be found.";
  if (msg.includes("PATIENT_INVITE_NOT_PENDING")) return "This invitation has already been answered.";
  return getGraphQLErrorMessage(error, "Unable to update this invitation. Please try again.");
}
