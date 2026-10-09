"use client";

import { useState } from "react";
import { useUrlState } from "@/lib/use-url-state";
import { useQuery } from "@apollo/client";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Heart,
  Lightbulb,
  MessageSquare,
  Stethoscope,
  User,
} from "lucide-react";
import {
  CONSULTANT_PATIENT_WORKSPACE_QUERY,
  mapWorkspaceError,
  type ConsultantPatientWorkspace,
  type WorkspaceRecommendation,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { PatientPcqAssignment } from "@/components/consultant/pcq/PatientPcqAssignment";
import { PatientCarePlanRegistry } from "@/components/consultant/patients/PatientCarePlanRegistry";
import { ConsultantPatientMonitoringPanel } from "@/components/consultant/monitoring/ConsultantPatientMonitoringPanel";
import { PatientProgrammeContinuityPanel } from "@/components/consultant/programmes/PatientProgrammeContinuityPanel";
import { PatientAppointmentsTab } from "@/components/consultant/patients/PatientAppointmentsTab";
import { PatientEncountersTab } from "@/components/consultant/patients/PatientEncountersTab";
import { PatientLabsTab } from "@/components/consultant/patients/PatientLabsTab";
import { PatientPrescriptionsTab } from "@/components/consultant/patients/PatientPrescriptionsTab";
import { PatientQuestionnairesTab } from "@/components/consultant/patients/PatientQuestionnairesTab";
import { PatientDocumentsTab } from "@/components/consultant/patients/PatientDocumentsTab";
import { GLUCOSE_UNIT } from "@/lib/monitoring/graphql";
import { cn } from "@/lib/utils/cn";

// ─── Helpers ──────────────────────────────────────────────

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDiabetesType(value: string | null) {
  if (!value) return null;
  const map: Record<string, string> = {
    type_1: "Type 1",
    type_2: "Type 2",
    prediabetes: "Prediabetes",
    gestational: "Gestational",
    other: "Other",
  };
  return map[value.toLowerCase()] ?? value.replace(/_/g, " ");
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function num(value: number | string | null | undefined, digits = 1) {
  if (value == null || value === "") return "--";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "--";
}

function severityClasses(severity: string): {
  wrap: string;
  icon: string;
  badge: "danger" | "warning" | "primary";
} {
  const s = severity.toLowerCase();
  if (s === "critical")
    return {
      wrap: "border-danger/40 bg-danger/5",
      icon: "text-danger",
      badge: "danger",
    };
  if (s === "high")
    return {
      wrap: "border-danger/30 bg-danger/5",
      icon: "text-danger",
      badge: "danger",
    };
  if (s === "warning")
    return {
      wrap: "border-warning/40 bg-warning/5",
      icon: "text-warning",
      badge: "warning",
    };
  return {
    wrap: "border-primary/30 bg-primary/5",
    icon: "text-primary",
    badge: "primary",
  };
}

function glucoseTone(
  flag: string | null | undefined,
): "success" | "warning" | "danger" | "secondary" {
  const f = (flag ?? "").toLowerCase();
  if (["critical", "high"].includes(f)) return "danger";
  if (["low", "warning"].includes(f)) return "warning";
  if (["normal", "in_range", "good"].includes(f)) return "success";
  return "secondary";
}

// ─── Reusable layout pieces ──────────────────────────────

function OverviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm text-text">
        {value ?? <span className="text-muted">--</span>}
      </dd>
    </div>
  );
}

function SnapshotMetric({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string | null;
  sub?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-xl font-semibold tabular-nums text-ink">
        {value}
        {unit && value !== "--" ? (
          <span className="ml-1 text-xs font-normal text-muted">{unit}</span>
        ) : null}
      </dd>
      {sub ? <div className="text-xs text-muted">{sub}</div> : null}
    </div>
  );
}

// ─── Overview tab ────────────────────────────────────────

function OverviewTab({
  ws,
  onNavigate,
}: {
  ws: ConsultantPatientWorkspace;
  onNavigate: (tab: string) => void;
}) {
  const { patient, monitoring, appointments, ongoingCarePlans } = ws;

  const latestGlucose = monitoring?.latestGlucose ?? null;
  const trend = monitoring?.trend ?? null;
  const summary = monitoring?.glucoseSummary ?? null;
  const openAlerts = (monitoring?.alerts ?? []).filter(
    (a) => !a.acknowledgedAt,
  );
  const activePlans = ongoingCarePlans.filter(
    (p) => (p.status ?? "").toLowerCase() === "active",
  );
  const upcomingAppointments = appointments
    .filter(
      (a) =>
        a.startsAt &&
        new Date(a.startsAt) > new Date() &&
        ["scheduled", "confirmed", "pending"].includes(
          (a.status ?? "").toLowerCase(),
        ),
    )
    .sort(
      (a, b) =>
        new Date(a.startsAt!).getTime() - new Date(b.startsAt!).getTime(),
    );
  const nextAppointment = upcomingAppointments[0] ?? null;
  const lastEncounter = ws.encounters[0] ?? null;

  return (
    <div className="space-y-5">
      {/* Patient profile */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <User className="size-4 text-primary" />
          Patient profile
        </h3>
        <dl className="grid gap-4 border border-border p-4 sm:grid-cols-2 lg:grid-cols-3">
          <OverviewField label="Email" value={patient.email} />
          <OverviewField label="Phone" value={patient.phone} />
          <OverviewField
            label="Date of birth"
            value={formatDate(patient.dateOfBirth)}
          />
          <OverviewField
            label="Diabetes type"
            value={formatDiabetesType(patient.diabetesType)}
          />
          <OverviewField
            label="Diagnosed"
            value={formatDate(patient.diagnosisDate)}
          />
          <OverviewField
            label="Profile"
            value={
              patient.profileComplete ? (
                <Badge variant="success">Complete</Badge>
              ) : (
                <Badge variant="warning">
                  {titleCase(patient.onboardingStatus) || "Pending"}
                </Badge>
              )
            }
          />
        </dl>
        {patient.allergies || patient.currentMedications ? (
          <dl className="grid gap-4 border border-border p-4 sm:grid-cols-2">
            {patient.allergies ? (
              <OverviewField label="Allergies" value={patient.allergies} />
            ) : null}
            {patient.currentMedications ? (
              <OverviewField
                label="Current medications"
                value={patient.currentMedications}
              />
            ) : null}
          </dl>
        ) : null}
        {patient.baselineWeight != null ||
        patient.baselineBpSystolic != null ? (
          <dl className="grid gap-4 border border-border p-4 sm:grid-cols-3">
            <OverviewField
              label="Baseline weight"
              value={
                patient.baselineWeight != null
                  ? `${num(patient.baselineWeight, 1)} kg`
                  : null
              }
            />
            <OverviewField
              label="Baseline BP"
              value={
                patient.baselineBpSystolic != null &&
                patient.baselineBpDiastolic != null
                  ? `${patient.baselineBpSystolic}/${patient.baselineBpDiastolic} mmHg`
                  : null
              }
            />
          </dl>
        ) : null}
      </div>

      {/* Clinical snapshot */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Activity className="size-4 text-primary" />
          Clinical snapshot
        </h3>
        <dl className="grid gap-4 border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0 space-y-1">
            <dt className="text-xs text-muted">Latest glucose</dt>
            <dd className="flex flex-wrap items-baseline gap-2 text-xl font-semibold tabular-nums text-ink">
              {latestGlucose ? num(latestGlucose.value) : "--"}
              {latestGlucose ? (
                <span className="text-xs font-normal text-muted">
                  {latestGlucose.unit ?? GLUCOSE_UNIT}
                </span>
              ) : null}
              {latestGlucose?.flag ? (
                <Badge
                  className="rounded-md tracking-normal"
                  variant={glucoseTone(latestGlucose.flag)}
                >
                  {titleCase(latestGlucose.flag)}
                </Badge>
              ) : null}
            </dd>
            {latestGlucose?.recordedAt ? (
              <p className="text-xs text-muted">
                {formatDateTime(latestGlucose.recordedAt)}
              </p>
            ) : null}
          </div>
          <SnapshotMetric
            label="7-day average"
            value={num(trend?.average7Days)}
            unit={summary?.unit ?? GLUCOSE_UNIT}
          />
          <SnapshotMetric
            label="30-day average"
            value={num(trend?.average30Days)}
            unit={summary?.unit ?? GLUCOSE_UNIT}
          />
          <SnapshotMetric
            label="In range"
            value={
              summary?.stats?.inRangePercent != null &&
              (summary.stats.totalCount ?? 0) > 0
                ? `${num(summary.stats.inRangePercent, 0)}%`
                : "--"
            }
            sub={
              summary?.stats?.totalCount
                ? `${summary.stats.totalCount} readings`
                : undefined
            }
          />
        </dl>
      </div>

      {/* Active care summary */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Heart className="size-4 text-primary" />
          Active care
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Open alerts */}
          <button
            type="button"
            className={cn(
              "flex items-center gap-3 border p-4 text-left transition-colors hover:bg-primary/5",
              openAlerts.length > 0
                ? "border-warning/40 bg-warning/5"
                : "border-border",
            )}
            onClick={() => onNavigate("monitoring")}
          >
            <AlertTriangle
              className={cn(
                "size-5 shrink-0",
                openAlerts.length > 0 ? "text-warning" : "text-muted",
              )}
            />
            <div className="min-w-0">
              <p className="text-xl font-semibold tabular-nums text-ink">
                {openAlerts.length}
              </p>
              <p className="text-xs text-muted">Open alerts</p>
            </div>
          </button>

          {/* Active care plans */}
          <button
            type="button"
            className="flex items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-primary/5"
            onClick={() => onNavigate("care")}
          >
            <ClipboardList className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="text-xl font-semibold tabular-nums text-ink">
                {activePlans.length}
              </p>
              <p className="text-xs text-muted">Active care plans</p>
            </div>
          </button>

          {/* Next appointment */}
          <button
            type="button"
            className="flex items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-primary/5"
            onClick={() => onNavigate("appointments")}
          >
            <CalendarDays className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              {nextAppointment ? (
                <>
                  <p className="text-sm font-semibold text-ink">
                    {formatDateTime(nextAppointment.startsAt)}
                  </p>
                  <p className="text-xs text-muted">
                    {titleCase(nextAppointment.consultationType) ||
                      "Appointment"}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-muted">--</p>
                  <p className="text-xs text-muted">No upcoming appointment</p>
                </>
              )}
            </div>
          </button>

          {/* Last encounter */}
          <button
            type="button"
            className="flex items-center gap-3 border border-border p-4 text-left transition-colors hover:bg-primary/5"
            onClick={() => onNavigate("encounters")}
          >
            <Stethoscope className="size-5 shrink-0 text-primary" />
            <div className="min-w-0">
              {lastEncounter ? (
                <>
                  <p className="text-sm font-semibold text-ink">
                    {formatDateTime(lastEncounter.startedAt)}
                  </p>
                  <p className="text-xs text-muted">
                    {titleCase(lastEncounter.encounterType)} &middot;{" "}
                    {titleCase(lastEncounter.status)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-muted">--</p>
                  <p className="text-xs text-muted">No encounters</p>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Recommendations */}
      {ws.recommendations.length > 0 ? (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Lightbulb className="size-4 text-primary" />
            Recommendations
            <span className="text-xs font-medium tabular-nums text-muted">
              {ws.recommendations.length}
            </span>
          </h3>
          <div className="space-y-2">
            {ws.recommendations.map((rec) => {
              const c = severityClasses(rec.severity);
              return (
                <div
                  key={`${rec.code}-${rec.sourceId ?? ""}`}
                  className={cn("border px-4 py-3", c.wrap)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 text-sm font-semibold text-text">
                      <AlertTriangle className={cn("size-4", c.icon)} />
                      {rec.title}
                    </p>
                    <Badge variant={c.badge}>{titleCase(rec.severity)}</Badge>
                  </div>
                  {rec.description ? (
                    <p className="mt-1.5 text-sm leading-6 text-muted">
                      {rec.description}
                    </p>
                  ) : null}
                  {rec.action ? (
                    <button
                      type="button"
                      className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      onClick={() => {
                        if (rec.sourceType === "monitoring")
                          onNavigate("monitoring");
                        else if (rec.sourceType === "care_plan")
                          onNavigate("care");
                        else if (rec.sourceType === "appointment")
                          onNavigate("appointments");
                        else if (rec.sourceType === "lab")
                          onNavigate("labs");
                      }}
                    >
                      {titleCase(rec.action)}
                      <ArrowRight className="size-3" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────

export function ConsultantPatientWorkspaceView({
  patientId,
}: Readonly<{ patientId: string }>) {
  const [activeTab, setActiveTab] = useUrlState("tab", "overview", [
    "overview",
    "programmes",
    "care",
    "monitoring",
    "appointments",
    "encounters",
    "prescriptions",
    "labs",
    "questionnaires",
    "documents",
  ]);
  const [, setProgrammeEnrolmentId] = useUrlState("enrolment", "");
  const [, setProgrammeTab] = useUrlState("programmeTab", "readiness");
  const [assigningPcq, setAssigningPcq] = useState(false);
  const [pcqSaving, setPcqSaving] = useState(false);
  const { data, loading, error, refetch } = useQuery<{
    consultantPatientWorkspace: ConsultantPatientWorkspace;
  }>(CONSULTANT_PATIENT_WORKSPACE_QUERY, {
    variables: { patientId, limit: 20 },
    fetchPolicy: "cache-and-network",
  });

  const ws = data?.consultantPatientWorkspace;

  if (loading && !ws) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-border/40" />
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl bg-border/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !ws) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-5 py-6 text-sm text-danger">
        {error
          ? mapWorkspaceError(error)
          : "This patient workspace is unavailable."}
        <div className="mt-3">
          <Button variant="secondary" size="sm" href="/consultant/patients">
            Back to patients
          </Button>
        </div>
      </div>
    );
  }

  const { patient, conversation } = ws;

  return (
    <div className="min-w-0 space-y-4">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
        <div className="min-w-0 flex-1 basis-48 space-y-2">
          <Button
            href="/consultant/patients"
            variant="ghost"
            size="sm"
            className="h-auto p-0 text-xs text-muted"
          >
            <ArrowLeft className="size-3.5" />
            Patients
          </Button>
          <h1 className="break-words text-xl font-semibold text-ink">
            {patient.fullName ?? patient.email ?? "Patient"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {patient.diabetesType ? (
              <span className="rounded-full bg-primary/8 px-2 py-0.5 font-medium text-primary">
                {formatDiabetesType(patient.diabetesType)}
              </span>
            ) : null}
            <Badge variant={patient.profileComplete ? "success" : "warning"}>
              {patient.profileComplete
                ? "Profile complete"
                : titleCase(patient.onboardingStatus) || "Pending setup"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {conversation ? (
            <Button
              href={`/consultant/messages/${conversation.id}`}
              variant="secondary"
              size="sm"
            >
              <MessageSquare className="size-4" />
              Message
              {conversation.unreadMessageCount > 0
                ? ` (${conversation.unreadMessageCount})`
                : ""}
            </Button>
          ) : null}
          <Button href="/consultant/consultations" size="sm">
            <Stethoscope className="size-4" />
            Start consultation
          </Button>
        </div>
      </header>

      <WorkspaceTabs
        id="patient-workspace"
        label="Patient workspace"
        value={activeTab}
        onChange={setActiveTab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "programmes", label: "Programmes" },
          {
            key: "care",
            label: "Care Plans",
            count: ws.ongoingCarePlans.length,
          },
          { key: "monitoring", label: "Monitoring" },
          {
            key: "appointments",
            label: "Appointments",
            count: ws.appointments.length,
          },
          {
            key: "encounters",
            label: "Encounters",
            count: ws.encounters.length,
          },
          {
            key: "prescriptions",
            label: "Prescriptions",
            count: ws.prescriptions.length,
          },
          {
            key: "labs",
            label: "Labs",
          },
          {
            key: "questionnaires",
            label: "Questionnaires",
            count: ws.pcqResponses.length,
          },
          { key: "documents", label: "Documents", count: ws.documents.length },
        ]}
      />

      {/* ── Overview tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-overview"
        aria-labelledby="patient-workspace-tab-overview"
        hidden={activeTab !== "overview"}
      >
        <OverviewTab ws={ws} onNavigate={setActiveTab} />
      </section>

      {/* ── Programmes tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-programmes"
        aria-labelledby="patient-workspace-tab-programmes"
        hidden={activeTab !== "programmes"}
      >
        <PatientProgrammeContinuityPanel patientId={patientId} />
      </section>

      {/* ── Monitoring tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-monitoring"
        aria-labelledby="patient-workspace-tab-monitoring"
        hidden={activeTab !== "monitoring"}
      >
        <ConsultantPatientMonitoringPanel patientId={patientId} />
      </section>

      {/* ── Appointments tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-appointments"
        aria-labelledby="patient-workspace-tab-appointments"
        hidden={activeTab !== "appointments"}
      >
        <PatientAppointmentsTab
          appointments={ws.appointments}
          onChanged={() => void refetch()}
        />
      </section>

      {/* ── Encounters tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-encounters"
        aria-labelledby="patient-workspace-tab-encounters"
        hidden={activeTab !== "encounters"}
      >
        <PatientEncountersTab
          encounters={ws.encounters}
          carePlanActions={ws.carePlanActions}
        />
      </section>

      {/* ── Prescriptions tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-prescriptions"
        aria-labelledby="patient-workspace-tab-prescriptions"
        hidden={activeTab !== "prescriptions"}
      >
        <PatientPrescriptionsTab
          prescriptions={ws.prescriptions}
          onChanged={() => void refetch()}
        />
      </section>

      {/* ── Labs tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-labs"
        aria-labelledby="patient-workspace-tab-labs"
        hidden={activeTab !== "labs"}
      >
        <PatientLabsTab
          labOrders={ws.labOrders}
          labResults={ws.labResults}
          onChanged={() => void refetch()}
        />
      </section>

      {/* ── Questionnaires tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-questionnaires"
        aria-labelledby="patient-workspace-tab-questionnaires"
        hidden={activeTab !== "questionnaires"}
      >
        <PatientQuestionnairesTab
          pcqResponses={ws.pcqResponses}
          onAssign={() => setAssigningPcq(true)}
        />
      </section>

      {/* ── Documents tab ── */}
      <section
        role="tabpanel"
        id="patient-workspace-panel-documents"
        aria-labelledby="patient-workspace-tab-documents"
        hidden={activeTab !== "documents"}
      >
        <PatientDocumentsTab
          patientId={patientId}
          documents={ws.documents}
          onChanged={() => void refetch()}
        />
      </section>

      <section
        role="tabpanel"
        id="patient-workspace-panel-care"
        aria-labelledby="patient-workspace-tab-care"
        hidden={activeTab !== "care"}
        className="space-y-4"
      >
        <PatientCarePlanRegistry
          patientId={patientId}
          carePlans={ws.ongoingCarePlans}
          active={activeTab === "care"}
          onChanged={() => void refetch()}
          onOpenEnrolment={(enrolmentId) => {
            setProgrammeEnrolmentId(enrolmentId);
            setProgrammeTab("care");
            setActiveTab("programmes");
          }}
        />
      </section>
      {assigningPcq ? (
        <DetailModal
          title="Assign questionnaire"
          className="sm:max-w-2xl"
          onClose={() => {
            if (!pcqSaving) setAssigningPcq(false);
          }}
          footer={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={pcqSaving}
              onClick={() => setAssigningPcq(false)}
            >
              Close
            </Button>
          }
        >
          <PatientPcqAssignment
            patientId={patientId}
            embedded
            onSavingChange={setPcqSaving}
            onAssigned={() => void refetch()}
          />
        </DetailModal>
      ) : null}
    </div>
  );
}
