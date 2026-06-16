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
        diabetesType
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
        glucoseSummary {
          range
          overallStatus
          stats {
            totalCount
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
          acknowledgedAt
        }
      }
      pcqResponses {
        id
        responseScope
        status
        submittedAt
      }
      appointments {
        id
        startsAt
        status
        consultationType
      }
      encounters {
        id
        status
        startedAt
        clinicalSummary
      }
      prescriptions {
        id
        status
        issuedAt
        items {
          id
          drugName
          dosage
          frequency
        }
      }
      labOrders {
        id
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
  mutation CreatePatientCarePlan($patientId: UUID!, $data: PatientCarePlanInput!) {
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
  mutation AddPatientCarePlanAction($carePlanId: UUID!, $data: PatientCarePlanActionInput!) {
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

// ─── Types ────────────────────────────────────────────────

export type CarePlanStatus = "active" | "paused" | "completed" | "cancelled";

export type WorkspacePatient = {
  id: string;
  fullName: string | null;
  email: string | null;
  diabetesType: string | null;
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

export type WorkspaceGlucoseSummary = {
  range: string | null;
  overallStatus: string | null;
  stats: {
    totalCount: number;
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
  acknowledgedAt: string | null;
};

export type WorkspaceMonitoring = {
  latestGlucose: WorkspaceGlucoseReading | null;
  glucoseSummary: WorkspaceGlucoseSummary;
  activeThreshold: WorkspaceThreshold;
  alerts: WorkspaceAlert[];
} | null;

export type WorkspacePcqResponse = {
  id: string;
  responseScope: string | null;
  status: string | null;
  submittedAt: string | null;
};

export type WorkspaceAppointment = {
  id: string;
  startsAt: string | null;
  status: string | null;
  consultationType: string | null;
};

export type WorkspaceEncounter = {
  id: string;
  status: string | null;
  startedAt: string | null;
  clinicalSummary: string | null;
};

export type WorkspacePrescriptionItem = {
  id: string;
  drugName: string | null;
  dosage: string | null;
  frequency: string | null;
};

export type WorkspacePrescription = {
  id: string;
  status: string | null;
  issuedAt: string | null;
  items: WorkspacePrescriptionItem[];
};

export type WorkspaceLabOrder = {
  id: string;
  status: string | null;
  orderedAt: string | null;
};

export type WorkspaceLabResult = {
  id: string;
  flag: string | null;
  resultedAt: string | null;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
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
  if (msg.includes("PROVIDER_NOT_FOUND")) return "Your provider profile could not be found. Ensure your profile is complete.";
  if (msg.includes("TENANT_NOT_FOUND")) return "Tenant configuration error. Please contact support.";
  if (msg.includes("PATIENT_INVITE_NOT_FOUND") || msg.includes("FORBIDDEN") || msg.includes("PERMISSION")) {
    return "You don't have access to this patient. They may not have accepted your invitation yet.";
  }
  return getGraphQLErrorMessage(error, "Unable to load this patient's workspace.");
}
