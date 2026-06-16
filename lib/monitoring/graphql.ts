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
        createdAt
      }
    }
  }
`;

// ─── Consultant patient monitoring detail ─────────────────
//
// Dedicated monitoring record for the consultant patient workspace, available
// after an invite is accepted. Privacy preferences (allowConsultantRecordAccess
// / allowDeviceDataSharing) can suppress the entire payload: no latest reading,
// no recent readings, no threshold, no alerts, and a zero-count summary.

export const CONSULTANT_PATIENT_MONITORING_QUERY = gql`
  query ConsultantPatientMonitoring($patientId: UUID!, $range: String, $limit: Int) {
    consultantPatientMonitoring(patientId: $patientId, range: $range, limit: $limit) {
      patient {
        id
        fullName
        email
        diabetesType
      }
      latestGlucose {
        id
        value
        unit
        flag
        recordedAt
      }
      trend {
        average7Days
        average30Days
        latestValue
      }
      glucoseSummary {
        range
        overallStatus
        stats {
          average
          highest
          lowest
          inRangePercent
        }
        buckets {
          label
          average
          status
          readingCount
        }
      }
      activeThreshold {
        id
        glucoseLow
        glucoseHigh
        active
      }
      recentReadings {
        id
        value
        unit
        flag
        recordedAt
      }
      alerts {
        id
        severity
        message
        createdAt
        acknowledgedAt
      }
    }
  }
`;

export type ConsultantMonitoringPatient = {
  id: string;
  fullName: string | null;
  email: string | null;
  diabetesType: string | null;
};

export type ConsultantMonitoringReading = {
  id: string;
  value: number;
  unit: string | null;
  flag: string | null;
  recordedAt: string | null;
};

export type ConsultantMonitoringTrend = {
  average7Days: number | null;
  average30Days: number | null;
  latestValue: number | null;
} | null;

export type ConsultantMonitoringSummaryStats = {
  average: number | null;
  highest: number | null;
  lowest: number | null;
  inRangePercent: number | null;
} | null;

export type ConsultantMonitoringBucket = {
  label: string;
  average: number | null;
  status: string | null;
  readingCount: number;
};

export type ConsultantMonitoringSummary = {
  range: string | null;
  overallStatus: string | null;
  stats: ConsultantMonitoringSummaryStats;
  buckets: ConsultantMonitoringBucket[];
} | null;

export type ConsultantMonitoringThreshold = {
  id: string;
  glucoseLow: number | null;
  glucoseHigh: number | null;
  active: boolean | null;
} | null;

export type ConsultantMonitoringAlert = {
  id: string;
  severity: string | null;
  message: string | null;
  createdAt: string | null;
  acknowledgedAt: string | null;
};

export type ConsultantPatientMonitoring = {
  patient: ConsultantMonitoringPatient;
  latestGlucose: ConsultantMonitoringReading | null;
  trend: ConsultantMonitoringTrend;
  glucoseSummary: ConsultantMonitoringSummary;
  activeThreshold: ConsultantMonitoringThreshold;
  recentReadings: ConsultantMonitoringReading[];
  alerts: ConsultantMonitoringAlert[];
};

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
