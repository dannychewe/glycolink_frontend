"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PATIENT_ENCOUNTER_QUERY } from "@/lib/patient/clinical-records-graphql";

type GraphqlEncounterDetailViewProps = Readonly<{
  encounterId: string;
}>;

type SoapVersion = {
  id: string;
  versionNumber: number;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdAt: string;
};

type Diagnosis = {
  id: string;
  codeSystem: string | null;
  code: string | null;
  description: string | null;
  isPrimary: boolean;
};

type Observation = {
  id: string;
  type: string;
  valueNumeric: number | null;
  valueText: string | null;
  unit: string | null;
};

type CarePlanAction = {
  id: string;
  type: string | null;
  description: string | null;
  targetDate: string | null;
  status: string;
};

type Amendment = {
  id: string;
  soapNoteVersionNumber: number | null;
  amendmentText: string;
  createdAt: string;
};

type EncounterDetail = {
  id: string;
  appointmentId: string | null;
  providerId: string;
  encounterType: string | null;
  status: string;
  clinicalSummary: string | null;
  startedAt: string | null;
  endedAt: string | null;
  finalizedAt: string | null;
  soapVersions: SoapVersion[];
  diagnoses: Diagnosis[];
  observations: Observation[];
  carePlanActions: CarePlanAction[];
  amendments: Amendment[];
};

type PatientEncounterData = {
  encounter: EncounterDetail | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function formatEncounterType(value: string | null) {
  if (!value) return "Consultation";
  const s = value.trim().toLowerCase();
  if (s === "telemedicine") return "Telemedicine";
  if (s === "in_person") return "In-person";
  if (s === "home_visit") return "Home visit";
  return value;
}

function getBadgeVariant(status: string): "success" | "primary" | "secondary" {
  const s = status.trim().toUpperCase();
  if (s === "FINALIZED") return "success";
  if (s === "OPEN" || s === "IN_PROGRESS") return "primary";
  return "secondary";
}

function formatStatus(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS") return "In Progress";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function formatObservationType(type: string) {
  const map: Record<string, string> = {
    blood_pressure: "Blood Pressure",
    heart_rate: "Heart Rate",
    temperature: "Temperature",
    weight: "Weight",
    height: "Height",
    spo2: "SpO2",
    blood_glucose: "Blood Glucose",
    other: "Other",
  };
  return map[type.toLowerCase()] ?? type;
}

function formatCarePlanType(type: string | null) {
  if (!type) return "—";
  const map: Record<string, string> = {
    medication: "Medication",
    lifestyle: "Lifestyle",
    follow_up: "Follow-up",
    referral: "Referral",
    education: "Education",
    monitoring: "Monitoring",
    other: "Other",
  };
  return map[type.toLowerCase()] ?? type;
}

function formatCarePlanStatus(status: string) {
  const s = status.trim().toUpperCase();
  if (s === "IN_PROGRESS") return "In Progress";
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function getCarePlanStatusVariant(status: string): "success" | "primary" | "warning" | "secondary" {
  const s = status.trim().toUpperCase();
  if (s === "COMPLETED") return "success";
  if (s === "IN_PROGRESS") return "primary";
  if (s === "PENDING") return "warning";
  return "secondary";
}

function SectionCard({ title, children }: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <Card className="border-border/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-text">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: Readonly<{ label: string; value: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <dt className="w-36 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="text-sm font-medium text-text">{value}</dd>
    </div>
  );
}

export function GraphqlEncounterDetailView({ encounterId }: GraphqlEncounterDetailViewProps) {
  const { data, loading, error } = useQuery<PatientEncounterData>(PATIENT_ENCOUNTER_QUERY, {
    variables: { id: encounterId },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-border/40" />
        <div className="h-40 animate-pulse rounded-[1.75rem] bg-border/40" />
        <div className="h-48 animate-pulse rounded-xl bg-border/40" />
        <div className="h-48 animate-pulse rounded-xl bg-border/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load this record. Please try again.
      </div>
    );
  }

  const encounter = data?.encounter;

  if (!encounter) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
        <p className="text-base font-medium text-text">Record not found</p>
      </div>
    );
  }

  const latestSoap = encounter.soapVersions.length > 0
    ? encounter.soapVersions.reduce((a, b) => (a.versionNumber >= b.versionNumber ? a : b))
    : null;

  const primaryDiagnosis = encounter.diagnoses.find((d) => d.isPrimary);
  const secondaryDiagnoses = encounter.diagnoses.filter((d) => !d.isPrimary);

  return (
    <div className="space-y-6">
      <Link
        href="/patient/records"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-text"
      >
        <ArrowLeft className="size-4" />
        Back to records
      </Link>

      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              {formatEncounterType(encounter.encounterType)} encounter
            </p>
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">
              {encounter.finalizedAt
                ? `Finalized ${formatShortDate(encounter.finalizedAt)}`
                : `Started ${formatShortDate(encounter.startedAt)}`}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(encounter.startedAt)}
              </span>
              {encounter.endedAt ? (
                <span>– {formatDate(encounter.endedAt)}</span>
              ) : null}
            </div>
          </div>
          <Badge variant={getBadgeVariant(encounter.status)} className="self-start">
            {formatStatus(encounter.status)}
          </Badge>
        </div>
      </header>

      {encounter.clinicalSummary ? (
        <SectionCard title="Clinical Summary">
          <p className="text-sm leading-7 text-text">{encounter.clinicalSummary}</p>
        </SectionCard>
      ) : null}

      {latestSoap ? (
        <SectionCard title={`SOAP Notes${encounter.soapVersions.length > 1 ? ` (v${latestSoap.versionNumber})` : ""}`}>
          <dl className="space-y-4">
            {latestSoap.subjective ? (
              <DetailRow label="Subjective" value={latestSoap.subjective} />
            ) : null}
            {latestSoap.objective ? (
              <DetailRow label="Objective" value={latestSoap.objective} />
            ) : null}
            {latestSoap.assessment ? (
              <DetailRow label="Assessment" value={latestSoap.assessment} />
            ) : null}
            {latestSoap.plan ? (
              <DetailRow label="Plan" value={latestSoap.plan} />
            ) : null}
          </dl>
        </SectionCard>
      ) : null}

      {encounter.diagnoses.length > 0 ? (
        <SectionCard title="Diagnoses">
          <div className="space-y-3">
            {primaryDiagnosis ? (
              <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{primaryDiagnosis.description ?? "—"}</p>
                  {primaryDiagnosis.code ? (
                    <p className="mt-0.5 text-xs text-muted">
                      {primaryDiagnosis.codeSystem} · {primaryDiagnosis.code}
                    </p>
                  ) : null}
                </div>
                <Badge variant="primary">Primary</Badge>
              </div>
            ) : null}
            {secondaryDiagnoses.map((diagnosis) => (
              <div
                key={diagnosis.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{diagnosis.description ?? "—"}</p>
                  {diagnosis.code ? (
                    <p className="mt-0.5 text-xs text-muted">
                      {diagnosis.codeSystem} · {diagnosis.code}
                    </p>
                  ) : null}
                </div>
                <Badge variant="secondary">Secondary</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {encounter.observations.length > 0 ? (
        <SectionCard title="Observations">
          <div className="grid gap-3 sm:grid-cols-2">
            {encounter.observations.map((obs) => (
              <div
                key={obs.id}
                className="rounded-lg border border-border/70 bg-background px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-muted">
                  {formatObservationType(obs.type)}
                </p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {obs.valueNumeric !== null && obs.valueNumeric !== undefined
                    ? `${obs.valueNumeric}${obs.unit ? ` ${obs.unit}` : ""}`
                    : obs.valueText ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {encounter.carePlanActions.length > 0 ? (
        <SectionCard title="Care Plan">
          <div className="space-y-3">
            {encounter.carePlanActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 bg-background px-4 py-3"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                    {formatCarePlanType(action.type)}
                  </p>
                  <p className="text-sm text-text">{action.description ?? "—"}</p>
                  {action.targetDate ? (
                    <p className="text-xs text-muted">
                      Target: {formatShortDate(action.targetDate)}
                    </p>
                  ) : null}
                </div>
                <Badge variant={getCarePlanStatusVariant(action.status)}>
                  {formatCarePlanStatus(action.status)}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {encounter.amendments.length > 0 ? (
        <SectionCard title="Amendments">
          <div className="space-y-3">
            {encounter.amendments.map((amendment) => (
              <div
                key={amendment.id}
                className="rounded-lg border border-border/70 bg-background px-4 py-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted">
                    {amendment.soapNoteVersionNumber !== null
                      ? `Amendment to v${amendment.soapNoteVersionNumber}`
                      : "Amendment"}
                  </p>
                  <p className="text-xs text-muted">{formatDate(amendment.createdAt)}</p>
                </div>
                <p className="text-sm text-text">{amendment.amendmentText}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
