import { gql } from "@apollo/client";

export const CONSULTANT_APPOINTMENT_POLICY_QUERY = gql`
  query ConsultantAppointmentPolicy($organizationId: UUID!) {
    appointmentPolicy(organizationId: $organizationId) {
      id
      organizationId
      consultationTypes
      defaultDurationMinutes
      bufferMinutes
      advanceBookingDays
      cancellationWindowHours
      autoConfirm
      requiresDeposit
      depositPercentage
      updatedAt
    }
  }
`;

export const CONSULTANT_UPDATE_APPOINTMENT_POLICY_MUTATION = gql`
  mutation ConsultantUpdateAppointmentPolicy(
    $organizationId: UUID!
    $data: AppointmentPolicyInput!
  ) {
    updateAppointmentPolicy(organizationId: $organizationId, data: $data) {
      policy {
        id
        consultationTypes
        defaultDurationMinutes
        bufferMinutes
        advanceBookingDays
        cancellationWindowHours
        autoConfirm
        requiresDeposit
        depositPercentage
        updatedAt
      }
    }
  }
`;

export const CONSULTANT_ORG_DEPARTMENTS_QUERY = gql`
  query ConsultantOrgDepartments($organizationId: UUID!) {
    organizationDepartments(organizationId: $organizationId) {
      id
      name
      status
      headProviderId
      createdAt
    }
  }
`;

export const CONSULTANT_UPSERT_DEPARTMENT_MUTATION = gql`
  mutation ConsultantUpsertDepartment($organizationId: UUID!, $data: DepartmentInput!) {
    upsertDepartment(organizationId: $organizationId, data: $data) {
      department {
        id
        name
        status
        headProviderId
        createdAt
      }
    }
  }
`;

export const CONSULTANT_ORG_LOCATIONS_QUERY = gql`
  query ConsultantOrgLocations($organizationId: UUID!) {
    organizationLocations(organizationId: $organizationId) {
      id
      name
      address
      city
      country
      isPrimary
      isActive
      createdAt
    }
  }
`;

export const CONSULTANT_NOTIFICATION_PREFERENCES_QUERY = gql`
  query ConsultantNotificationPreferences($organizationId: UUID!) {
    notificationPreferences(organizationId: $organizationId) {
      id
      organizationId
      emailEnabled
      smsEnabled
      appointmentReminders
      labResultsReady
      prescriptionReady
      patientMessages
      systemAlerts
      updatedAt
    }
  }
`;

export const CONSULTANT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION = gql`
  mutation ConsultantUpdateNotificationPreferences(
    $organizationId: UUID!
    $data: NotificationPreferencesInput!
  ) {
    updateNotificationPreferences(organizationId: $organizationId, data: $data) {
      preferences {
        id
        emailEnabled
        smsEnabled
        appointmentReminders
        labResultsReady
        prescriptionReady
        patientMessages
        systemAlerts
        updatedAt
      }
    }
  }
`;
