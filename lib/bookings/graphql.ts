import { gql } from "@apollo/client";

export const AVAILABLE_SLOTS_QUERY = gql`
  query PatientAvailableSlots($providerId: UUID!, $date: Date!) {
    availableSlots(providerId: $providerId, date: $date) {
      startTime
      endTime
    }
  }
`;

export const UPCOMING_APPOINTMENT_QUERY = gql`
  query PatientUpcomingAppointment {
    upcomingAppointment {
      appointment {
        id
        status
        startsAt
        endsAt
        consultationType
      }
      provider {
        id
        displayName
      }
    }
  }
`;

export const MY_APPOINTMENTS_QUERY = gql`
  query PatientAppointments($limit: Int, $status: String) {
    myAppointments(limit: $limit, status: $status) {
      id
      status
      startsAt
      endsAt
      consultationType
      providerId
      patientId
      cancelReason
      cancelledAt
      completedAt
    }
  }
`;

export const PENDING_ACTIONS_QUERY = gql`
  query PatientPendingActions {
    pendingActions {
      action
      title
      description
      status
      dueAt
      appointment {
        id
        status
        startsAt
      }
    }
  }
`;

export const BOOK_APPOINTMENT_MUTATION = gql`
  mutation PatientBookAppointment(
    $providerId: UUID!
    $startTime: DateTime!
    $endTime: DateTime!
    $consultationType: String
  ) {
    bookAppointment(
      providerId: $providerId
      startTime: $startTime
      endTime: $endTime
      consultationType: $consultationType
    ) {
      appointment {
        id
        status
        startsAt
        endsAt
        consultationType
        providerId
        patientId
      }
    }
  }
`;

export const RESCHEDULE_APPOINTMENT_MUTATION = gql`
  mutation PatientRescheduleAppointment(
    $appointmentId: UUID!
    $newStartTime: DateTime!
    $newEndTime: DateTime!
  ) {
    rescheduleAppointment(
      appointmentId: $appointmentId
      newStartTime: $newStartTime
      newEndTime: $newEndTime
    ) {
      appointment {
        id
        status
        startsAt
        endsAt
      }
    }
  }
`;

export const CANCEL_APPOINTMENT_MUTATION = gql`
  mutation PatientCancelAppointment($appointmentId: UUID!, $reason: String) {
    cancelAppointment(appointmentId: $appointmentId, reason: $reason) {
      appointment {
        id
        status
        cancelledAt
        cancelReason
      }
    }
  }
`;

export const TODAYS_APPOINTMENTS_QUERY = gql`
  query TodaysAppointments($date: Date) {
    todaysAppointments(date: $date) {
      patientName
      appointment {
        id
        startsAt
        endsAt
        status
        consultationType
      }
    }
  }
`;

export const UPCOMING_APPOINTMENTS_QUERY = gql`
  query UpcomingAppointments($limit: Int) {
    upcomingAppointments(limit: $limit) {
      patientName
      appointment {
        id
        startsAt
        endsAt
        status
        consultationType
      }
    }
  }
`;
