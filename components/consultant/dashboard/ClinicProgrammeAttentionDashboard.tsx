"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Panel,
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
import {
  TODAYS_APPOINTMENTS_QUERY,
  UPCOMING_APPOINTMENTS_QUERY,
} from "@/lib/bookings/graphql";
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

type ConsultantAppointmentItem = {
  patientName: string | null;
  appointment: {
    id: string;
    startsAt: string;
    endsAt: string | null;
    status: string;
    consultationType: string | null;
    patientId: string;
  };
};

type TodaysAppointmentsData = {
  todaysAppointments: ConsultantAppointmentItem[];
};

type UpcomingAppointmentsData = {
  upcomingAppointments: ConsultantAppointmentItem[];
};

type ActionItem =
  | { kind: "alert"; alert: MonitoringAlert }
  | { kind: "patient"; patient: ClinicPatientCohortRow };

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { hour: "numeric", minute: "2-digit" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "";
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

function appointmentStatusVariant(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "primary" as const;
  if (s === "CONFIRMED" || s === "COMPLETED") return "success" as const;
  if (s === "AWAITING_PAYMENT" || s === "PENDING") return "warning" as const;
  if (s === "CANCELLED" || s === "NO_SHOW") return "danger" as const;
  return "secondary" as const;
}

function appointmentStatusAccent(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS" || s === "CHECKED_IN") return "bg-primary";
  if (s === "CONFIRMED") return "bg-success";
  if (s === "AWAITING_PAYMENT" || s === "PENDING") return "bg-warning";
  if (s === "CANCELLED" || s === "NO_SHOW") return "bg-danger";
  return "bg-border";
}

function formatAppointmentStatus(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "AWAITING_PAYMENT") return "Awaiting Payment";
  if (s === "IN_PROGRESS") return "In Progress";
  if (s === "CHECKED_IN") return "Checked In";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function severityWeight(severity: string | null | undefined) {
  const s = (severity ?? "").toUpperCase();
  if (s === "CRITICAL") return 4;
  if (s === "HIGH") return 3;
  if (s === "MEDIUM" || s === "WARNING") return 2;
  return 1;
}

// ─── Skeleton ───────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="h-80 animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}

// ─── Stat Row ───────────────────────────────────────────

function StatsRow({ overview, queueTotal }: { overview: ClinicProgrammeDashboardOverview; queueTotal: number }) {
  const activePatients = overview.programmePopulation.active;
  const activeAlerts = overview.clinicalAlerts.totalActiveAlerts;
  const adherenceRate = overview.monitoringAdherence.adherenceRate;
  const openGaps = overview.monitoringAdherence.openMonitoringGaps;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Active Patients"
        value={activePatients}
        sublabel={`${overview.programmePopulation.pendingBaseline} pending baseline`}
        icon={Icons.patients}
        tone={activePatients > 0 ? "primary" : "neutral"}
      />
      <StatTile
        label="Action Items"
        value={queueTotal}
        sublabel={`${activeAlerts} clinical alert${activeAlerts === 1 ? "" : "s"}`}
        icon={Icons.actionRequired}
        tone={queueTotal > 0 ? "danger" : "success"}
      />
      <StatTile
        label="Monitoring Gaps"
        value={openGaps}
        sublabel={`${overview.monitoringAdherence.patientsWithOpenMonitoringGaps} patient${overview.monitoringAdherence.patientsWithOpenMonitoringGaps === 1 ? "" : "s"}`}
        icon={Icons.monitoring}
        tone={openGaps > 0 ? "warning" : "success"}
      />
      <StatTile
        label="Adherence Rate"
        value={formatPercent(adherenceRate)}
        sublabel={`${overview.readiness.blockedCount} activation blocker${overview.readiness.blockedCount === 1 ? "" : "s"}`}
        icon={Icons.trend}
        tone={overview.readiness.blockedCount > 0 ? "warning" : "neutral"}
      />
    </div>
  );
}

// ─── Today's Schedule ───────────────────────────────────

function TodaySchedulePanel() {
  const { data: todaysData, loading, error } = useQuery<TodaysAppointmentsData>(
    TODAYS_APPOINTMENTS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: upcomingData } = useQuery<UpcomingAppointmentsData>(
    UPCOMING_APPOINTMENTS_QUERY,
    { variables: { limit: 50 }, fetchPolicy: "cache-and-network" },
  );

  const appointments = todaysData?.todaysAppointments ?? [];
  const upcomingCount = upcomingData?.upcomingAppointments?.length ?? 0;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.appointments} count={appointments.length} countTone="primary">
          Today&apos;s Schedule
        </PanelTitle>
        <ViewAllLink href="/consultant/appointments" />
      </PanelHeader>

      {error ? (
        <PanelEmpty className="text-warning">Unable to load appointments.</PanelEmpty>
      ) : loading && appointments.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="h-9 flex-1 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">No appointments today</p>
          <p className="mt-0.5 text-xs text-muted">Your schedule is clear.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {appointments.map((item) => (
            <Link
              key={item.appointment.id}
              href={`/consultant/appointments/${item.appointment.id}/video`}
              className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-background"
            >
              <span className={cn("h-9 w-1 shrink-0 rounded-full", appointmentStatusAccent(item.appointment.status))} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">
                  {item.patientName ?? "Patient"}
                </p>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                  <Icons.time className="size-3" />
                  {formatTime(item.appointment.startsAt)}
                  {item.appointment.consultationType ? (
                    <span className="capitalize text-muted">
                      · {item.appointment.consultationType.replace(/_/g, " ").toLowerCase()}
                    </span>
                  ) : null}
                </div>
              </div>
              <Badge variant={appointmentStatusVariant(item.appointment.status)}>
                {formatAppointmentStatus(item.appointment.status)}
              </Badge>
            </Link>
          ))}
        </PanelList>
      )}

      {upcomingCount > 0 ? (
        <div className="border-t border-border px-5 py-2.5 text-xs text-muted">
          {upcomingCount} more appointment{upcomingCount === 1 ? "" : "s"} scheduled ahead.
        </div>
      ) : null}
    </Panel>
  );
}

// ─── Unified Action Items ───────────────────────────────

function ActionItemRow({ item }: { item: ActionItem }) {
  if (item.kind === "alert") {
    const alert = item.alert;
    return (
      <div className="flex gap-3 px-5 py-3.5">
        <span
          className={cn(
            "mt-1 h-9 w-1 shrink-0 rounded-full",
            severityVariant(alert.severity) === "danger"
              ? "bg-danger"
              : severityVariant(alert.severity) === "warning"
                ? "bg-warning"
                : "bg-border",
          )}
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-text">{alert.message ?? titleCase(alert.type)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <Badge variant={severityVariant(alert.severity)} className="text-[0.6rem]">{titleCase(alert.severity)}</Badge>
            <span>{titleCase(alert.category)}</span>
            {alert.dueAt ? (
              <span>· Due {formatDateTime(alert.dueAt)}</span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  const patient = item.patient;
  return (
    <Link
      href={`/consultant/patients/${patient.patientId}`}
      className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-background"
    >
      <span
        className={cn(
          "mt-1 h-9 w-1 shrink-0 rounded-full",
          patient.highestActiveAlertSeverity
            ? severityVariant(patient.highestActiveAlertSeverity) === "danger"
              ? "bg-danger"
              : "bg-warning"
            : "bg-primary",
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-text">{patient.patientDisplayName}</p>
          <div className="flex shrink-0 gap-1.5">
            <Badge variant={statusVariant(patient.enrolmentStatus)} className="text-[0.6rem]">
              {titleCase(patient.enrolmentStatus)}
            </Badge>
            {patient.highestActiveAlertSeverity ? (
              <Badge variant={severityVariant(patient.highestActiveAlertSeverity)} className="text-[0.6rem]">
                {titleCase(patient.highestActiveAlertSeverity)}
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {patient.primaryAttentionReason ?? patient.primaryReadinessBlocker ?? "Follow-up required"}
        </p>
        <div className="mt-1 flex gap-3 text-xs text-muted">
          {patient.activeClinicalAlertCount > 0 ? (
            <span>{patient.activeClinicalAlertCount} alert{patient.activeClinicalAlertCount === 1 ? "" : "s"}</span>
          ) : null}
          {patient.openMonitoringGapCount > 0 ? (
            <span>{patient.openMonitoringGapCount} gap{patient.openMonitoringGapCount === 1 ? "" : "s"}</span>
          ) : null}
          {patient.nextExpectedReadingAt ? (
            <span>Next: {formatDateTime(patient.nextExpectedReadingAt)}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

function ActionItemsPanel({ alerts, patients }: { alerts: MonitoringAlert[]; patients: ClinicPatientCohortRow[] }) {
  const items = useMemo<ActionItem[]>(() => {
    const alertItems: ActionItem[] = alerts.map((alert) => ({ kind: "alert", alert }));
    const patientItems: ActionItem[] = patients
      .filter((p) => !alerts.some((a) => a.patientId === p.patientId))
      .map((patient) => ({ kind: "patient", patient }));

    const merged = [...alertItems, ...patientItems];
    merged.sort((a, b) => {
      const sevA = a.kind === "alert" ? severityWeight(a.alert.severity) : severityWeight(a.patient.highestActiveAlertSeverity);
      const sevB = b.kind === "alert" ? severityWeight(b.alert.severity) : severityWeight(b.patient.highestActiveAlertSeverity);
      return sevB - sevA;
    });
    return merged.slice(0, 8);
  }, [alerts, patients]);

  const totalCount = items.length;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.actionRequired} count={totalCount} countTone={totalCount > 0 ? "danger" : "neutral"}>
          Action Items
        </PanelTitle>
        <ViewAllLink href="/consultant/monitoring/alerts">Open queue</ViewAllLink>
      </PanelHeader>
      {items.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">All clear</p>
          <p className="mt-0.5 text-xs text-muted">No patients need urgent attention right now.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {items.map((item) => (
            <ActionItemRow
              key={item.kind === "alert" ? `a-${item.alert.id}` : `p-${item.patient.enrolmentId}`}
              item={item}
            />
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

// ─── Main Dashboard ─────────────────────────────────────

function ErrorPanel({ onRetry }: { onRetry: () => void }) {
  return (
    <Panel>
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-warning">Dashboard unavailable</p>
          <p className="mt-1 text-sm text-muted">
            Could not load the programme dashboard. Check permissions or programme setup.
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Panel>
  );
}

export function ClinicProgrammeAttentionDashboard() {
  const overviewQuery = useQuery<OverviewData>(CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const queueQuery = useQuery<WorkQueueData>(CLINIC_ALERT_WORK_QUEUE_QUERY, {
    variables: { limit: 8 },
    fetchPolicy: "cache-and-network",
  });
  const cohortQuery = useQuery<CohortData>(CLINIC_PATIENT_COHORT_QUERY, {
    variables: { requiresAttention: true, limit: 8, orderBy: "attention" },
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
        <div className="border-l-4 border-warning bg-warning/5 px-4 py-3 text-sm text-warning">
          Some sections could not refresh. The visible data may be partial.
        </div>
      ) : null}

      <StatsRow overview={overview} queueTotal={queue?.total ?? 0} />

      <TodaySchedulePanel />

      <ActionItemsPanel
        alerts={queue?.items ?? []}
        patients={attentionPatients}
      />
    </div>
  );
}
