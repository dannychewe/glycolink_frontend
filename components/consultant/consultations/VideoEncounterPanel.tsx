"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Activity,
  AlertCircle,
  CalendarClock,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Loader2,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import {
  ENCOUNTER_QUERY,
  FINALIZE_ENCOUNTER_MUTATION,
  OBSERVATION_TYPE_OPTIONS,
  CARE_PLAN_TYPE_OPTIONS,
  SAVE_SOAP_MUTATION,
  START_ENCOUNTER_MUTATION,
  ADD_OBSERVATION_MUTATION,
  ADD_DIAGNOSIS_MUTATION,
  CREATE_CARE_PLAN_MUTATION,
  CODE_SYSTEM_OPTIONS,
} from "@/lib/consultant/consultation-graphql";
import {
  CONSULTANT_PATIENT_WORKSPACE_QUERY,
} from "@/lib/consultant/patient-workspace-graphql";

type VideoEncounterPanelProps = Readonly<{
  appointmentId: string;
  patientId: string;
}>;

type SoapDraft = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
};

type SoapVersion = {
  id: string;
  versionNumber: number;
  isFinalized: boolean;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  createdAt: string;
};

type Encounter = {
  id: string;
  appointmentId: string;
  patientId: string;
  status: string;
  startedAt: string | null;
  endedAt: string | null;
  finalizedAt: string | null;
  soapVersions: SoapVersion[];
  diagnoses: { id: string; description: string; code: string | null; codeSystem: string | null; isPrimary: boolean }[];
  observations: { id: string; type: string; valueNumeric: number | null; valueText: string | null; unit: string | null }[];
  carePlanActions: { id: string; type: string; description: string; targetDate: string | null; status: string }[];
};

type EncounterData = { encounter: Encounter | null };
type StartEncounterData = { startEncounter: { encounter: { id: string; status: string; startedAt: string } } };

type PatientSummary = {
  patient: {
    id: string;
    fullName: string;
    diabetesType: string | null;
    allergies: string | null;
    currentMedications: string | null;
  };
  monitoring: {
    latestGlucose: { value: number; unit: string; flag: string | null; recordedAt: string } | null;
    trend: { average7Days: number | null; average30Days: number | null } | null;
    alerts: { id: string; severity: string; message: string }[];
  } | null;
};
type PatientWorkspaceData = { consultantPatientWorkspace: PatientSummary };

type Tab = "patient" | "soap" | "actions";

function formatGlucose(value: number, unit: string) {
  return `${value.toFixed(1)} ${unit}`;
}

function flagColor(flag: string | null) {
  if (!flag) return "text-success";
  const f = flag.toUpperCase();
  if (f === "HIGH" || f === "CRITICAL_HIGH") return "text-danger";
  if (f === "LOW" || f === "CRITICAL_LOW") return "text-warning";
  return "text-success";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Patient Context Tab ─────────────────────────────────

function PatientContextTab({ patientId }: { patientId: string }) {
  const { data, loading } = useQuery<PatientWorkspaceData>(CONSULTANT_PATIENT_WORKSPACE_QUERY, {
    variables: { patientId, limit: 5 },
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Loading patient...</div>;
  }

  const workspace = data?.consultantPatientWorkspace;
  if (!workspace) {
    return <p className="px-3 py-4 text-sm text-muted">Unable to load patient data.</p>;
  }

  const { patient, monitoring } = workspace;
  const glucose = monitoring?.latestGlucose;
  const trend = monitoring?.trend;
  const alerts = monitoring?.alerts ?? [];
  const unacknowledged = alerts.filter((a) => !(a as unknown as { acknowledgedAt: string | null }).acknowledgedAt);

  return (
    <div className="space-y-3 px-3 py-3">
      <div>
        <p className="text-base font-semibold text-text">{patient.fullName}</p>
        <p className="mt-0.5 text-xs text-muted">
          {patient.diabetesType ? `${patient.diabetesType} diabetes` : "Diabetes type not set"}
        </p>
      </div>

      {glucose ? (
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Latest glucose</p>
          <p className={cn("mt-1 text-lg font-bold tabular-nums", flagColor(glucose.flag))}>
            {formatGlucose(glucose.value, glucose.unit)}
          </p>
          <p className="text-xs text-muted">{timeAgo(glucose.recordedAt)}{glucose.flag ? ` · ${glucose.flag}` : ""}</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-xs text-muted">No glucose readings recorded yet.</p>
        </div>
      )}

      {trend && (trend.average7Days != null || trend.average30Days != null) ? (
        <div className="grid grid-cols-2 gap-2">
          {trend.average7Days != null ? (
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">7-day avg</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-text">{trend.average7Days.toFixed(1)}</p>
            </div>
          ) : null}
          {trend.average30Days != null ? (
            <div className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-muted">30-day avg</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-text">{trend.average30Days.toFixed(1)}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {unacknowledged.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-warning">Active alerts</p>
          {unacknowledged.slice(0, 3).map((alert) => (
            <div key={alert.id} className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-warning" />
              <p className="text-xs text-text">{alert.message}</p>
            </div>
          ))}
        </div>
      ) : null}

      {patient.allergies ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-danger">Allergies</p>
          <p className="mt-0.5 text-xs text-text">{patient.allergies}</p>
        </div>
      ) : null}

      {patient.currentMedications ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Medications</p>
          <p className="mt-0.5 text-xs text-text">{patient.currentMedications}</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── SOAP Tab ────────────────────────────────────────────

function SoapTab({
  encounterId,
  soapVersions,
  onSaved,
}: {
  encounterId: string;
  soapVersions: SoapVersion[];
  onSaved: () => void;
}) {
  const latest = soapVersions.length > 0 ? soapVersions[soapVersions.length - 1] : null;
  const [draft, setDraft] = useState<SoapDraft>({
    subjective: latest?.subjective ?? "",
    objective: latest?.objective ?? "",
    assessment: latest?.assessment ?? "",
    plan: latest?.plan ?? "",
  });
  const [saveSoap, { loading }] = useMutation(SAVE_SOAP_MUTATION);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (latest) {
      setDraft({
        subjective: latest.subjective ?? "",
        objective: latest.objective ?? "",
        assessment: latest.assessment ?? "",
        plan: latest.plan ?? "",
      });
    }
  }, [latest?.id]);

  function updateField(field: keyof SoapDraft, value: string) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await saveSoap({
        variables: {
          encounterId,
          data: {
            subjective: draft.subjective || null,
            objective: draft.objective || null,
            assessment: draft.assessment || null,
            plan: draft.plan || null,
          },
        },
      });
      setMessage({ tone: "success", text: "SOAP notes saved." });
      onSaved();
    } catch (err) {
      setMessage({ tone: "error", text: getGraphQLErrorMessage(err, "Unable to save notes.") });
    }
  }

  const fields: { key: keyof SoapDraft; label: string; placeholder: string }[] = [
    { key: "subjective", label: "Subjective", placeholder: "Patient's reported symptoms and concerns..." },
    { key: "objective", label: "Objective", placeholder: "Clinical findings, vitals, observations..." },
    { key: "assessment", label: "Assessment", placeholder: "Diagnosis and clinical impression..." },
    { key: "plan", label: "Plan", placeholder: "Treatment plan, prescriptions, follow-up..." },
  ];

  return (
    <form onSubmit={(e) => void handleSave(e)} className="space-y-3 px-3 py-3">
      {fields.map(({ key, label, placeholder }) => (
        <div key={key} className="space-y-1">
          <Label htmlFor={`soap-${key}`} className="text-xs font-semibold uppercase tracking-wider">
            {label}
          </Label>
          <Textarea
            id={`soap-${key}`}
            rows={2}
            placeholder={placeholder}
            value={draft[key]}
            onChange={(e) => updateField(key, e.target.value)}
            className="text-sm"
          />
        </div>
      ))}

      {message ? (
        <p className={cn(
          "rounded-lg border px-3 py-1.5 text-xs",
          message.tone === "success" ? "border-success/30 bg-success/5 text-success" : "border-danger/30 bg-danger/5 text-danger",
        )}>
          {message.text}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Save notes"}
        </Button>
        {latest ? (
          <span className="self-center text-[0.65rem] text-muted">v{latest.versionNumber}</span>
        ) : null}
      </div>
    </form>
  );
}

// ─── Quick Actions Tab ───────────────────────────────────

function carePlanTypeLabel(type: string) {
  return CARE_PLAN_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type.replace(/_/g, " ");
}

function carePlanStatusBadge(status: string) {
  const s = status.toUpperCase();
  if (s === "COMPLETED") return "border-success/30 bg-success/5 text-success";
  if (s === "CANCELLED") return "border-muted/30 bg-muted/5 text-muted";
  if (s === "IN_PROGRESS") return "border-primary/30 bg-primary/5 text-primary";
  return "border-warning/30 bg-warning/5 text-warning";
}

function ActionsTab({
  encounterId,
  observations,
  diagnoses,
  carePlanActions,
  onSaved,
  appointmentId,
}: {
  encounterId: string;
  observations: Encounter["observations"];
  diagnoses: Encounter["diagnoses"];
  carePlanActions: Encounter["carePlanActions"];
  onSaved: () => void;
  appointmentId: string;
}) {
  const [section, setSection] = useState<"vitals" | "diagnosis" | "careplan" | null>(null);

  return (
    <div className="space-y-3 px-3 py-3">
      {observations.length > 0 ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Recorded vitals</p>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {observations.map((obs) => (
              <div key={obs.id} className="rounded border border-border bg-background px-2 py-1.5">
                <p className="text-[0.6rem] font-medium uppercase text-muted">{obs.type.replace(/_/g, " ")}</p>
                <p className="text-sm font-semibold tabular-nums text-text">
                  {obs.valueNumeric != null ? obs.valueNumeric : obs.valueText}
                  {obs.unit ? <span className="ml-0.5 text-xs font-normal text-muted">{obs.unit}</span> : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {diagnoses.length > 0 ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Diagnoses</p>
          <div className="mt-1.5 space-y-1">
            {diagnoses.map((dx) => (
              <div key={dx.id} className="flex items-start gap-2 rounded border border-border bg-background px-2 py-1.5">
                <Stethoscope className="mt-0.5 size-3 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-text">{dx.description}</p>
                  {dx.code ? <p className="text-[0.6rem] text-muted">{dx.codeSystem}: {dx.code}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {carePlanActions.length > 0 ? (
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-muted">Care plan</p>
          <div className="mt-1.5 space-y-1">
            {carePlanActions.map((action) => (
              <div key={action.id} className="rounded border border-border bg-background px-2 py-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-text">{action.description}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[0.6rem] font-medium uppercase text-muted">{carePlanTypeLabel(action.type)}</span>
                      {action.targetDate ? (
                        <span className="flex items-center gap-0.5 text-[0.6rem] text-muted">
                          <CalendarClock className="size-2.5" />
                          {action.targetDate}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <span className={cn("shrink-0 rounded-full border px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase", carePlanStatusBadge(action.status))}>
                    {action.status.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <button
          type="button"
          onClick={() => setSection(section === "vitals" ? null : "vitals")}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text transition hover:bg-surface"
        >
          {section === "vitals" ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <Activity className="size-3.5 text-primary" />
          Record vitals
        </button>
        {section === "vitals" ? <AddVitalForm encounterId={encounterId} onSaved={onSaved} /> : null}

        <button
          type="button"
          onClick={() => setSection(section === "diagnosis" ? null : "diagnosis")}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text transition hover:bg-surface"
        >
          {section === "diagnosis" ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <Stethoscope className="size-3.5 text-primary" />
          Add diagnosis
        </button>
        {section === "diagnosis" ? <AddDiagnosisForm encounterId={encounterId} onSaved={onSaved} /> : null}

        <button
          type="button"
          onClick={() => setSection(section === "careplan" ? null : "careplan")}
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-text transition hover:bg-surface"
        >
          {section === "careplan" ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <ClipboardList className="size-3.5 text-primary" />
          Add care plan action
        </button>
        {section === "careplan" ? <AddCarePlanForm encounterId={encounterId} onSaved={onSaved} /> : null}
      </div>

      <div className="border-t border-border pt-3">
        <Button href={`/consultant/consultations/${appointmentId}`} variant="secondary" size="sm" fullWidth>
          Open full workspace
        </Button>
      </div>
    </div>
  );
}

function AddVitalForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [type, setType] = useState("BLOOD_GLUCOSE");
  const [value, setValue] = useState("");
  const [addObs, { loading }] = useMutation(ADD_OBSERVATION_MUTATION);
  const [error, setError] = useState<string | null>(null);

  const selectedOption = OBSERVATION_TYPE_OPTIONS.find((o) => o.value === type);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const numeric = Number(value);
    try {
      await addObs({
        variables: {
          encounterId,
          data: {
            type,
            valueNumeric: Number.isFinite(numeric) ? numeric : null,
            valueText: Number.isFinite(numeric) ? null : (value || null),
            unit: selectedOption?.unit || null,
          },
        },
      });
      setValue("");
      onSaved();
    } catch (err) {
      setError(getGraphQLErrorMessage(err, "Unable to record vital."));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="space-y-1">
        <Label htmlFor="vital-type" className="text-[0.65rem]">Type</Label>
        <select
          id="vital-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex h-9 w-full rounded-xl border border-border bg-background px-2 text-sm text-text outline-none focus:border-primary"
        >
          {OBSERVATION_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="vital-value" className="text-[0.65rem]">Value {selectedOption?.unit ? `(${selectedOption.unit})` : ""}</Label>
        <Input id="vital-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter value" className="h-9 text-sm" />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button type="submit" size="sm" disabled={loading || !value.trim()}>
        {loading ? "Saving..." : "Record"}
      </Button>
    </form>
  );
}

function AddDiagnosisForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [description, setDescription] = useState("");
  const [codeSystem, setCodeSystem] = useState("ICD-10");
  const [code, setCode] = useState("");
  const [addDx, { loading }] = useMutation(ADD_DIAGNOSIS_MUTATION);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addDx({
        variables: {
          encounterId,
          data: {
            description,
            codeSystem: codeSystem || null,
            code: code || null,
            isPrimary: false,
          },
        },
      });
      setDescription("");
      setCode("");
      onSaved();
    } catch (err) {
      setError(getGraphQLErrorMessage(err, "Unable to add diagnosis."));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="space-y-1">
        <Label htmlFor="dx-desc" className="text-[0.65rem]">Description</Label>
        <Input id="dx-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Type 2 diabetes mellitus" className="h-9 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="dx-system" className="text-[0.65rem]">Code system</Label>
          <select
            id="dx-system"
            value={codeSystem}
            onChange={(e) => setCodeSystem(e.target.value)}
            className="flex h-9 w-full rounded-xl border border-border bg-background px-2 text-sm text-text outline-none focus:border-primary"
          >
            {CODE_SYSTEM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="dx-code" className="text-[0.65rem]">Code</Label>
          <Input id="dx-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="E11.9" className="h-9 text-sm" />
        </div>
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button type="submit" size="sm" disabled={loading || !description.trim()}>
        {loading ? "Adding..." : "Add diagnosis"}
      </Button>
    </form>
  );
}

function AddCarePlanForm({ encounterId, onSaved }: { encounterId: string; onSaved: () => void }) {
  const [type, setType] = useState("MEDICATION");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [addAction, { loading }] = useMutation(CREATE_CARE_PLAN_MUTATION);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await addAction({
        variables: {
          encounterId,
          data: {
            type,
            description,
            targetDate: targetDate || null,
          },
        },
      });
      setDescription("");
      setTargetDate("");
      onSaved();
    } catch (err) {
      setError(getGraphQLErrorMessage(err, "Unable to add care plan action."));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="space-y-1">
        <Label htmlFor="cp-type" className="text-[0.65rem]">Type</Label>
        <select
          id="cp-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="flex h-9 w-full rounded-xl border border-border bg-background px-2 text-sm text-text outline-none focus:border-primary"
        >
          {CARE_PLAN_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="cp-desc" className="text-[0.65rem]">Description</Label>
        <Textarea
          id="cp-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Start metformin 500mg twice daily"
          className="text-sm"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="cp-date" className="text-[0.65rem]">Target date (optional)</Label>
        <Input id="cp-date" type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-9 text-sm" />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <Button type="submit" size="sm" disabled={loading || !description.trim()}>
        {loading ? "Adding..." : "Add action"}
      </Button>
    </form>
  );
}

// ─── Main Panel ──────────────────────────────────────────

export function VideoEncounterPanel({ appointmentId, patientId }: VideoEncounterPanelProps) {
  const [tab, setTab] = useState<Tab>("patient");
  const [encounterId, setEncounterId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const [startEncounter, { loading: starting }] = useMutation<StartEncounterData>(START_ENCOUNTER_MUTATION);
  const encounterQuery = useQuery<EncounterData>(ENCOUNTER_QUERY, {
    variables: { id: encounterId },
    skip: !encounterId,
    fetchPolicy: "cache-and-network",
    pollInterval: 30000,
  });
  const [finalizeEncounter, { loading: finalizing }] = useMutation(FINALIZE_ENCOUNTER_MUTATION);

  const encounter = encounterQuery.data?.encounter ?? null;
  const isFinalized = encounter?.status === "FINALIZED";

  const handleStart = useCallback(async () => {
    setStartError(null);
    try {
      const result = await startEncounter({ variables: { appointmentId } });
      const id = result.data?.startEncounter.encounter.id;
      if (id) setEncounterId(id);
    } catch (err) {
      const msg = getGraphQLErrorMessage(err, "");
      if (msg.toLowerCase().includes("already") || msg.toLowerCase().includes("exists")) {
        // Encounter already exists — try to find it via ID convention
        setStartError(null);
      } else {
        setStartError(msg || "Unable to start encounter.");
      }
    }
  }, [appointmentId, startEncounter]);

  const handleFinalize = useCallback(async () => {
    if (!encounterId) return;
    try {
      await finalizeEncounter({ variables: { encounterId } });
      void encounterQuery.refetch();
    } catch (err) {
      setStartError(getGraphQLErrorMessage(err, "Unable to finalize."));
    }
  }, [encounterId, finalizeEncounter, encounterQuery]);

  const handleRefetch = useCallback(() => {
    void encounterQuery.refetch();
  }, [encounterQuery]);

  const tabs: { key: Tab; label: string; icon: typeof FileText }[] = [
    { key: "patient", label: "Patient", icon: Stethoscope },
    { key: "soap", label: "SOAP", icon: FileText },
    { key: "actions", label: "Actions", icon: Activity },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex shrink-0 border-b border-border">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-medium transition",
              tab === key ? "border-b-2 border-primary bg-background text-primary" : "text-muted hover:bg-background hover:text-text",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "patient" ? (
          <PatientContextTab patientId={patientId} />
        ) : !encounterId ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <FileText className="size-8 text-muted/40" />
            <div>
              <p className="text-sm font-medium text-text">No encounter started</p>
              <p className="mt-1 text-xs text-muted">Start an encounter to take SOAP notes, record vitals, and add diagnoses during this consultation.</p>
            </div>
            {startError ? <p className="text-xs text-danger">{startError}</p> : null}
            <Button type="button" size="sm" onClick={() => void handleStart()} disabled={starting}>
              {starting ? "Starting..." : "Start encounter"}
            </Button>
          </div>
        ) : tab === "soap" ? (
          encounter ? (
            <div>
              {isFinalized ? (
                <div className="flex items-center gap-2 border-b border-success/20 bg-success/5 px-3 py-2 text-xs text-success">
                  <CheckCircle className="size-3.5" />
                  Encounter finalized — notes are locked.
                </div>
              ) : null}
              <SoapTab encounterId={encounterId} soapVersions={encounter.soapVersions} onSaved={handleRefetch} />
              {!isFinalized && encounter.soapVersions.length > 0 ? (
                <div className="border-t border-border px-3 py-3">
                  <Button type="button" size="sm" variant="secondary" fullWidth onClick={() => void handleFinalize()} disabled={finalizing}>
                    {finalizing ? "Finalizing..." : "Finalize encounter"}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Loading encounter...</div>
          )
        ) : tab === "actions" ? (
          encounter ? (
            <ActionsTab
              encounterId={encounterId}
              observations={encounter.observations}
              diagnoses={encounter.diagnoses}
              carePlanActions={encounter.carePlanActions}
              onSaved={handleRefetch}
              appointmentId={appointmentId}
            />
          ) : (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-muted"><Loader2 className="size-4 animate-spin" /> Loading encounter...</div>
          )
        ) : null}
      </div>
    </div>
  );
}
