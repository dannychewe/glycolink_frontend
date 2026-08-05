"use client";

import { useQuery } from "@apollo/client";
import {
  Activity, AlertTriangle, CalendarDays, FileText, FlaskConical,
  Lightbulb, MessageSquare, Pill, Stethoscope,
} from "lucide-react";
import {
  CONSULTANT_PATIENT_WORKSPACE_QUERY,
  mapWorkspaceError,
  type ConsultantPatientWorkspace,
  type WorkspaceRecommendation,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientPcqAssignment } from "@/components/consultant/pcq/PatientPcqAssignment";
import { CarePlanManager } from "@/components/consultant/patients/CarePlanManager";
import { ConsultantPatientMonitoringPanel } from "@/components/consultant/monitoring/ConsultantPatientMonitoringPanel";
import { cn } from "@/lib/utils/cn";

// ─── Helpers ──────────────────────────────────────────────

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatDiabetesType(value: string | null) {
  if (!value) return null;
  const map: Record<string, string> = {
    type_1: "Type 1", type_2: "Type 2", prediabetes: "Prediabetes",
    gestational: "Gestational", other: "Other",
  };
  return map[value] ?? value.replace(/_/g, " ");
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function severityClasses(severity: string): { wrap: string; icon: string; badge: "danger" | "warning" | "primary" } {
  const s = severity.toLowerCase();
  if (s === "critical") return { wrap: "border-danger/40 bg-danger/5", icon: "text-danger", badge: "danger" };
  if (s === "high") return { wrap: "border-danger/30 bg-danger/5", icon: "text-danger", badge: "danger" };
  if (s === "warning") return { wrap: "border-warning/40 bg-warning/5", icon: "text-warning", badge: "warning" };
  return { wrap: "border-primary/30 bg-primary/5", icon: "text-primary", badge: "primary" };
}

function flagVariant(flag: string | null | undefined): "success" | "warning" | "danger" | "secondary" {
  const f = (flag ?? "").toLowerCase();
  if (f.includes("critical") || f.includes("high")) return "danger";
  if (f.includes("low") || f.includes("abnormal")) return "warning";
  if (f.includes("normal")) return "success";
  return "secondary";
}

function SectionCard({
  title, icon, count, children,
}: {
  title: string;
  icon: React.ReactNode;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
          {typeof count === "number" ? (
            <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{count}</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <p className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-center text-sm text-muted">{label}</p>;
}

// ─── Recommendations ──────────────────────────────────────

function Recommendations({ items }: { items: WorkspaceRecommendation[] }) {
  if (items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="size-5 text-primary" />
          Recommendations
          <span className="ml-1 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">{items.length}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((rec) => {
          const c = severityClasses(rec.severity);
          return (
            <div key={`${rec.code}-${rec.sourceId ?? ""}`} className={cn("rounded-xl border px-4 py-3", c.wrap)}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-text">
                  <AlertTriangle className={cn("size-4", c.icon)} />
                  {rec.title}
                </p>
                <Badge variant={c.badge}>{titleCase(rec.severity)}</Badge>
              </div>
              {rec.description ? <p className="mt-1.5 text-sm leading-6 text-muted">{rec.description}</p> : null}
              {rec.action ? (
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-primary">{titleCase(rec.action)}</p>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ─── Main view ────────────────────────────────────────────

export function ConsultantPatientWorkspaceView({ patientId }: Readonly<{ patientId: string }>) {
  const { data, loading, error, refetch } = useQuery<{ consultantPatientWorkspace: ConsultantPatientWorkspace }>(
    CONSULTANT_PATIENT_WORKSPACE_QUERY,
    { variables: { patientId, limit: 20 }, fetchPolicy: "cache-and-network" },
  );

  const ws = data?.consultantPatientWorkspace;

  if (loading && !ws) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-xl bg-border/40" />
        <div className="grid gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !ws) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/5 px-5 py-6 text-sm text-danger">
        {error ? mapWorkspaceError(error) : "This patient workspace is unavailable."}
        <div className="mt-3">
          <Button variant="secondary" size="sm" href="/consultant/patients">Back to patients</Button>
        </div>
      </div>
    );
  }

  const { patient, conversation } = ws;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-6 py-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Patient Workspace</p>
          <h1 className="text-3xl font-semibold text-text">{patient.fullName ?? patient.email ?? "Patient"}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
            {patient.diabetesType ? (
              <span className="rounded-full bg-primary/8 px-2 py-0.5 font-medium text-primary">{formatDiabetesType(patient.diabetesType)}</span>
            ) : null}
            <Badge variant={patient.profileComplete ? "success" : "warning"}>
              {patient.profileComplete ? "Profile complete" : titleCase(patient.onboardingStatus) || "Pending setup"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`/consultant/patients/${patientId}/monitoring`} variant="secondary">
            <Activity className="size-4" />
            Monitoring
          </Button>
          {conversation ? (
            <Button href={`/consultant/messages/${conversation.id}`} variant="secondary">
              <MessageSquare className="size-4" />
              Message{conversation.unreadMessageCount > 0 ? ` (${conversation.unreadMessageCount})` : ""}
            </Button>
          ) : null}
          <Button href="/consultant/consultations">Start Consultation</Button>
        </div>
      </header>

      <Recommendations items={ws.recommendations} />

      <div className="grid gap-6 xl:grid-cols-2">
        <ConsultantPatientMonitoringPanel patientId={patientId} />

        {/* PCQ responses */}
        <SectionCard title="PCQ Responses" icon={<FileText className="size-5 text-primary" />} count={ws.pcqResponses.length}>
          {ws.pcqResponses.length === 0 ? <EmptyRow label="No PCQ responses yet." /> : ws.pcqResponses.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <span className="text-text">{titleCase(p.responseScope) || "PCQ"}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {p.submittedAt ? formatDate(p.submittedAt) : "Not submitted"}
                <Badge variant={p.status?.toLowerCase() === "submitted" ? "success" : "warning"}>{titleCase(p.status)}</Badge>
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Appointments */}
        <SectionCard title="Appointments" icon={<CalendarDays className="size-5 text-primary" />} count={ws.appointments.length}>
          {ws.appointments.length === 0 ? <EmptyRow label="No appointments." /> : ws.appointments.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <span className="text-text">{formatDateTime(a.startsAt)}</span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {titleCase(a.consultationType)}
                <Badge variant="secondary">{titleCase(a.status)}</Badge>
              </span>
            </div>
          ))}
        </SectionCard>

        {/* Encounters */}
        <SectionCard title="Encounters" icon={<Stethoscope className="size-5 text-primary" />} count={ws.encounters.length}>
          {ws.encounters.length === 0 ? <EmptyRow label="No encounters recorded." /> : ws.encounters.map((e) => (
            <div key={e.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text">{formatDateTime(e.startedAt)}</span>
                <Badge variant="secondary">{titleCase(e.status)}</Badge>
              </div>
              {e.clinicalSummary ? <p className="mt-1.5 text-sm leading-6 text-muted">{e.clinicalSummary}</p> : null}
            </div>
          ))}
        </SectionCard>

        {/* Prescriptions */}
        <SectionCard title="Prescriptions" icon={<Pill className="size-5 text-primary" />} count={ws.prescriptions.length}>
          {ws.prescriptions.length === 0 ? <EmptyRow label="No prescriptions shared." /> : ws.prescriptions.map((pr) => (
            <div key={pr.id} className="rounded-xl border border-border bg-background px-4 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text">Issued {formatDate(pr.issuedAt)}</span>
                <Badge variant="secondary">{titleCase(pr.status)}</Badge>
              </div>
              <ul className="mt-2 space-y-1">
                {pr.items.map((it) => (
                  <li key={it.id} className="text-sm text-muted">
                    <span className="font-medium text-text">{it.drugName}</span>
                    {it.dosage ? ` — ${it.dosage}` : ""}{it.frequency ? `, ${it.frequency}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </SectionCard>

        {/* Labs */}
        <SectionCard title="Labs" icon={<FlaskConical className="size-5 text-primary" />} count={ws.labResults.length + ws.labOrders.length}>
          {ws.labResults.length === 0 && ws.labOrders.length === 0 ? <EmptyRow label="No lab orders or results shared." /> : (
            <>
              {ws.labResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <span className="text-text">
                    {r.valueText ?? (r.valueNumeric != null ? `${r.valueNumeric}${r.unit ? ` ${r.unit}` : ""}` : "Result")}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {formatDate(r.resultedAt)}
                    {r.flag ? <Badge variant={flagVariant(r.flag)}>{titleCase(r.flag)}</Badge> : null}
                  </span>
                </div>
              ))}
              {ws.labOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm">
                  <span className="text-muted">Order • {formatDate(o.orderedAt)}</span>
                  <Badge variant="secondary">{titleCase(o.status)}</Badge>
                </div>
              ))}
            </>
          )}
        </SectionCard>

        {/* Documents */}
        <SectionCard title="Documents" icon={<FileText className="size-5 text-primary" />} count={ws.documents.length}>
          {ws.documents.length === 0 ? <EmptyRow label="No documents shared." /> : ws.documents.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate text-text">{d.originalName ?? titleCase(d.docType) ?? "Document"}</p>
                <p className="text-xs text-muted">{titleCase(d.docType)} • {formatDate(d.recordedDate)}</p>
              </div>
              {d.fileUrl ? (
                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-medium text-primary underline underline-offset-4">
                  Open
                </a>
              ) : null}
            </div>
          ))}
        </SectionCard>
      </div>

      {/* Care plan actions snapshot (encounter-level) */}
      {ws.carePlanActions.length > 0 ? (
        <SectionCard title="Care Plan Actions" icon={<Stethoscope className="size-5 text-primary" />} count={ws.carePlanActions.length}>
          {ws.carePlanActions.map((a) => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm">
              <span className="text-text">
                {a.type ? <span className="font-medium capitalize">{a.type}: </span> : null}{a.description}
              </span>
              <span className="flex items-center gap-2 text-xs text-muted">
                {a.targetDate ? <span>Due {formatDate(a.targetDate)}</span> : null}
                <Badge variant="secondary">{titleCase(a.status)}</Badge>
              </span>
            </div>
          ))}
        </SectionCard>
      ) : null}

      {/* Ongoing care plans (with create/add mutations) */}
      <CarePlanManager patientId={patientId} carePlans={ws.ongoingCarePlans} onChanged={() => void refetch()} />

      {/* Assign supplemental PCQ */}
      <PatientPcqAssignment patientId={patientId} />
    </div>
  );
}
