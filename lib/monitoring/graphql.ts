import { gql } from "@apollo/client";

export const LOG_GLUCOSE_MUTATION = gql`
  mutation LogGlucose($data: GlucoseReadingInput!) {
    logGlucose(data: $data) {
      reading {
        id
        readingType
        recordedAt
        value
        context
        source
        unit
      }
    }
  }
`;

export const LOG_VITALS_MUTATION = gql`
  mutation LogVitals($data: VitalReadingInput!) {
    logVitals(data: $data) {
      reading {
        id
        readingType
        recordedAt
        value
        source
        unit
        vitalType
      }
    }
  }
`;

export const MY_READINGS_QUERY = gql`
  query PatientReadings($readingType: String) {
    myReadings(readingType: $readingType) {
      id
      readingType
      vitalType
      value
      unit
      flag
      recordedAt
    }
  }
`;

export const PATIENT_GLUCOSE_SUMMARY_QUERY = gql`
  query PatientGlucoseSummary($range: String!) {
    glucoseSummary(range: $range) {
      range
      unit
      overallStatus
      stats {
        average
        highest
        lowest
        inRangeCount
        totalCount
        inRangePercent
      }
      buckets {
        label
        date
        average
        status
        readingCount
      }
    }
  }
`;

export const MONITORING_TRENDS_QUERY = gql`
  query PatientMonitoringTrends($readingType: String!, $vitalType: String) {
    monitoringTrends(readingType: $readingType, vitalType: $vitalType) {
      readingType
      average7Days
      average30Days
      latestValue
    }
  }
`;

export const MONITORING_SNAPSHOT_QUERY = gql`
  query PatientMonitoringSnapshot($includeTrend: Boolean) {
    monitoringSnapshot(includeTrend: $includeTrend) {
      latestGlucose {
        id
        readingType
        value
        unit
        recordedAt
      }
      trend {
        readingType
        average7Days
        average30Days
        latestValue
      }
    }
  }
`;

export const MY_ALERTS_QUERY = gql`
  query PatientAlerts {
    myAlerts {
      id
      type
      severity
      message
      createdAt
      acknowledgedAt
    }
  }
`;

export const PROVIDER_PATIENT_ALERTS_QUERY = gql`
  query ProviderPatientAlerts($limit: Int) {
    providerPatientAlerts(limit: $limit) {
      patientName
      alert {
        id
        type
        severity
        sourceEntityType
        sourceEntityId
        message
        createdAt
        acknowledgedAt
      }
    }
  }
`;

export const ACKNOWLEDGE_ALERT_MUTATION = gql`
  mutation AcknowledgeAlert($alertId: UUID!) {
    acknowledgeAlert(alertId: $alertId) {
      alert {
        id
        acknowledgedAt
        acknowledgedByUserId
      }
    }
  }
`;

export const SET_THRESHOLD_MUTATION = gql`
  mutation SetThreshold($patientId: UUID!, $data: ThresholdInput!) {
    setThreshold(patientId: $patientId, data: $data) {
      threshold {
        id
        patientId
        glucoseLow
        glucoseHigh
        active
      }
    }
  }
`;

export const MY_DEVICE_CONNECTIONS_QUERY = gql`
  query PatientDeviceConnections {
    myDeviceConnections {
      id
      vendor
      status
      connectedAt
      revokedAt
    }
  }
`;
