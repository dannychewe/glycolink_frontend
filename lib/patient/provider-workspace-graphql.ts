import { gql } from "@apollo/client";
import type { InviteStatus } from "@/lib/patient/consultant-invites-graphql";

/**
 * One-shot query for the patient-side provider workspace after a relationship
 * exists. Returns the provider card, direct conversation, booking state,
 * appointments, assigned (supplemental) PCQs, care plans and the sharing
 * preferences for this patient profile inside the provider's tenant.
 *
 * `inviteId` comes from {@link MY_PATIENT_CONSULTANTS_QUERY}.
 */
export const PATIENT_PROVIDER_WORKSPACE_QUERY = gql`
  query PatientProviderWorkspace($inviteId: UUID!, $limit: Int) {
    patientProviderWorkspace(inviteId: $inviteId, limit: $limit) {
      canMessage
      canBookAppointment
      relationship {
        inviteId
        status
        activeConversationId
        invitedAt
        acceptedAt
        rejectedAt
      }
      provider {
        id
        displayName
        avatarUrl
        specialties
      }
      conversation {
        id
        status
        unreadMessageCount
        lastMessageAt
      }
      appointments {
        id
        startsAt
        endsAt
        status
        consultationType
        providerName
      }
      assignedPcqs {
        id
        responseScope
        status
        assignmentReason
        dueAt
        submittedAt
        template {
          id
          name
        }
      }
      carePlans {
        id
        title
        summary
        status
        startsAt
        endsAt
        actions {
          id
          type
          description
          targetDate
          status
        }
      }
      privacyPreferences {
        allowConsultantRecordAccess
        allowDeviceDataSharing
        allowLabResultSharing
        allowPharmacySharing
        updatedAt
      }
    }
  }
`;

export type WorkspaceRelationship = {
  inviteId: string;
  status: InviteStatus;
  activeConversationId: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
};

export type WorkspaceProvider = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  specialties: string[];
};

export type WorkspaceConversation = {
  id: string;
  status: string;
  unreadMessageCount: number;
  lastMessageAt: string | null;
};

export type WorkspaceAppointment = {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string;
  consultationType: string | null;
  providerName: string | null;
};

export type WorkspaceAssignedPcq = {
  id: string;
  responseScope: string | null;
  status: string;
  assignmentReason: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  template: {
    id: string;
    name: string;
  } | null;
};

export type WorkspaceCarePlanAction = {
  id: string;
  type: string | null;
  description: string | null;
  targetDate: string | null;
  status: string;
};

export type WorkspaceCarePlan = {
  id: string;
  title: string | null;
  summary: string | null;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  actions: WorkspaceCarePlanAction[];
};

export type WorkspacePrivacyPreferences = {
  allowConsultantRecordAccess: boolean;
  allowDeviceDataSharing: boolean;
  allowLabResultSharing: boolean;
  allowPharmacySharing: boolean;
  updatedAt: string | null;
};

export type PatientProviderWorkspace = {
  canMessage: boolean;
  canBookAppointment: boolean;
  relationship: WorkspaceRelationship;
  provider: WorkspaceProvider;
  conversation: WorkspaceConversation | null;
  appointments: WorkspaceAppointment[];
  assignedPcqs: WorkspaceAssignedPcq[];
  carePlans: WorkspaceCarePlan[];
  privacyPreferences: WorkspacePrivacyPreferences | null;
};
