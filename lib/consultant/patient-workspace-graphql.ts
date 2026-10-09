import { gql } from "@apollo/client";
import { getGraphQLErrorMessage } from "@/lib/auth/session";

/**
 * Composed consultant patient detail screen. Requires an accepted
 * patient-consultant invite. Privacy flags on the patient can suppress
 * whole sections (records, monitoring, labs, prescriptions) — those arrays
 * simply come back empty and the matching recommendation is omitted.
 */
export const CONSULTANT_PATIENT_WORKSPACE_QUERY = gql`
  query ConsultantPatientWorkspace($patientId: UUID!, $limit: Int) {
    consultantPatientWorkspace(patientId: $patientId, limit: $limit) {
      patient {
        id
        fullName
        email
        phone
        dateOfBirth
        diabetesType
        diagnosisDate
        allergies
        currentMedications
        baselineWeight
        baselineBpSystolic
        baselineBpDiastolic
        profileComplete
        onboardingStatus
      }
      conversation {
        id
        status
        unreadMessageCount
        lastMessageAt
      }
      monitoring {
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
          unit
          overallStatus
          stats {
            average
            highest
            lowest
            totalCount
            inRangeCount
            inRangePercent
          }
        }
        activeThreshold {
          id
          glucoseLow
          glucoseHigh
        }
        alerts {
          id
          severity
          message
          createdAt
          acknowledgedAt
        }
      }
      pcqResponses {
        id
        appointmentId
        dueAt
        template {
          id
          name
        }
        responseScope
        status
        submittedAt
      }
      appointments {
        id
        startsAt
        endsAt
        status
        consultationType
        source
        cancelReason
        cancelledAt
        completedAt
        rescheduledFromAppointmentId
      }
      encounters {
        id
        appointmentId
        encounterType
        status
        startedAt
        endedAt
        finalizedAt
        clinicalSummary
        soapVersions {
          id
          versionNumber
          isFinalized
          subjective
          objective
          assessment
          plan
          createdAt
        }
        diagnoses {
          id
          codeSystem
          code
          description
          isPrimary
        }
        observations {
          id
          type
          valueNumeric
          valueText
          unit
        }
        carePlanActions {
          id
          type
          description
          targetDate
          status
        }
      }
      prescriptions {
        id
        status
        issuedAt
        revokedAt
        items {
          id
          drugName
          dosage
          frequency
          duration
          route
          instructions
          status
        }
      }
      labOrders {
        id
        encounterId
        tests {
          id
          testName
          priority
          results {
            id
            valueText
            valueNumeric
            unit
            referenceRange
            flag
            resultedAt
          }
        }
        reviewNotes {
          id
          note
          createdAt
          providerId
        }
        status
        orderedAt
      }
      labResults {
        id
        flag
        resultedAt
        valueText
        valueNumeric
        unit
      }
      documents {
        id
        docType
        recordedDate
        originalName
        fileUrl
      }
      carePlanActions {
        id
        type
        description
        targetDate
        status
      }
      ongoingCarePlans {
        id
        patientId
        providerId
        startsAt
        endsAt
        createdAt
        milestones {
          id
          encounterId
          title
          description
          targetValue
          targetDate
          status
          achievedAt
          achievedNote
        }
        title
        summary
        status
        actions {
          id
          type
          description
          targetDate
          status
        }
      }
      recommendations {
        code
        severity
        title
        description
        action
        sourceType
        sourceId
      }
    }
  }
`;

// ─── Ongoing Care Plans ───────────────────────────────────

export const CREATE_PATIENT_CARE_PLAN_MUTATION = gql`
  mutation CreatePatientCarePlan(
    $patientId: UUID!
    $data: PatientCarePlanInput!
  ) {
    createPatientCarePlan(patientId: $patientId, data: $data) {
      carePlan {
        id
        title
        summary
        status
        actions {
          id
          type
          description
          targetDate
          status
        }
      }
    }
  }
`;

export const ADD_PATIENT_CARE_PLAN_ACTION_MUTATION = gql`
  mutation AddPatientCarePlanAction(
    $carePlanId: UUID!
    $data: PatientCarePlanActionInput!
  ) {
    addPatientCarePlanAction(carePlanId: $carePlanId, data: $data) {
      action {
        id
        type
        description
        targetDate
        status
      }
    }
  }
`;

export const UPLOAD_PATIENT_DOCUMENT_MUTATION = gql`
  mutation ConsultantUploadDocument($patientId: UUID!, $data: DocumentInput!) {
    uploadDocument(patientId: $patientId, data: $data) {
      document {
        id
        docType
        recordedDate
        originalName
        fileUrl
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────

export type CarePlanStatus = "active" | "paused" | "completed" | "cancelled";

export type WorkspacePatient = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  diabetesType: string | null;
  diagnosisDate: string | null;
  allergies: string | null;
  currentMedications: string | null;
  baselineWeight: number | string | null;
  baselineBpSystolic: number | null;
  baselineBpDiastolic: number | null;
  profileComplete: boolean;
  onboardingStatus: string | null;
};

export type WorkspaceConversation = {
  id: string;
  status: string | null;
  unreadMessageCount: number;
  lastMessageAt: string | null;
} | null;

export type WorkspaceGlucoseReading = {
  id: string;
  value: number;
  unit: string | null;
  flag: string | null;
  recordedAt: string | null;
};

export type WorkspaceGlucoseTrend = {
  average7Days: number | string | null;
  average30Days: number | string | null;
  latestValue: number | string | null;
} | null;

export type WorkspaceGlucoseSummary = {
  range: string | null;
  unit: string | null;
  overallStatus: string | null;
  stats: {
    average: number | string | null;
    highest: number | string | null;
    lowest: number | string | null;
    totalCount: number;
    inRangeCount: number;
    inRangePercent: number | null;
  } | null;
} | null;

export type WorkspaceThreshold = {
  id: string;
  glucoseLow: number | null;
  glucoseHigh: number | null;
} | null;

export type WorkspaceAlert = {
  id: string;
  severity: string | null;
  message: string | null;
  createdAt: string | null;
  acknowledgedAt: string | null;
};

export type WorkspaceMonitoring = {
  latestGlucose: WorkspaceGlucoseReading | null;
  trend: WorkspaceGlucoseTrend;
  glucoseSummary: WorkspaceGlucoseSummary;
  activeThreshold: WorkspaceThreshold;
  alerts: WorkspaceAlert[];
} | null;

export type WorkspacePcqResponse = {
  id: string;
  appointmentId: string | null;
  dueAt: string | null;
  template: { id: string; name: string };
  responseScope: string | null;
  status: string | null;
  submittedAt: string | null;
};

export type WorkspaceAppointment = {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  status: string | null;
  consultationType: string | null;
  source: string | null;
  cancelReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
  rescheduledFromAppointmentId: string | null;
};

export type WorkspaceSoapVersion = {
  id: string;
  versionNumber: number;
  isFinalized: boolean;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdAt: string | null;
};

export type WorkspaceDiagnosis = {
  id: string;
  codeSystem: string | null;
  code: string | null;
  description: string;
  isPrimary: boolean;
};

export type WorkspaceObservation = {
  id: string;
  type: string;
  valueNumeric: number | string | null;
  valueText: string | null;
  unit: string | null;
};

export type WorkspaceEncounter = {
  id: string;
  appointmentId: string;
  encounterType: string;
  status: string | null;
  startedAt: string | null;
  endedAt: string | null;
  finalizedAt: string | null;
  clinicalSummary: string | null;
  soapVersions: WorkspaceSoapVersion[];
  diagnoses: WorkspaceDiagnosis[];
  observations: WorkspaceObservation[];
  carePlanActions: WorkspaceCarePlanAction[];
};

export type WorkspacePrescriptionItem = {
  id: string;
  drugName: string | null;
  dosage: string | null;
  frequency: string | null;
  duration: number | null;
  route: string | null;
  instructions: string | null;
  status: string | null;
};

export type WorkspacePrescription = {
  id: string;
  status: string | null;
  issuedAt: string | null;
  revokedAt: string | null;
  items: WorkspacePrescriptionItem[];
};

export type WorkspaceLabReviewNote = {
  id: string;
  note: string;
  createdAt: string | null;
  providerId: string;
};

export type WorkspaceLabTest = {
  id: string;
  testName: string;
  priority: string | null;
  results: WorkspaceLabResult[];
};

export type WorkspaceLabOrder = {
  id: string;
  encounterId: string;
  tests: WorkspaceLabTest[];
  reviewNotes: WorkspaceLabReviewNote[];
  status: string | null;
  orderedAt: string | null;
};

export type WorkspaceLabResult = {
  id: string;
  flag: string | null;
  resultedAt: string | null;
  valueText: string | null;
  valueNumeric: number | string | null;
  unit: string | null;
  referenceRange: string | null;
};

export type WorkspaceDocument = {
  id: string;
  docType: string | null;
  recordedDate: string | null;
  originalName: string | null;
  fileUrl: string | null;
};

export type WorkspaceCarePlanAction = {
  id: string;
  type: string | null;
  description: string | null;
  targetDate: string | null;
  status: CarePlanStatus | string | null;
};

export type WorkspaceOngoingCarePlan = {
  id: string;
  patientId: string;
  providerId: string;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  milestones: {
    id: string;
    encounterId: string | null;
    title: string;
    description: string | null;
    targetValue: string | null;
    targetDate: string | null;
    status: string;
    achievedAt: string | null;
    achievedNote: string | null;
  }[];
  title: string;
  summary: string | null;
  status: CarePlanStatus | string | null;
  actions: WorkspaceCarePlanAction[];
};

export type WorkspaceRecommendation = {
  code: string;
  severity: "info" | "warning" | "high" | "critical" | string;
  title: string;
  description: string | null;
  action: string | null;
  sourceType: string | null;
  sourceId: string | null;
};

export type ConsultantPatientWorkspace = {
  patient: WorkspacePatient;
  conversation: WorkspaceConversation;
  monitoring: WorkspaceMonitoring;
  pcqResponses: WorkspacePcqResponse[];
  appointments: WorkspaceAppointment[];
  encounters: WorkspaceEncounter[];
  prescriptions: WorkspacePrescription[];
  labOrders: WorkspaceLabOrder[];
  labResults: WorkspaceLabResult[];
  documents: WorkspaceDocument[];
  carePlanActions: WorkspaceCarePlanAction[];
  ongoingCarePlans: WorkspaceOngoingCarePlan[];
  recommendations: WorkspaceRecommendation[];
};

export type CarePlanActionInput = {
  type: string;
  description: string;
  targetDate?: string;
  status?: CarePlanStatus;
};

export type PatientCarePlanInput = {
  title: string;
  summary?: string;
  status?: CarePlanStatus;
  startsAt?: string;
  endsAt?: string;
  actions?: CarePlanActionInput[];
};

export function mapWorkspaceError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("PROVIDER_NOT_FOUND"))
    return "Your provider profile could not be found. Ensure your profile is complete.";
  if (msg.includes("TENANT_NOT_FOUND"))
    return "Tenant configuration error. Please contact support.";
  if (
    msg.includes("PATIENT_INVITE_NOT_FOUND") ||
    msg.includes("FORBIDDEN") ||
    msg.includes("PERMISSION")
  ) {
    return "You don't have access to this patient. They may not have accepted your invitation yet.";
  }
  return getGraphQLErrorMessage(
    error,
    "Unable to load this patient's workspace.",
  );
}
