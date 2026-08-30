import { gql } from "@apollo/client";

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type UUID = string;
export type DateString = string;
export type DateTimeString = string;
export type DecimalString = string;

export type CareProgrammeStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED" | string;

export type ProgrammeEnrolmentStatus =
  | "INVITED"
  | "PENDING_BASELINE"
  | "READY_FOR_ACTIVATION"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "WITHDRAWN"
  | string;

export type ProgrammeBaselineStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "RETURNED"
  | "SUPERSEDED"
  | string;

export type ProgrammeCarePlanStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ACTIVE"
  | "PAUSED"
  | "COMPLETED"
  | "CANCELLED"
  | "SUPERSEDED"
  | string;

export type MonitoringWindowStatus =
  | "SCHEDULED"
  | "DUE"
  | "SATISFIED"
  | "MISSED"
  | "EXCUSED"
  | "CANCELLED"
  | "SUPERSEDED"
  | string;

export type MonitoringAlertStatus =
  | "OPEN"
  | "CLAIMED"
  | "UNDER_REVIEW"
  | "PATIENT_CONTACTED"
  | "CONSULTATION_REQUIRED"
  | "ESCALATED"
  | "RESOLVED"
  | "DISMISSED"
  | string;

export type ProgrammeInvoiceStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "VOID"
  | string;

export type ProgrammeEntitlementStatus =
  | "ACTIVE"
  | "IN_GRACE"
  | "COMMERCIALLY_SUSPENDED"
  | "ENDED"
  | string;

export type AlertOwnershipEvent = {
  id: UUID;
  alertId: UUID;
  previousOwnerUserId?: UUID | null;
  newOwnerUserId?: UUID | null;
  actorUserId?: UUID | null;
  careTeamRole?: string | null;
  reason?: string | null;
  changedAt: DateTimeString;
};

export type ProgrammeProviderSummary = {
  id: UUID;
  displayName?: string | null;
};

export type ProgrammePatientSummary = {
  id: UUID;
  fullName?: string | null;
  email?: string | null;
  diabetesType?: string | null;
};

export type CareProgramme = {
  id: UUID;
  name: string;
  code: string;
  description?: string | null;
  programmeType: string;
  status: CareProgrammeStatus;
  defaultDurationDays?: number | null;
  defaultMonitoringCadenceDays: number;
  settingsJson: string;
  enrolmentOpen: boolean;
  startsAt?: DateString | null;
  endsAt?: DateString | null;
  activatedAt?: DateTimeString | null;
  pausedAt?: DateTimeString | null;
  archivedAt?: DateTimeString | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
  organization?: {
    id: UUID;
    name: string;
    type?: string | null;
    status?: string | null;
  } | null;
};

export type ProgrammeCareTeamAssignment = {
  id: UUID;
  role: string;
  assignedUserId: UUID;
  provider?: ProgrammeProviderSummary | null;
  active: boolean;
  assignedAt: DateTimeString;
  endedAt?: DateTimeString | null;
  createdAt: DateTimeString;
};

export type ProgrammeEnrolment = {
  id: UUID;
  programme: CareProgramme;
  patient: ProgrammePatientSummary;
  status: ProgrammeEnrolmentStatus;
  enrolledAt: DateTimeString;
  startsAt?: DateString | null;
  expectedEndsAt?: DateString | null;
  completedAt?: DateTimeString | null;
  withdrawnAt?: DateTimeString | null;
  leadProvider?: ProgrammeProviderSummary | null;
  monitoringCadenceDays: number;
  monitoringCadenceOverrideDays?: number | null;
  baselineCompleted: boolean;
  baselineCompletedAt?: DateTimeString | null;
  baselinePcqResponseId?: UUID | null;
  carePlanReady: boolean;
  carePlanReadyAt?: DateTimeString | null;
  carePlanId?: UUID | null;
  pauseReason?: string | null;
  completionReason?: string | null;
  withdrawalReason?: string | null;
  careTeamAssignments: ProgrammeCareTeamAssignment[];
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type ProgrammeBaselineAssessment = {
  id: UUID;
  status: ProgrammeBaselineStatus;
  versionNumber: number;
  isCurrent: boolean;
  pcqResponseId?: UUID | null;
  pcqTemplateVersionId?: UUID | null;
  diabetesHistoryJson: JsonValue;
  treatmentContextJson: JsonValue;
  measurementContextJson: JsonValue;
  patientContextJson: JsonValue;
  sourceReferencesJson: JsonValue;
  submittedAt?: DateTimeString | null;
  reviewedAt?: DateTimeString | null;
  reviewedByProvider?: ProgrammeProviderSummary | null;
  reviewNote?: string | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type ProgrammeCarePlan = {
  id: UUID;
  enrolmentId?: UUID | null;
  patient: ProgrammePatientSummary;
  provider: ProgrammeProviderSummary;
  title: string;
  summary?: string | null;
  status: ProgrammeCarePlanStatus;
  startsAt?: DateString | null;
  expectedReviewAt?: DateString | null;
  endsAt?: DateString | null;
  goalsJson: JsonValue;
  followUpScheduleJson: JsonValue;
  laboratoryFollowUpJson: JsonValue;
  medicationReviewJson: JsonValue;
  patientInstructions?: string | null;
  internalNotes?: string | null;
  revisionReason?: string | null;
  versionNumber: number;
  approvedByProvider?: ProgrammeProviderSummary | null;
  approvedAt?: DateTimeString | null;
  supersededById?: UUID | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type ProgrammeMonitoringRequirement = {
  id: UUID;
  programme: Pick<CareProgramme, "id" | "name" | "status">;
  enrolmentId?: UUID | null;
  carePlanId?: UUID | null;
  observationType: string;
  observationContext?: string | null;
  required: boolean;
  cadenceType: string;
  intervalDays?: number | null;
  frequencyPerInterval?: number | null;
  applicableDaysJson: JsonValue;
  timeOfDay?: string | null;
  startsAt?: DateString | null;
  endsAt?: DateString | null;
  reminderConfigJson: JsonValue;
  gracePeriodDays?: number | null;
  source: string;
  active: boolean;
  approvedByProvider?: ProgrammeProviderSummary | null;
  approvedAt?: DateTimeString | null;
  createdAt: DateTimeString;
  updatedAt: DateTimeString;
};

export type ReportingDateRange = {
  start?: DateTimeString | null;
  end?: DateTimeString | null;
  startDate?: DateString | null;
  endDate?: DateString | null;
  timezone?: string | null;
};

export type ProgrammeAdherenceReportingSummary = {
  dateRange: ReportingDateRange;
  monitoringAdherence: {
    patientsExpected: number;
    patientsWithSatisfiedExpectation: number;
    totalExpectedWindows: number;
    satisfiedWindows: number;
    missedWindows: number;
    excusedWindows: number;
    cancelledOrSupersededWindows: number;
    openMonitoringGaps: number;
    patientsWithOpenMonitoringGaps: number;
    patientsWithConsecutiveMissedExpectations: number;
    adherenceRate?: number | null;
    adherenceDenominator: number;
    excusedTreatment: string;
  };
};

export type ClinicWorkQueueReportingSummary = {
  dateRange: ReportingDateRange;
  clinicalAlerts: {
    totalActiveAlerts: number;
    newAlerts: number;
    underReview: number;
    patientContacted: number;
    consultationRequired: number;
    escalated: number;
    resolvedDuringPeriod: number;
    dismissedDuringPeriod: number;
    unassignedActiveAlerts: number;
    overdueActiveAlerts: number;
    alertsWithoutConfiguredTarget: number;
    monitoringGapWorkItems: number;
    clinicalThresholdAlerts: number;
    followUpAdminWorkItems: number;
    alertsAwaitingFirstReview: number;
  };
  careTeamWorkload: {
    activeAlertsByOwner: JsonValue;
    unassignedAlerts: number;
    alertsClaimedDuringPeriod: number;
    alertsResolvedDuringPeriod: number;
    openFollowUps: number;
    escalatedItems: number;
    patientsAssignedByMember: JsonValue;
  };
};

export type ClinicResponsePerformanceReporting = {
  dateRange: ReportingDateRange;
  responsePerformance: {
    medianTimeToFirstReviewMinutes?: number | null;
    averageTimeToFirstReviewMinutes?: number | null;
    medianTimeToResolutionMinutes?: number | null;
    averageTimeToResolutionMinutes?: number | null;
    reviewedWithinDueTimePercent?: number | null;
    resolvedWithinDueTimePercent?: number | null;
    alertsWithoutReviewTarget: number;
    alertsWithoutResolutionTarget: number;
    unresolvedOverdueAlerts: number;
    escalationCount: number;
    reopenedAlertCount: number;
  };
};

export type OperationalTrendSeries = {
  dateRange: ReportingDateRange;
  granularity: string;
  buckets: Array<{
    label: string;
    bucketStart: DateTimeString;
    bucketEnd: DateTimeString;
    metrics: JsonValue;
  }>;
};

export type ProgrammeComparison = {
  dateRange: ReportingDateRange;
  items: Array<{
    programmeId: UUID;
    programmeName: string;
    activeEnrolments: number;
    readinessBlockers: number;
    adherenceRate?: number | null;
    patientsWithMonitoringGaps: number;
    activeClinicalAlerts: number;
    unassignedWork: number;
    medianFirstReviewMinutes?: number | null;
    medianResolutionMinutes?: number | null;
    completedEnrolments: number;
    withdrawnEnrolments: number;
  }>;
};

export type EnrolmentReadiness = {
  ready: boolean;
  blockers: string[];
  baselineApproved: boolean;
  leadProviderAssigned: boolean;
  carePlanActive: boolean;
  hasMonitoringRequirements: boolean;
  programmeActive: boolean;
  baselineId?: UUID | null;
  carePlanId?: UUID | null;
};

export type ClinicProgrammeDashboardOverview = {
  programmePopulation: {
    totalEnrolments: number;
    pendingBaseline: number;
    active: number;
    paused: number;
    newEnrolments: number;
    retentionRate?: number | null;
  };
  readiness: {
    readyForActivation: number;
    blockedCount: number;
    awaitingBaselineSubmission: number;
    awaitingBaselineReview: number;
    missingLeadProvider: number;
    missingActiveCarePlan: number;
    missingValidMonitoringConfiguration: number;
  };
  monitoringAdherence: {
    patientsExpected: number;
    satisfiedWindows: number;
    missedWindows: number;
    openMonitoringGaps: number;
    patientsWithOpenMonitoringGaps: number;
    patientsWithConsecutiveMissedExpectations: number;
    adherenceRate?: number | null;
  };
  clinicalAlerts: {
    totalActiveAlerts: number;
    newAlerts: number;
    underReview: number;
    patientContacted: number;
    consultationRequired: number;
    escalated: number;
    unassignedActiveAlerts: number;
    overdueActiveAlerts: number;
    monitoringGapWorkItems: number;
    clinicalThresholdAlerts: number;
    alertsAwaitingFirstReview: number;
  };
  responsePerformance: {
    medianTimeToFirstReviewMinutes?: number | null;
    medianTimeToResolutionMinutes?: number | null;
    unresolvedOverdueAlerts: number;
  };
  careTeamWorkload: {
    unassignedAlerts: number;
    openFollowUps: number;
    escalatedItems: number;
  };
};

export type ClinicPatientCohortRow = {
  patientId: UUID;
  patientDisplayName: string;
  programmeId: UUID;
  programmeName: string;
  enrolmentId: UUID;
  enrolmentStatus: ProgrammeEnrolmentStatus;
  baselineStatus?: ProgrammeBaselineStatus | null;
  carePlanStatus?: ProgrammeCarePlanStatus | null;
  leadProviderId?: UUID | null;
  leadProviderName?: string | null;
  assignedCareTeam: JsonValue;
  lastSubmittedGlucoseReadingAt?: DateTimeString | null;
  lastRelevantMonitoringActivityAt?: DateTimeString | null;
  nextExpectedReadingAt?: DateTimeString | null;
  openMonitoringGapCount: number;
  consecutiveMissedExpectations: number;
  activeClinicalAlertCount: number;
  highestActiveAlertSeverity?: string | null;
  unassignedWorkItemCount: number;
  nextScheduledAppointmentAt?: DateTimeString | null;
  administrativeReadinessState: string;
  primaryAttentionReason?: string | null;
  attentionReasons: string[];
  requiresAttention: boolean;
  primaryReadinessBlocker?: string | null;
  readinessBlockers: string[];
};

export type AlertWorkQueue = {
  items: MonitoringAlert[];
  total: number;
  page: number;
  limit: number;
  summary: {
    openCount: number;
    unassignedCount: number;
    overdueCount: number;
    byStatus: string;
    bySeverity: string;
  };
};

export type ExpectedMonitoringWindow = {
  id: UUID;
  patientId: UUID;
  programmeEnrolmentId: UUID;
  carePlanId?: UUID | null;
  monitoringRequirementId: UUID;
  observationType: string;
  observationContext?: string | null;
  windowStart: DateTimeString;
  dueAt: DateTimeString;
  gracePeriodEndsAt: DateTimeString;
  status: MonitoringWindowStatus;
  satisfiedByReadingId?: UUID | null;
  patientTimezone: string;
  requirementSource: string;
  requirementSnapshotJson: string;
};

export type MonitoringGap = {
  id: UUID;
  expectedWindowId: UUID;
  patientId: UUID;
  programmeEnrolmentId: UUID;
  carePlanId?: UUID | null;
  monitoringRequirementId: UUID;
  observationType: string;
  observationContext?: string | null;
  dueAt: DateTimeString;
  gracePeriodEndsAt: DateTimeString;
  detectedAt: DateTimeString;
  status: string;
  linkedAlertId?: UUID | null;
  reminderAttemptCount: number;
  consecutiveMissCount: number;
  resolutionReason?: string | null;
  excuseReason?: string | null;
  provenanceJson: string;
};

export type MonitoringAlert = {
  id: UUID;
  patientId: UUID;
  category: string;
  type: string;
  severity: string;
  sourceEntityType: string;
  sourceEntityId: UUID;
  message?: string | null;
  status: MonitoringAlertStatus;
  programmeEnrolmentId?: UUID | null;
  carePlanId?: UUID | null;
  observationType?: string | null;
  observationValue?: DecimalString | null;
  observationUnit?: string | null;
  observationContext?: string | null;
  queuedAt?: DateTimeString | null;
  currentOwnerUserId?: UUID | null;
  ownerCareTeamRole?: string | null;
  assignedAt?: DateTimeString | null;
  firstReviewedAt?: DateTimeString | null;
  patientContactedAt?: DateTimeString | null;
  dueAt?: DateTimeString | null;
  escalationLevel: number;
  escalatedAt?: DateTimeString | null;
  escalationReason?: string | null;
  resolvedAt?: DateTimeString | null;
  resolvedByUserId?: UUID | null;
  resolutionClassification?: string | null;
  resolutionNote?: string | null;
  acknowledgedAt?: DateTimeString | null;
  acknowledgedByUserId?: UUID | null;
  createdAt: DateTimeString;
};

export type AlertIntervention = {
  id: UUID;
  alertId: UUID;
  actorUserId?: UUID | null;
  actorCareTeamRole?: string | null;
  actionType: string;
  occurredAt: DateTimeString;
  patientContactChannel?: string | null;
  outcome?: string | null;
  clinicalNote?: string | null;
  coordinationNote?: string | null;
  followUpRequired: boolean;
  followUpDueAt?: DateTimeString | null;
  visibility: string;
  createdAt: DateTimeString;
};

export type ProgrammeInvoice = {
  id: UUID;
  programmeId: UUID;
  programmeEnrolmentId: UUID;
  billingAccountId: UUID;
  payer: ProgrammePayer;
  invoiceNumber: string;
  currency: string;
  billingPeriodStart: DateString;
  billingPeriodEnd: DateString;
  issueDate?: DateString | null;
  dueDate?: DateString | null;
  subtotal: DecimalString;
  discountAmount: DecimalString;
  taxAmount: DecimalString;
  total: DecimalString;
  amountPaid: DecimalString;
  balance: DecimalString;
  status: ProgrammeInvoiceStatus;
  paidAt?: DateTimeString | null;
  cancelledAt?: DateTimeString | null;
  cancellationReason?: string | null;
  lineItems: ProgrammeInvoiceLineItem[];
};

export type ProgrammeInvoiceLineItem = {
  id: UUID;
  description: string;
  quantity: DecimalString;
  unitAmount: DecimalString;
  lineTotal: DecimalString;
  servicePeriodStart?: DateString | null;
  servicePeriodEnd?: DateString | null;
  metadataJson: string;
};

export type ProgrammePayer = {
  id: UUID;
  organizationId: UUID;
  payerType: string;
  displayName: string;
  patientId?: UUID | null;
  payerOrganizationId?: UUID | null;
  billingContactName?: string | null;
  billingContactEmail?: string | null;
  mobileMoneyPhone?: string | null;
  currency: string;
  active: boolean;
};

export type ProgrammePrice = {
  id: UUID;
  programmeId: UUID;
  name: string;
  description?: string | null;
  currency: string;
  amount: DecimalString;
  billingModel: string;
  billingInterval?: string | null;
  effectiveStartDate: DateString;
  effectiveEndDate?: DateString | null;
  active: boolean;
  includedServiceSummary?: string | null;
  configurationReference?: string | null;
  versionNumber: number;
  approvedAt?: DateTimeString | null;
  createdAt: DateTimeString;
};

export type ProgrammeBillingAccount = {
  id: UUID;
  programmeEnrolmentId: UUID;
  programmeId: UUID;
  payer: ProgrammePayer;
  programmePrice: ProgrammePrice;
  billingStartDate: DateString;
  billingEndDate?: DateString | null;
  status: string;
  nextBillingDate?: DateString | null;
  lastSuccessfullyPaidPeriodStart?: DateString | null;
  lastSuccessfullyPaidPeriodEnd?: DateString | null;
  gracePeriodEndsAt?: DateTimeString | null;
};

export type ProgrammePaymentIntent = {
  id: UUID;
  programmeInvoiceId?: UUID | null;
  purpose: string;
  amount: DecimalString;
  currency: string;
  method: string;
  status: string;
  expiresAt?: DateTimeString | null;
  confirmedAt?: DateTimeString | null;
};

export type PaymentAttempt = {
  id: UUID;
  gateway: string;
  gatewayReference: string;
  msisdn?: string | null;
  status: string;
  requestedAt: DateTimeString;
  completedAt?: DateTimeString | null;
};

export type ProgrammeInvoicePage = {
  items: ProgrammeInvoice[];
  total: number;
  page: number;
  limit: number;
};

export type ClinicProgrammeBillingSummary = {
  activeBillableEnrolments: number;
  pendingBillingSetup: number;
  invoicesIssued: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  amountsByCurrency: {
    currency: string;
    amountInvoiced: DecimalString;
    amountCollected: DecimalString;
    outstandingBalance: DecimalString;
  }[];
  entitlementsActive: number;
  entitlementsInGrace: number;
  entitlementsCommerciallySuspended: number;
};

export type ProgrammeEntitlement = {
  id: UUID;
  programmeEnrolmentId: UUID;
  billingAccountId: UUID;
  status: ProgrammeEntitlementStatus;
  entitledPeriodStart?: DateString | null;
  entitledPeriodEnd?: DateString | null;
  sourceInvoiceId?: UUID | null;
  sourcePaymentId?: UUID | null;
  gracePeriodEndsAt?: DateTimeString | null;
  suspensionReason?: string | null;
  activatedAt?: DateTimeString | null;
  suspendedAt?: DateTimeString | null;
  restoredAt?: DateTimeString | null;
};

export const CARE_PROGRAMME_FIELDS = gql`
  fragment CareProgrammeFields on CareProgrammeType {
    id
    name
    code
    description
    programmeType
    status
    defaultDurationDays
    defaultMonitoringCadenceDays
    settingsJson
    enrolmentOpen
    startsAt
    endsAt
    activatedAt
    pausedAt
    archivedAt
    createdAt
    updatedAt
    organization {
      id
      name
      type
      status
    }
  }
`;

export const PROGRAMME_ENROLMENT_FIELDS = gql`
  ${CARE_PROGRAMME_FIELDS}
  fragment ProgrammeEnrolmentFields on ProgrammeEnrolmentType {
    id
    programme {
      ...CareProgrammeFields
    }
    patient {
      id
      fullName
      email
      diabetesType
    }
    status
    enrolledAt
    startsAt
    expectedEndsAt
    completedAt
    withdrawnAt
    leadProvider {
      id
      displayName
    }
    monitoringCadenceDays
    monitoringCadenceOverrideDays
    baselineCompleted
    baselineCompletedAt
    baselinePcqResponseId
    carePlanReady
    carePlanReadyAt
    carePlanId
    pauseReason
    completionReason
    withdrawalReason
    careTeamAssignments {
      id
      role
      assignedUserId
      provider {
        id
        displayName
      }
      active
      assignedAt
      endedAt
      createdAt
    }
    createdAt
    updatedAt
  }
`;

export const PROGRAMME_BASELINE_FIELDS = gql`
  fragment ProgrammeBaselineFields on ProgrammeBaselineAssessmentType {
    id
    status
    versionNumber
    isCurrent
    pcqResponseId
    pcqTemplateVersionId
    diabetesHistoryJson
    treatmentContextJson
    measurementContextJson
    patientContextJson
    sourceReferencesJson
    submittedAt
    reviewedAt
    reviewedByProvider {
      id
      displayName
    }
    reviewNote
    createdAt
    updatedAt
  }
`;

export const PROGRAMME_CARE_PLAN_FIELDS = gql`
  fragment ProgrammeCarePlanFields on ProgrammeCarePlanType {
    id
    enrolmentId
    patient {
      id
      fullName
      email
      diabetesType
    }
    provider {
      id
      displayName
    }
    title
    summary
    status
    startsAt
    expectedReviewAt
    endsAt
    goalsJson
    followUpScheduleJson
    laboratoryFollowUpJson
    medicationReviewJson
    patientInstructions
    internalNotes
    revisionReason
    versionNumber
    approvedByProvider {
      id
      displayName
    }
    approvedAt
    supersededById
    createdAt
    updatedAt
  }
`;

export const PROGRAMME_MONITORING_REQUIREMENT_FIELDS = gql`
  fragment ProgrammeMonitoringRequirementFields on ProgrammeMonitoringRequirementType {
    id
    programme {
      id
      name
      status
    }
    enrolmentId
    carePlanId
    observationType
    observationContext
    required
    cadenceType
    intervalDays
    frequencyPerInterval
    applicableDaysJson
    timeOfDay
    startsAt
    endsAt
    reminderConfigJson
    gracePeriodDays
    source
    active
    approvedByProvider {
      id
      displayName
    }
    approvedAt
    createdAt
    updatedAt
  }
`;

export const EXPECTED_MONITORING_WINDOW_FIELDS = gql`
  fragment ExpectedMonitoringWindowFields on ExpectedMonitoringWindowType {
    id
    patientId
    programmeEnrolmentId
    carePlanId
    monitoringRequirementId
    observationType
    observationContext
    windowStart
    dueAt
    gracePeriodEndsAt
    status
    satisfiedByReadingId
    patientTimezone
    requirementSource
    requirementSnapshotJson
  }
`;

export const MONITORING_GAP_FIELDS = gql`
  fragment MonitoringGapFields on MonitoringGapType {
    id
    expectedWindowId
    patientId
    programmeEnrolmentId
    carePlanId
    monitoringRequirementId
    observationType
    observationContext
    dueAt
    gracePeriodEndsAt
    detectedAt
    status
    linkedAlertId
    reminderAttemptCount
    consecutiveMissCount
    resolutionReason
    excuseReason
    provenanceJson
  }
`;

export const MONITORING_ALERT_FIELDS = gql`
  fragment MonitoringAlertFields on MonitoringAlertType {
    id
    patientId
    category
    type
    severity
    sourceEntityType
    sourceEntityId
    message
    status
    programmeEnrolmentId
    carePlanId
    observationType
    observationValue
    observationUnit
    observationContext
    queuedAt
    currentOwnerUserId
    ownerCareTeamRole
    assignedAt
    firstReviewedAt
    patientContactedAt
    dueAt
    escalationLevel
    escalatedAt
    escalationReason
    resolvedAt
    resolvedByUserId
    resolutionClassification
    resolutionNote
    acknowledgedAt
    acknowledgedByUserId
    createdAt
  }
`;

export const PROGRAMME_INVOICE_FIELDS = gql`
  fragment ProgrammeInvoiceFields on ProgrammeInvoiceType {
    id
    programmeId
    programmeEnrolmentId
    billingAccountId
    payer {
      id
      organizationId
      payerType
      displayName
      patientId
      payerOrganizationId
      billingContactName
      billingContactEmail
      mobileMoneyPhone
      currency
      active
    }
    invoiceNumber
    currency
    billingPeriodStart
    billingPeriodEnd
    issueDate
    dueDate
    subtotal
    discountAmount
    taxAmount
    total
    amountPaid
    balance
    status
    paidAt
    cancelledAt
    cancellationReason
    lineItems {
      id
      description
      quantity
      unitAmount
      lineTotal
      servicePeriodStart
      servicePeriodEnd
      metadataJson
    }
  }
`;

export const PROGRAMME_PRICE_FIELDS = gql`
  fragment ProgrammePriceFields on ProgrammePriceType {
    id
    programmeId
    name
    description
    currency
    amount
    billingModel
    billingInterval
    effectiveStartDate
    effectiveEndDate
    active
    includedServiceSummary
    configurationReference
    versionNumber
    approvedAt
    createdAt
  }
`;

export const PROGRAMME_BILLING_ACCOUNT_FIELDS = gql`
  ${PROGRAMME_PRICE_FIELDS}
  fragment ProgrammeBillingAccountFields on ProgrammeBillingAccountType {
    id
    programmeEnrolmentId
    programmeId
    payer {
      id
      organizationId
      payerType
      displayName
      patientId
      payerOrganizationId
      billingContactName
      billingContactEmail
      mobileMoneyPhone
      currency
      active
    }
    programmePrice {
      ...ProgrammePriceFields
    }
    billingStartDate
    billingEndDate
    status
    nextBillingDate
    lastSuccessfullyPaidPeriodStart
    lastSuccessfullyPaidPeriodEnd
    gracePeriodEndsAt
  }
`;

export const PROGRAMME_ENTITLEMENT_FIELDS = gql`
  fragment ProgrammeEntitlementFields on ProgrammeEntitlementType {
    id
    programmeEnrolmentId
    billingAccountId
    status
    entitledPeriodStart
    entitledPeriodEnd
    sourceInvoiceId
    sourcePaymentId
    gracePeriodEndsAt
    suspensionReason
    activatedAt
    suspendedAt
    restoredAt
  }
`;

export const CLINIC_CARE_PROGRAMMES_QUERY = gql`
  ${CARE_PROGRAMME_FIELDS}
  query ClinicCareProgrammes($organizationId: UUID, $status: String) {
    clinicCareProgrammes(organizationId: $organizationId, status: $status) {
      ...CareProgrammeFields
    }
  }
`;

export const CARE_PROGRAMME_QUERY = gql`
  ${CARE_PROGRAMME_FIELDS}
  query CareProgramme($id: UUID!) {
    careProgramme(id: $id) {
      ...CareProgrammeFields
    }
  }
`;

export const CLINIC_PROGRAMME_ENROLMENTS_QUERY = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  query ClinicProgrammeEnrolments(
    $organizationId: UUID
    $status: String
    $programmeId: UUID
    $patientId: UUID
    $providerId: UUID
  ) {
    clinicProgrammeEnrolments(
      organizationId: $organizationId
      status: $status
      programmeId: $programmeId
      patientId: $patientId
      providerId: $providerId
    ) {
      ...ProgrammeEnrolmentFields
    }
  }
`;

export const PATIENT_PROGRAMME_ENROLMENTS_QUERY = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  query PatientProgrammeEnrolments($patientId: UUID!, $status: String) {
    clinicProgrammeEnrolments(patientId: $patientId, status: $status) {
      ...ProgrammeEnrolmentFields
    }
  }
`;

export const PROGRAMME_ENROLMENT_QUERY = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  query ProgrammeEnrolment($id: UUID!) {
    programmeEnrolment(id: $id) {
      ...ProgrammeEnrolmentFields
    }
  }
`;

export const MY_CURRENT_PROGRAMME_ENROLMENT_QUERY = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  query MyCurrentProgrammeEnrolment {
    myCurrentProgrammeEnrolment {
      ...ProgrammeEnrolmentFields
    }
  }
`;

export const PROGRAMME_ENROLMENT_READINESS_QUERY = gql`
  query ProgrammeEnrolmentReadiness($enrolmentId: UUID!) {
    programmeEnrolmentReadiness(enrolmentId: $enrolmentId) {
      ready
      blockers
      baselineApproved
      leadProviderAssigned
      carePlanActive
      hasMonitoringRequirements
      programmeActive
      baselineId
      carePlanId
    }
  }
`;

export const PROGRAMME_CURRENT_BASELINE_QUERY = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  query ProgrammeCurrentBaseline($enrolmentId: UUID!) {
    programmeCurrentBaseline(enrolmentId: $enrolmentId) {
      ...ProgrammeBaselineFields
    }
  }
`;

export const PROGRAMME_CURRENT_CARE_PLAN_QUERY = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  query ProgrammeCurrentCarePlan($enrolmentId: UUID!) {
    programmeCurrentCarePlan(enrolmentId: $enrolmentId) {
      ...ProgrammeCarePlanFields
    }
  }
`;

export const EFFECTIVE_MONITORING_REQUIREMENTS_QUERY = gql`
  ${PROGRAMME_MONITORING_REQUIREMENT_FIELDS}
  query EffectiveMonitoringRequirements($enrolmentId: UUID!) {
    effectiveMonitoringRequirements(enrolmentId: $enrolmentId) {
      ...ProgrammeMonitoringRequirementFields
    }
  }
`;

export const MY_NEXT_EXPECTED_READINGS_QUERY = gql`
  ${EXPECTED_MONITORING_WINDOW_FIELDS}
  query MyNextExpectedReadings($limit: Int) {
    myNextExpectedReadings(limit: $limit) {
      ...ExpectedMonitoringWindowFields
    }
  }
`;

export const MY_MONITORING_SCHEDULE_QUERY = gql`
  query MyMonitoringSchedule {
    myMonitoringSchedule {
      enrolmentId
      programmeName
      requirements {
        id
        observationType
        observationContext
        cadenceType
        intervalDays
        applicableDaysJson
        timeOfDay
        gracePeriodDays
        source
      }
    }
  }
`;

export const EXPECTED_MONITORING_WINDOWS_QUERY = gql`
  ${EXPECTED_MONITORING_WINDOW_FIELDS}
  query ExpectedMonitoringWindows($enrolmentId: UUID, $status: String, $page: Int, $limit: Int) {
    expectedMonitoringWindows(enrolmentId: $enrolmentId, status: $status, page: $page, limit: $limit) {
      items {
        ...ExpectedMonitoringWindowFields
      }
      total
      page
      limit
    }
  }
`;

export const OPEN_MONITORING_GAPS_QUERY = gql`
  ${MONITORING_GAP_FIELDS}
  query OpenMonitoringGaps($enrolmentId: UUID, $page: Int, $limit: Int) {
    openMonitoringGaps(enrolmentId: $enrolmentId, page: $page, limit: $limit) {
      items {
        ...MonitoringGapFields
      }
      total
      page
      limit
    }
  }
`;

export const PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY = gql`
  query PatientMonitoringAdherenceSummary($patientId: UUID, $enrolmentId: UUID) {
    patientMonitoringAdherenceSummary(patientId: $patientId, enrolmentId: $enrolmentId) {
      counts
      openGapCount
      consecutiveMissedCount
    }
  }
`;

export const MONITORING_GAP_HISTORY_QUERY = gql`
  ${MONITORING_GAP_FIELDS}
  query MonitoringGapHistory($enrolmentId: UUID!, $page: Int, $limit: Int) {
    monitoringGapHistory(enrolmentId: $enrolmentId, page: $page, limit: $limit) {
      items {
        ...MonitoringGapFields
      }
      total
      page
      limit
    }
  }
`;

export const CLINIC_ALERT_WORK_QUEUE_QUERY = gql`
  ${MONITORING_ALERT_FIELDS}
  query ClinicAlertWorkQueue(
    $status: String
    $category: String
    $severity: String
    $patientId: UUID
    $programmeEnrolmentId: UUID
    $ownerUserId: UUID
    $unassigned: Boolean
    $overdue: Boolean
    $escalated: Boolean
    $firstReviewed: Boolean
    $followUpRequired: Boolean
    $page: Int
    $limit: Int
  ) {
    clinicAlertWorkQueue(
      status: $status
      category: $category
      severity: $severity
      patientId: $patientId
      programmeEnrolmentId: $programmeEnrolmentId
      ownerUserId: $ownerUserId
      unassigned: $unassigned
      overdue: $overdue
      escalated: $escalated
      firstReviewed: $firstReviewed
      followUpRequired: $followUpRequired
      page: $page
      limit: $limit
    ) {
      items {
        ...MonitoringAlertFields
      }
      total
      page
      limit
      summary {
        openCount
        unassignedCount
        overdueCount
        byStatus
        bySeverity
      }
    }
  }
`;

export const ALERT_DETAIL_QUERY = gql`
  ${MONITORING_ALERT_FIELDS}
  query AlertDetail($alertId: UUID!) {
    alertDetail(alertId: $alertId) {
      ...MonitoringAlertFields
    }
  }
`;

export const ALERT_INTERVENTIONS_QUERY = gql`
  query AlertInterventions($alertId: UUID!) {
    alertInterventions(alertId: $alertId) {
      id
      alertId
      actorUserId
      actorCareTeamRole
      actionType
      occurredAt
      patientContactChannel
      outcome
      clinicalNote
      coordinationNote
      followUpRequired
      followUpDueAt
      visibility
      createdAt
    }
  }
`;

export const ALERT_OWNERSHIP_HISTORY_QUERY = gql`
  query AlertOwnershipHistory($alertId: UUID!) {
    alertOwnershipHistory(alertId: $alertId) {
      id
      alertId
      previousOwnerUserId
      newOwnerUserId
      actorUserId
      careTeamRole
      reason
      changedAt
    }
  }
`;

export const CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY = gql`
  query ClinicProgrammeDashboardOverview(
    $organizationId: UUID
    $programmeId: UUID
    $startDate: Date
    $endDate: Date
    $timezoneName: String
  ) {
    clinicProgrammeDashboardOverview(
      organizationId: $organizationId
      programmeId: $programmeId
      startDate: $startDate
      endDate: $endDate
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      programmePopulation {
        totalEnrolments
        invited
        pendingBaseline
        active
        paused
        completed
        withdrawn
        newEnrolments
        retentionCount
        retentionRate
        retentionDefinition
      }
      readiness {
        readyForActivation
        blockedCount
        awaitingBaselineSubmission
        awaitingBaselineReview
        missingLeadProvider
        missingActiveCarePlan
        missingValidMonitoringConfiguration
        pausedOrInactiveProgrammeBlockers
        primaryBlockerBreakdown
        details
      }
      monitoringAdherence {
        patientsExpected
        patientsWithSatisfiedExpectation
        totalExpectedWindows
        satisfiedWindows
        missedWindows
        excusedWindows
        cancelledOrSupersededWindows
        openMonitoringGaps
        patientsWithOpenMonitoringGaps
        patientsWithConsecutiveMissedExpectations
        adherenceRate
        adherenceDenominator
        excusedTreatment
      }
      clinicalAlerts {
        totalActiveAlerts
        newAlerts
        underReview
        patientContacted
        consultationRequired
        escalated
        resolvedDuringPeriod
        dismissedDuringPeriod
        unassignedActiveAlerts
        overdueActiveAlerts
        alertsWithoutConfiguredTarget
        monitoringGapWorkItems
        clinicalThresholdAlerts
        followUpAdminWorkItems
        alertsAwaitingFirstReview
      }
      responsePerformance {
        medianTimeToFirstReviewMinutes
        averageTimeToFirstReviewMinutes
        medianTimeToResolutionMinutes
        averageTimeToResolutionMinutes
        reviewedWithinDueTimePercent
        resolvedWithinDueTimePercent
        alertsWithoutReviewTarget
        alertsWithoutResolutionTarget
        unresolvedOverdueAlerts
        escalationCount
        reopenedAlertCount
      }
      careTeamWorkload {
        activeAlertsByOwner
        unassignedAlerts
        alertsClaimedDuringPeriod
        alertsResolvedDuringPeriod
        openFollowUps
        escalatedItems
        patientsAssignedByMember
      }
      metricDefinitionKeys
    }
  }
`;

export const PROGRAMME_ADHERENCE_REPORTING_SUMMARY_QUERY = gql`
  query ProgrammeAdherenceReportingSummary(
    $programmeId: UUID!
    $startDate: Date
    $endDate: Date
    $timezoneName: String
  ) {
    programmeAdherenceReportingSummary(
      programmeId: $programmeId
      startDate: $startDate
      endDate: $endDate
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      monitoringAdherence {
        patientsExpected
        patientsWithSatisfiedExpectation
        totalExpectedWindows
        satisfiedWindows
        missedWindows
        excusedWindows
        cancelledOrSupersededWindows
        openMonitoringGaps
        patientsWithOpenMonitoringGaps
        patientsWithConsecutiveMissedExpectations
        adherenceRate
        adherenceDenominator
        excusedTreatment
      }
    }
  }
`;

export const CLINIC_WORK_QUEUE_REPORTING_SUMMARY_QUERY = gql`
  query ClinicWorkQueueReportingSummary(
    $organizationId: UUID
    $programmeId: UUID
    $startDate: Date
    $endDate: Date
    $timezoneName: String
  ) {
    clinicWorkQueueReportingSummary(
      organizationId: $organizationId
      programmeId: $programmeId
      startDate: $startDate
      endDate: $endDate
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      clinicalAlerts {
        totalActiveAlerts
        newAlerts
        underReview
        patientContacted
        consultationRequired
        escalated
        resolvedDuringPeriod
        dismissedDuringPeriod
        unassignedActiveAlerts
        overdueActiveAlerts
        alertsWithoutConfiguredTarget
        monitoringGapWorkItems
        clinicalThresholdAlerts
        followUpAdminWorkItems
        alertsAwaitingFirstReview
      }
      careTeamWorkload {
        activeAlertsByOwner
        unassignedAlerts
        alertsClaimedDuringPeriod
        alertsResolvedDuringPeriod
        openFollowUps
        escalatedItems
        patientsAssignedByMember
      }
    }
  }
`;

export const CLINIC_RESPONSE_PERFORMANCE_SUMMARY_QUERY = gql`
  query ClinicResponsePerformanceSummary(
    $organizationId: UUID
    $programmeId: UUID
    $startDate: Date
    $endDate: Date
    $timezoneName: String
  ) {
    clinicResponsePerformanceSummary(
      organizationId: $organizationId
      programmeId: $programmeId
      startDate: $startDate
      endDate: $endDate
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      responsePerformance {
        medianTimeToFirstReviewMinutes
        averageTimeToFirstReviewMinutes
        medianTimeToResolutionMinutes
        averageTimeToResolutionMinutes
        reviewedWithinDueTimePercent
        resolvedWithinDueTimePercent
        alertsWithoutReviewTarget
        alertsWithoutResolutionTarget
        unresolvedOverdueAlerts
        escalationCount
        reopenedAlertCount
      }
    }
  }
`;

export const OPERATIONAL_TREND_SERIES_QUERY = gql`
  query OperationalTrendSeries(
    $organizationId: UUID
    $programmeId: UUID
    $startDate: Date
    $endDate: Date
    $granularity: String
    $timezoneName: String
  ) {
    operationalTrendSeries(
      organizationId: $organizationId
      programmeId: $programmeId
      startDate: $startDate
      endDate: $endDate
      granularity: $granularity
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      granularity
      buckets {
        label
        bucketStart
        bucketEnd
        metrics
      }
    }
  }
`;

export const PROGRAMME_COMPARISON_QUERY = gql`
  query ProgrammeComparison($organizationId: UUID, $startDate: Date, $endDate: Date, $timezoneName: String) {
    programmeComparison(
      organizationId: $organizationId
      startDate: $startDate
      endDate: $endDate
      timezoneName: $timezoneName
    ) {
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
      items {
        programmeId
        programmeName
        activeEnrolments
        readinessBlockers
        adherenceRate
        patientsWithMonitoringGaps
        activeClinicalAlerts
        unassignedWork
        medianFirstReviewMinutes
        medianResolutionMinutes
        completedEnrolments
        withdrawnEnrolments
      }
    }
  }
`;

export const CLINIC_PATIENT_COHORT_QUERY = gql`
  query ClinicPatientCohort(
    $organizationId: UUID
    $programmeId: UUID
    $enrolmentStatus: String
    $baselineStatus: String
    $carePlanStatus: String
    $leadProviderId: UUID
    $careTeamMemberUserId: UUID
    $hasActiveClinicalAlert: Boolean
    $hasMonitoringGap: Boolean
    $consecutiveMissedMonitoring: Boolean
    $readyForActivation: Boolean
    $blockedEnrolment: Boolean
    $requiresAttention: Boolean
    $noRecentMonitoringActivity: Boolean
    $page: Int
    $limit: Int
    $orderBy: String
  ) {
    clinicPatientCohort(
      organizationId: $organizationId
      programmeId: $programmeId
      enrolmentStatus: $enrolmentStatus
      baselineStatus: $baselineStatus
      carePlanStatus: $carePlanStatus
      leadProviderId: $leadProviderId
      careTeamMemberUserId: $careTeamMemberUserId
      hasActiveClinicalAlert: $hasActiveClinicalAlert
      hasMonitoringGap: $hasMonitoringGap
      consecutiveMissedMonitoring: $consecutiveMissedMonitoring
      readyForActivation: $readyForActivation
      blockedEnrolment: $blockedEnrolment
      requiresAttention: $requiresAttention
      noRecentMonitoringActivity: $noRecentMonitoringActivity
      page: $page
      limit: $limit
      orderBy: $orderBy
    ) {
      items {
        patientId
        patientDisplayName
        programmeId
        programmeName
        enrolmentId
        enrolmentStatus
        baselineStatus
        carePlanStatus
        leadProviderId
        leadProviderName
        assignedCareTeam
        lastSubmittedGlucoseReadingAt
        lastRelevantMonitoringActivityAt
        nextExpectedReadingAt
        openMonitoringGapCount
        consecutiveMissedExpectations
        activeClinicalAlertCount
        highestActiveAlertSeverity
        unassignedWorkItemCount
        nextScheduledAppointmentAt
        administrativeReadinessState
        primaryAttentionReason
        attentionReasons
        requiresAttention
        primaryReadinessBlocker
        readinessBlockers
      }
      total
      page
      limit
      dateRange {
        start
        end
        startDate
        endDate
        timezone
      }
    }
  }
`;

export const PROGRAMME_INVOICES_QUERY = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  query ProgrammeInvoices(
    $programmeId: UUID
    $enrolmentId: UUID
    $payerId: UUID
    $status: String
    $page: Int
    $limit: Int
  ) {
    programmeInvoices(
      programmeId: $programmeId
      enrolmentId: $enrolmentId
      payerId: $payerId
      status: $status
      page: $page
      limit: $limit
    ) {
      items {
        ...ProgrammeInvoiceFields
      }
      total
      page
      limit
    }
  }
`;

export const PROGRAMME_INVOICE_QUERY = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  query ProgrammeInvoice($invoiceId: UUID!) {
    programmeInvoice(invoiceId: $invoiceId) {
      ...ProgrammeInvoiceFields
    }
  }
`;

export const PROGRAMME_PAYMENT_INTENT_QUERY = gql`
  query ProgrammePaymentIntent($paymentId: UUID!) {
    programmePaymentIntent(paymentId: $paymentId) {
      id
      programmeInvoiceId
      purpose
      amount
      currency
      method
      status
      expiresAt
      confirmedAt
    }
  }
`;

export const PROGRAMME_PRICES_QUERY = gql`
  ${PROGRAMME_PRICE_FIELDS}
  query ProgrammePrices($programmeId: UUID, $active: Boolean) {
    programmePrices(programmeId: $programmeId, active: $active) {
      ...ProgrammePriceFields
    }
  }
`;

export const ENROLMENT_BILLING_STATUS_QUERY = gql`
  ${PROGRAMME_BILLING_ACCOUNT_FIELDS}
  ${PROGRAMME_ENTITLEMENT_FIELDS}
  query EnrolmentBillingStatus($enrolmentId: UUID!) {
    enrolmentBillingStatus(enrolmentId: $enrolmentId) {
      enrolmentId
      billingAccount {
        ...ProgrammeBillingAccountFields
      }
      entitlement {
        ...ProgrammeEntitlementFields
      }
    }
  }
`;

export const CLINIC_PROGRAMME_BILLING_SUMMARY_QUERY = gql`
  query ClinicProgrammeBillingSummary($programmeId: UUID, $startDate: Date, $endDate: Date) {
    clinicProgrammeBillingSummary(programmeId: $programmeId, startDate: $startDate, endDate: $endDate) {
      activeBillableEnrolments
      pendingBillingSetup
      invoicesIssued
      invoicesPaid
      invoicesOverdue
      amountsByCurrency {
        currency
        amountInvoiced
        amountCollected
        outstandingBalance
      }
      entitlementsActive
      entitlementsInGrace
      entitlementsCommerciallySuspended
    }
  }
`;

export const MY_PROGRAMME_INVOICES_QUERY = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  query MyProgrammeInvoices($page: Int, $limit: Int) {
    myProgrammeInvoices(page: $page, limit: $limit) {
      items {
        ...ProgrammeInvoiceFields
      }
      total
      page
      limit
    }
  }
`;

export const MY_PROGRAMME_ENTITLEMENTS_QUERY = gql`
  ${PROGRAMME_ENTITLEMENT_FIELDS}
  query MyProgrammeEntitlements {
    myProgrammeEntitlements {
      ...ProgrammeEntitlementFields
    }
  }
`;

export const CREATE_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation CreateCareProgramme($data: CareProgrammeInput!) {
    createCareProgramme(data: $data) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const UPDATE_DRAFT_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation UpdateDraftCareProgramme($programmeId: UUID!, $data: CareProgrammeInput!) {
    updateDraftCareProgramme(programmeId: $programmeId, data: $data) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const ACTIVATE_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation ActivateCareProgramme($programmeId: UUID!) {
    activateCareProgramme(programmeId: $programmeId) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const PAUSE_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation PauseCareProgramme($programmeId: UUID!, $reason: String) {
    pauseCareProgramme(programmeId: $programmeId, reason: $reason) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const RESUME_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation ResumeCareProgramme($programmeId: UUID!) {
    resumeCareProgramme(programmeId: $programmeId) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const ARCHIVE_CARE_PROGRAMME_MUTATION = gql`
  ${CARE_PROGRAMME_FIELDS}
  mutation ArchiveCareProgramme($programmeId: UUID!, $reason: String) {
    archiveCareProgramme(programmeId: $programmeId, reason: $reason) {
      programme {
        ...CareProgrammeFields
      }
    }
  }
`;

export const ACTIVATE_PROGRAMME_ENROLMENT_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation ActivateProgrammeEnrolment($enrolmentId: UUID!) {
    activateProgrammeEnrolment(enrolmentId: $enrolmentId) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const PAUSE_PROGRAMME_ENROLMENT_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation PauseProgrammeEnrolment($enrolmentId: UUID!, $reason: String) {
    pauseProgrammeEnrolment(enrolmentId: $enrolmentId, reason: $reason) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const RESUME_PROGRAMME_ENROLMENT_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation ResumeProgrammeEnrolment($enrolmentId: UUID!) {
    resumeProgrammeEnrolment(enrolmentId: $enrolmentId) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const WITHDRAW_PROGRAMME_ENROLMENT_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation WithdrawProgrammeEnrolment($enrolmentId: UUID!, $reason: String) {
    withdrawProgrammeEnrolment(enrolmentId: $enrolmentId, reason: $reason) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const ENROL_PATIENT_IN_PROGRAMME_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation EnrolPatientInProgramme(
    $programmeId: UUID!
    $patientId: UUID!
    $data: ProgrammeEnrolmentInput
    $careTeam: [CareTeamAssignmentInput]
  ) {
    enrolPatientInProgramme(
      programmeId: $programmeId
      patientId: $patientId
      data: $data
      careTeam: $careTeam
    ) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const INVITE_PATIENT_TO_PROGRAMME_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation InvitePatientToProgramme(
    $programmeId: UUID!
    $email: String!
    $fullName: String
    $phone: String
    $note: String
    $data: ProgrammeEnrolmentInput
    $careTeam: [CareTeamAssignmentInput]
  ) {
    invitePatientToProgramme(
      programmeId: $programmeId
      email: $email
      fullName: $fullName
      phone: $phone
      note: $note
      data: $data
      careTeam: $careTeam
    ) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
      setupToken
    }
  }
`;

export const ASSIGN_PROGRAMME_CARE_TEAM_MUTATION = gql`
  ${PROGRAMME_ENROLMENT_FIELDS}
  mutation AssignProgrammeCareTeam($enrolmentId: UUID!, $assignments: [CareTeamAssignmentInput]!) {
    assignProgrammeCareTeam(enrolmentId: $enrolmentId, assignments: $assignments) {
      enrolment {
        ...ProgrammeEnrolmentFields
      }
    }
  }
`;

export const INITIALIZE_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation InitializeProgrammeBaseline($enrolmentId: UUID!, $pcqResponseId: UUID, $data: ProgrammeBaselineInput) {
    initializeProgrammeBaseline(enrolmentId: $enrolmentId, pcqResponseId: $pcqResponseId, data: $data) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const UPDATE_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation UpdateProgrammeBaseline($baselineId: UUID!, $data: ProgrammeBaselineInput!) {
    updateProgrammeBaseline(baselineId: $baselineId, data: $data) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const SUBMIT_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation SubmitProgrammeBaseline($baselineId: UUID!) {
    submitProgrammeBaseline(baselineId: $baselineId) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const REVIEW_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation ReviewProgrammeBaseline($baselineId: UUID!, $note: String) {
    reviewProgrammeBaseline(baselineId: $baselineId, note: $note) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const APPROVE_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation ApproveProgrammeBaseline($baselineId: UUID!, $note: String) {
    approveProgrammeBaseline(baselineId: $baselineId, note: $note) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const RETURN_PROGRAMME_BASELINE_MUTATION = gql`
  ${PROGRAMME_BASELINE_FIELDS}
  mutation ReturnProgrammeBaseline($baselineId: UUID!, $note: String) {
    returnProgrammeBaseline(baselineId: $baselineId, note: $note) {
      baseline {
        ...ProgrammeBaselineFields
      }
    }
  }
`;

export const CREATE_PROGRAMME_CARE_PLAN_MUTATION = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  mutation CreateProgrammeCarePlan($enrolmentId: UUID!, $data: ProgrammeCarePlanInput!) {
    createProgrammeCarePlan(enrolmentId: $enrolmentId, data: $data) {
      carePlan {
        ...ProgrammeCarePlanFields
      }
    }
  }
`;

export const UPDATE_DRAFT_PROGRAMME_CARE_PLAN_MUTATION = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  mutation UpdateDraftProgrammeCarePlan($carePlanId: UUID!, $data: ProgrammeCarePlanInput!) {
    updateDraftProgrammeCarePlan(carePlanId: $carePlanId, data: $data) {
      carePlan {
        ...ProgrammeCarePlanFields
      }
    }
  }
`;

export const SUBMIT_PROGRAMME_CARE_PLAN_MUTATION = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  mutation SubmitProgrammeCarePlan($carePlanId: UUID!) {
    submitProgrammeCarePlan(carePlanId: $carePlanId) {
      carePlan {
        ...ProgrammeCarePlanFields
      }
    }
  }
`;

export const APPROVE_ACTIVATE_PROGRAMME_CARE_PLAN_MUTATION = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  mutation ApproveActivateProgrammeCarePlan($carePlanId: UUID!) {
    approveActivateProgrammeCarePlan(carePlanId: $carePlanId) {
      carePlan {
        ...ProgrammeCarePlanFields
      }
    }
  }
`;

export const CREATE_PROGRAMME_CARE_PLAN_REVISION_MUTATION = gql`
  ${PROGRAMME_CARE_PLAN_FIELDS}
  mutation CreateProgrammeCarePlanRevision($carePlanId: UUID!, $data: ProgrammeCarePlanInput) {
    createProgrammeCarePlanRevision(carePlanId: $carePlanId, data: $data) {
      carePlan {
        ...ProgrammeCarePlanFields
      }
    }
  }
`;

export const ADD_PROGRAMME_DEFAULT_MONITORING_REQUIREMENT_MUTATION = gql`
  ${PROGRAMME_MONITORING_REQUIREMENT_FIELDS}
  mutation AddProgrammeDefaultMonitoringRequirement($programmeId: UUID!, $data: ProgrammeMonitoringRequirementInput!) {
    addProgrammeDefaultMonitoringRequirement(programmeId: $programmeId, data: $data) {
      requirement {
        ...ProgrammeMonitoringRequirementFields
      }
    }
  }
`;

export const ADD_PATIENT_MONITORING_REQUIREMENT_MUTATION = gql`
  ${PROGRAMME_MONITORING_REQUIREMENT_FIELDS}
  mutation AddPatientMonitoringRequirement(
    $enrolmentId: UUID!
    $data: ProgrammeMonitoringRequirementInput!
    $carePlanId: UUID
  ) {
    addPatientMonitoringRequirement(enrolmentId: $enrolmentId, data: $data, carePlanId: $carePlanId) {
      requirement {
        ...ProgrammeMonitoringRequirementFields
      }
    }
  }
`;

export const UPDATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION = gql`
  ${PROGRAMME_MONITORING_REQUIREMENT_FIELDS}
  mutation UpdateProgrammeMonitoringRequirement($requirementId: UUID!, $data: ProgrammeMonitoringRequirementInput!) {
    updateProgrammeMonitoringRequirement(requirementId: $requirementId, data: $data) {
      requirement {
        ...ProgrammeMonitoringRequirementFields
      }
    }
  }
`;

export const DEACTIVATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION = gql`
  ${PROGRAMME_MONITORING_REQUIREMENT_FIELDS}
  mutation DeactivateProgrammeMonitoringRequirement($requirementId: UUID!) {
    deactivateProgrammeMonitoringRequirement(requirementId: $requirementId) {
      requirement {
        ...ProgrammeMonitoringRequirementFields
      }
    }
  }
`;

export const CLAIM_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation ClaimAlert($alertId: UUID!) {
    claimAlert(alertId: $alertId) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const ASSIGN_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation AssignAlert($alertId: UUID!, $ownerUserId: UUID!, $reason: String) {
    assignAlert(alertId: $alertId, ownerUserId: $ownerUserId, reason: $reason) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const REASSIGN_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation ReassignAlert($alertId: UUID!, $ownerUserId: UUID!, $reason: String) {
    reassignAlert(alertId: $alertId, ownerUserId: $ownerUserId, reason: $reason) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const RETURN_ALERT_TO_QUEUE_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation ReturnAlertToQueue($alertId: UUID!, $reason: String) {
    returnAlertToQueue(alertId: $alertId, reason: $reason) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const BEGIN_ALERT_REVIEW_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation BeginAlertReview($alertId: UUID!) {
    beginAlertReview(alertId: $alertId) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const RECORD_ALERT_INTERVENTION_MUTATION = gql`
  mutation RecordAlertIntervention($alertId: UUID!, $data: AlertInterventionInput!) {
    recordAlertIntervention(alertId: $alertId, data: $data) {
      intervention {
        id
        alertId
        actorUserId
        actorCareTeamRole
        actionType
        occurredAt
        patientContactChannel
        outcome
        clinicalNote
        coordinationNote
        followUpRequired
        followUpDueAt
        visibility
        createdAt
      }
    }
  }
`;

export const RECORD_PATIENT_CONTACT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation RecordPatientContact($alertId: UUID!, $data: AlertInterventionInput) {
    recordPatientContact(alertId: $alertId, data: $data) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const RESOLVE_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation ResolveAlert($alertId: UUID!, $classification: String!, $note: String!) {
    resolveAlert(alertId: $alertId, classification: $classification, note: $note) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const ESCALATE_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation EscalateAlert($alertId: UUID!, $reason: String!, $toUserId: UUID, $toRole: String, $policyRef: String) {
    escalateAlert(alertId: $alertId, reason: $reason, toUserId: $toUserId, toRole: $toRole, policyRef: $policyRef) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const DISMISS_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation DismissAlert($alertId: UUID!, $reason: String!, $note: String) {
    dismissAlert(alertId: $alertId, reason: $reason, note: $note) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const REOPEN_ALERT_MUTATION = gql`
  ${MONITORING_ALERT_FIELDS}
  mutation ReopenAlert($alertId: UUID!, $reason: String!) {
    reopenAlert(alertId: $alertId, reason: $reason) {
      alert {
        ...MonitoringAlertFields
      }
    }
  }
`;

export const EXCUSE_MONITORING_GAP_MUTATION = gql`
  ${MONITORING_GAP_FIELDS}
  mutation ExcuseMonitoringGap($gapId: UUID!, $reason: String!) {
    excuseMonitoringGap(gapId: $gapId, reason: $reason) {
      gap {
        ...MonitoringGapFields
      }
    }
  }
`;

export const RESOLVE_MONITORING_GAP_MUTATION = gql`
  ${MONITORING_GAP_FIELDS}
  mutation ResolveMonitoringGap($gapId: UUID!, $reason: String!) {
    resolveMonitoringGap(gapId: $gapId, reason: $reason) {
      gap {
        ...MonitoringGapFields
      }
    }
  }
`;

export const RECALCULATE_EXPECTED_WINDOW_MUTATION = gql`
  ${EXPECTED_MONITORING_WINDOW_FIELDS}
  mutation RecalculateExpectedWindow($expectedWindowId: UUID!) {
    recalculateExpectedWindow(expectedWindowId: $expectedWindowId) {
      expectedWindow {
        ...ExpectedMonitoringWindowFields
      }
    }
  }
`;

export const CANCEL_EXPECTED_WINDOW_MUTATION = gql`
  ${EXPECTED_MONITORING_WINDOW_FIELDS}
  mutation CancelExpectedWindow($expectedWindowId: UUID!, $reason: String!) {
    cancelExpectedWindow(expectedWindowId: $expectedWindowId, reason: $reason) {
      expectedWindow {
        ...ExpectedMonitoringWindowFields
      }
    }
  }
`;

export const GENERATE_PROGRAMME_INVOICE_MUTATION = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  mutation GenerateProgrammeInvoice(
    $enrolmentId: UUID!
    $periodStart: Date
    $periodEnd: Date
    $issue: Boolean
  ) {
    generateProgrammeInvoice(
      enrolmentId: $enrolmentId
      periodStart: $periodStart
      periodEnd: $periodEnd
      issue: $issue
    ) {
      invoice {
        ...ProgrammeInvoiceFields
      }
    }
  }
`;

export const ISSUE_PROGRAMME_INVOICE_MUTATION = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  mutation IssueProgrammeInvoice($invoiceId: UUID!) {
    issueProgrammeInvoice(invoiceId: $invoiceId) {
      invoice {
        ...ProgrammeInvoiceFields
      }
    }
  }
`;

export const CANCEL_PROGRAMME_INVOICE_MUTATION = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  mutation CancelProgrammeInvoice($invoiceId: UUID!, $reason: String!) {
    cancelProgrammeInvoice(invoiceId: $invoiceId, reason: $reason) {
      invoice {
        ...ProgrammeInvoiceFields
      }
    }
  }
`;

export const VOID_PROGRAMME_INVOICE_MUTATION = gql`
  ${PROGRAMME_INVOICE_FIELDS}
  mutation VoidProgrammeInvoice($invoiceId: UUID!, $reason: String!) {
    voidProgrammeInvoice(invoiceId: $invoiceId, reason: $reason) {
      invoice {
        ...ProgrammeInvoiceFields
      }
    }
  }
`;

export const CREATE_PROGRAMME_PRICE_MUTATION = gql`
  ${PROGRAMME_PRICE_FIELDS}
  mutation CreateProgrammePrice($programmeId: UUID!, $data: ProgrammePriceInput!) {
    createProgrammePrice(programmeId: $programmeId, data: $data) {
      price {
        ...ProgrammePriceFields
      }
    }
  }
`;

export const UPDATE_PROGRAMME_PRICE_MUTATION = gql`
  ${PROGRAMME_PRICE_FIELDS}
  mutation UpdateProgrammePrice($priceId: UUID!, $data: ProgrammePriceUpdateInput!) {
    updateProgrammePrice(priceId: $priceId, data: $data) {
      price {
        ...ProgrammePriceFields
      }
    }
  }
`;

export const DEACTIVATE_PROGRAMME_PRICE_MUTATION = gql`
  ${PROGRAMME_PRICE_FIELDS}
  mutation DeactivateProgrammePrice($priceId: UUID!) {
    deactivateProgrammePrice(priceId: $priceId) {
      price {
        ...ProgrammePriceFields
      }
    }
  }
`;

export const CREATE_PROGRAMME_PAYER_MUTATION = gql`
  mutation CreateProgrammePayer($data: ProgrammePayerInput!) {
    createProgrammePayer(data: $data) {
      payer {
        id
        organizationId
        payerType
        displayName
        patientId
        payerOrganizationId
        billingContactName
        billingContactEmail
        mobileMoneyPhone
        currency
        active
      }
    }
  }
`;

export const ASSIGN_PROGRAMME_PAYER_MUTATION = gql`
  ${PROGRAMME_BILLING_ACCOUNT_FIELDS}
  mutation AssignProgrammePayer(
    $enrolmentId: UUID!
    $payerId: UUID!
    $priceId: UUID!
    $data: ProgrammeBillingAccountInput
  ) {
    assignProgrammePayer(enrolmentId: $enrolmentId, payerId: $payerId, priceId: $priceId, data: $data) {
      billingAccount {
        ...ProgrammeBillingAccountFields
      }
    }
  }
`;

export const INITIATE_PROGRAMME_PAYMENT_MUTATION = gql`
  mutation InitiateProgrammePayment($invoiceId: UUID!, $phone: String!) {
    initiateProgrammePayment(invoiceId: $invoiceId, phone: $phone) {
      attempt {
        id
        gateway
        gatewayReference
        msisdn
        status
        requestedAt
        completedAt
      }
    }
  }
`;

export const RETRY_PROGRAMME_PAYMENT_MUTATION = gql`
  mutation RetryProgrammePayment($paymentId: UUID!, $phone: String!) {
    retryProgrammePayment(paymentId: $paymentId, phone: $phone) {
      attempt {
        id
        gateway
        gatewayReference
        msisdn
        status
        requestedAt
        completedAt
      }
    }
  }
`;
