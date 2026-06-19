import { gql } from "@apollo/client";

export type VideoConsultationParticipantRole = "PATIENT" | "PROVIDER";

export type JoinVideoConsultationSession = {
  roomUrl: string;
  token: string;
  expiresAt: string;
  participantName: string;
  participantRole: VideoConsultationParticipantRole;
  isOwner: boolean;
};

export type JoinVideoConsultationData = {
  joinVideoConsultation: {
    session: JoinVideoConsultationSession;
  };
};

export type JoinVideoConsultationVariables = {
  appointmentId: string;
};

export const JOIN_VIDEO_CONSULTATION_MUTATION = gql`
  mutation JoinVideoConsultation($appointmentId: UUID!) {
    joinVideoConsultation(appointmentId: $appointmentId) {
      session {
        roomUrl
        token
        expiresAt
        participantName
        participantRole
        isOwner
      }
    }
  }
`;

export const VIDEO_CONSULTATION_JOINABLE_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
] as const;

export function isTelemedicineConsultation(value: string | null | undefined) {
  return value?.trim().toUpperCase() === "TELEMEDICINE";
}

export function canJoinVideoConsultation(
  consultationType: string | null | undefined,
  status: string | null | undefined,
) {
  if (!isTelemedicineConsultation(consultationType) || !status) return false;
  return VIDEO_CONSULTATION_JOINABLE_STATUSES.includes(
    status.trim().toUpperCase() as (typeof VIDEO_CONSULTATION_JOINABLE_STATUSES)[number],
  );
}
