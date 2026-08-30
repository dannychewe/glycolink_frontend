"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
  ViewAllLink,
} from "@/components/ui/panel";
import { Icons } from "@/components/ui/icons";
import {
  CLINIC_ALERT_WORK_QUEUE_QUERY,
  CLINIC_PATIENT_COHORT_QUERY,
  CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY,
  type AlertWorkQueue,
  type ClinicPatientCohortRow,
  type ClinicProgrammeDashboardOverview,
  type MonitoringAlert,
} from "@/lib/programmes/graphql";
import { cn } from "@/lib/utils/cn";

type OverviewData = {
  clinicProgrammeDashboardOverview: ClinicProgrammeDashboardOverview;
};

type WorkQueueData = {
  clinicAlertWorkQueue: AlertWorkQueue;
};

type CohortData = {
  clinicPatientCohort: {
    items: ClinicPatientCohortRow[];
    total: number;
    page: number;
    limit: number;
  };
};

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "No scheduled time";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function severityVariant(severity: string | null | undefined) {
  const normalized = (severity ?? "").toUpperCase();
  if (normalized === "CRITICAL" || normalized === "HIGH") return "danger" as const;
  if (normalized === "MEDIUM" || normalized === "WARNING") return "warning" as const;
  return "secondary" as const;
}

function statusVariant(status: string | null | undefined) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "SATISFIED") return "success" as const;
  if (normalized === "PAUSED" || normalized === "PENDING_BASELINE" || normalized.includes("REVIEW")) {
    return "warning" as const;
  }
  if (normalized === "WITHDRAWN" || normalized === "MISSED" || normalized === "OVERDUE") {
    return "danger" as const;
  }
  return "secondary" as const;
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-lg bg-border/40" />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-96 animate-pulse rounded-lg bg-border/40" />
        <div className="h-96 animate-pulse rounded-lg bg-border/40" />
      </div>
    </div>
  );
}

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <PanelBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-warning">Programme dashboard unavailable</p>
          <p className="mt-1 text-sm text-muted">
            The clinic programme view could not load. Backend permissions or programme setup may need review.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </PanelBody>
    </Panel>
  );
}

function AttentionStats({ overview, queueTotal }: { overview: ClinicProgrammeDashboardOverview; queueTotal: number }) {
  const openGaps = overview.monitoringAdherence.openMonitoringGaps;
  const activeAlerts = overview.clinicalAlerts.totalActiveAlerts;
  const blocked = overview.readiness.blockedCount;
  const adherenceRate = overview.monitoringAdherence.adherenceRate;

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Needs Attention"
        value={queueTotal}
        sublabel="active queue items"
        icon={Icons.actionRequired}
        tone={queueTotal > 0 ? "danger" : "success"}
      />
      <StatTile
        label="Clinical Alerts"
        value={activeAlerts}
        sublabel={`${overview.clinicalAlerts.overdueActiveAlerts} overdue`}
        icon={Icons.alerts}
        tone={activeAlerts > 0 ? "danger" : "neutral"}
      />
      <StatTile
        label="Monitoring Gaps"
        value={openGaps}
        sublabel={`${overview.monitoringAdherence.patientsWithOpenMonitoringGaps} patients`}
        icon={Icons.monitoring}
        tone={openGaps > 0 ? "warning" : "success"}
      />
      <StatTile
        label="Adherence"
        value={formatPercent(adherenceRate)}
        sublabel={`${blocked} activation blockers`}
        icon={Icons.trend}
        tone={blocked > 0 ? "warning" : "neutral"}
      />
    </div>
  );
}

function ProgrammeReadinessPanel({ overview }: { overview: ClinicProgrammeDashboardOverview }) {
  const rows = [
    ["Awaiting baseline", overview.readiness.awaitingBaselineSubmission],
    ["Awaiting review", overview.readiness.awaitingBaselineReview],
    ["Missing lead provider", overview.readiness.missingLeadProvider],
    ["Missing care plan", overview.readiness.missingActiveCarePlan],
    ["Missing monitoring", overview.readiness.missingValidMonitoringConfiguration],
  ] as const;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.records} count={overview.readiness.blockedCount} countTone="warning">
          Activation Readiness
        </PanelTitle>
      </PanelHeader>
      <PanelList>
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-5 py-3">
            <p className="text-sm text-muted">{label}</p>
            <p className="text-sm font-semibold tabular-nums text-ink">{value}</p>
          </div>
        ))}
      </PanelList>
    </Panel>
  );
}

function AlertRow({ alert }: { alert: MonitoringAlert }) {
  return (
    <div className="flex gap-3 px-5 py-4">
      <span
        className={cn(
          "mt-1 h-10 w-1 shrink-0 rounded-full",
          severityVariant(alert.severity) === "danger"
            ? "bg-danger"
            : severityVariant(alert.severity) === "warning"
              ? "bg-warning"
              : "bg-border",
        )}
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={severityVariant(alert.severity)}>{titleCase(alert.severity)}</Badge>
          <Badge variant={statusVariant(alert.status)}>{titleCase(alert.status)}</Badge>
          {alert.ownerCareTeamRole ? <Badge variant="secondary">{titleCase(alert.ownerCareTeamRole)}</Badge> : null}
        </div>
        <p className="text-sm font-medium text-text">{alert.message ?? titleCase(alert.type)}</p>
        <p className="text-xs text-muted">
          Due {formatDateTime(alert.dueAt)} · {titleCase(alert.category)}
        </p>
      </div>
    </div>
  );
}

function WorkQueuePanel({ queue }: { queue: AlertWorkQueue }) {
  const items = queue.items.slice(0, 6);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.alerts} count={queue.summary.openCount} countTone="danger">
          Today&apos;s Work Queue
        </PanelTitle>
        <ViewAllLink href="/consultant/monitoring/alerts">Open queue</ViewAllLink>
      </PanelHeader>
      {items.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">No active programme work</p>
          <p className="mt-1 text-xs text-muted">No diabetic patients need urgent attention right now.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {items.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function PatientAttentionPanel({ patients }: { patients: ClinicPatientCohortRow[] }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.patients} count={patients.length} countTone="warning">
          Patients Needing Attention
        </PanelTitle>
        <ViewAllLink href="/consultant/patients">View cohort</ViewAllLink>
      </PanelHeader>
      {patients.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">Cohort is stable</p>
          <p className="mt-1 text-xs text-muted">No active programme patients are flagged for follow-up.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {patients.map((patient) => (
            <Link
              key={patient.enrolmentId}
              href={`/consultant/patients/${patient.patientId}`}
              className="block px-5 py-4 transition-colors hover:bg-background"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-text">{patient.patientDisplayName}</p>
                  <p className="text-xs text-muted">{patient.programmeName}</p>
                  <p className="text-sm text-muted">
                    {patient.primaryAttentionReason ??
                      patient.primaryReadinessBlocker ??
                      "Programme follow-up required"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                  <Badge variant={statusVariant(patient.enrolmentStatus)}>
                    {titleCase(patient.enrolmentStatus)}
                  </Badge>
                  {patient.highestActiveAlertSeverity ? (
                    <Badge variant={severityVariant(patient.highestActiveAlertSeverity)}>
                      {titleCase(patient.highestActiveAlertSeverity)}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-muted sm:grid-cols-3">
                <span>{patient.activeClinicalAlertCount} alerts</span>
                <span>{patient.openMonitoringGapCount} gaps</span>
                <span>Next: {formatDateTime(patient.nextExpectedReadingAt)}</span>
              </div>
            </Link>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function PopulationPanel({ overview }: { overview: ClinicProgrammeDashboardOverview }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.patients}>Programme Cohort</PanelTitle>
      </PanelHeader>
      <PanelBody className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {overview.programmePopulation.active}
          </p>
          <p className="mt-1 text-xs text-muted">active diabetic patients</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-ink">
            {overview.programmePopulation.totalEnrolments}
          </p>
          <p className="mt-1 text-xs text-muted">total programme enrolments</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-warning">
            {overview.programmePopulation.pendingBaseline}
          </p>
          <p className="mt-1 text-xs text-muted">pending baseline</p>
        </div>
        <div>
          <p className="text-3xl font-semibold tabular-nums text-primary">
            {overview.readiness.readyForActivation}
          </p>
          <p className="mt-1 text-xs text-muted">ready to activate</p>
        </div>
      </PanelBody>
    </Panel>
  );
}

export function ClinicProgrammeAttentionDashboard() {
  const overviewQuery = useQuery<OverviewData>(CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const queueQuery = useQuery<WorkQueueData>(CLINIC_ALERT_WORK_QUEUE_QUERY, {
    variables: { limit: 6 },
    fetchPolicy: "cache-and-network",
  });
  const cohortQuery = useQuery<CohortData>(CLINIC_PATIENT_COHORT_QUERY, {
    variables: { requiresAttention: true, limit: 6, orderBy: "attention" },
    fetchPolicy: "cache-and-network",
  });

  const overview = overviewQuery.data?.clinicProgrammeDashboardOverview;
  const queue = queueQuery.data?.clinicAlertWorkQueue;
  const attentionPatients = cohortQuery.data?.clinicPatientCohort.items ?? [];
  const loading = overviewQuery.loading && !overview;
  const hasError = Boolean(overviewQuery.error || queueQuery.error || cohortQuery.error);

  if (loading) return <DashboardSkeleton />;

  if (!overview) {
    return (
      <ErrorPanel
        onRetry={() => {
          void overviewQuery.refetch();
          void queueQuery.refetch();
          void cohortQuery.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {hasError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Some programme dashboard sections could not refresh. The visible data may be partial.
        </div>
      ) : null}

      <AttentionStats overview={overview} queueTotal={queue?.total ?? 0} />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <WorkQueuePanel
            queue={
              queue ?? {
                items: [],
                total: 0,
                page: 1,
                limit: 6,
                summary: {
                  openCount: 0,
                  unassignedCount: 0,
                  overdueCount: 0,
                  byStatus: "{}",
                  bySeverity: "{}",
                },
              }
            }
          />
          <PatientAttentionPanel patients={attentionPatients} />
        </div>

        <div className="space-y-6">
          <PopulationPanel overview={overview} />
          <ProgrammeReadinessPanel overview={overview} />
        </div>
      </div>
    </div>
  );
}
