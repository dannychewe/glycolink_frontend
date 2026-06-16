"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  FileText, Stethoscope, Activity, ListChecks, MessageSquare,
  CheckCircle, AlertCircle, Lock, Clock, ClipboardList, FlaskConical, Pill,
} from "lucide-react";
import {
  ADD_AMENDMENT_MUTATION,
  ADD_DIAGNOSIS_MUTATION,
  ADD_OBSERVATION_MUTATION,
  CARE_PLAN_TYPE_OPTIONS,
  CODE_SYSTEM_OPTIONS,
  CREATE_CARE_PLAN_MUTATION,
  ENCOUNTER_QUERY,
  FINALIZE_ENCOUNTER_MUTATION,
  OBSERVATION_TYPE_OPTIONS,
  SAVE_SOAP_MUTATION,
} from "@/lib/consultant/consultation-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { AppointmentPCQReview } from "@/components/consultant/pcq/AppointmentPCQReview";
import { EncounterLabOrders } from "@/components/consultant/labs/EncounterLabOrders";
import { EncounterPrescriptions } from "@/components/consultant/prescriptions/EncounterPrescriptions";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";

// ─── Types ───────────────────────────────────────────────

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

type Diagnosis = {
  id: string;
  codeSystem: string | null;
  code: string | null;
  description: string;
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
  type: string;
  description: string;
  targetDate: string | null;
  status: string;
};

type Amendment = {
  id: string;
  soapNoteVersionNumber: number;
  amendmentText: string;
  createdAt: string;
};

type Encounter = {
  id: string;
  appointmentId: string;
  patientId: string;
  encounterType: string | null;
  status: string;
  clinicalSummary: string | null;
  startedAt: string;
  endedAt: string | null;
  finalizedAt: string | null;
  soapVersions: SoapVersion[];
  diagnoses: Diagnosis[];
  observations: Observation[];
  carePlanActions: CarePlanAction[];
  amendments: Amendment[];
};

type AlertState = { type: "success" | "error"; message: string } | null;
type Tab = "soap" | "diagnoses" | "observations" | "careplan" | "amendments" | "pcq" | "labs" | "prescriptions";

// ─── Helpers ─────────────────────────────────────────────

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function useElapsedTimer(startedAt: string | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [startedAt]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn("flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success")}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── SOAP Tab ─────────────────────────────────────────────

function SoapTab({ encounter, onRefresh }: { encounter: Encounter; onRefresh: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [form, setForm] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [saveSoap, { loading }] = useMutation(SAVE_SOAP_MUTATION);

  const latestVersion = encounter.soapVersions.at(-1);

  useEffect(() => {
    if (latestVersion) {
      setForm({
        subjective: latestVersion.subjective ?? "",
        objective: latestVersion.objective ?? "",
        assessment: latestVersion.assessment ?? "",
        plan: latestVersion.plan ?? "",
      });
    }
  }, [latestVersion]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await saveSoap({ variables: { encounterId: encounter.id, data: form } });
      await onRefresh();
      setAlert({ type: "success", message: "SOAP notes saved." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to save SOAP notes.") });
    }
  }

  const isFinalized = encounter.status.toUpperCase() === "FINALIZED";

  return (
    <div className="space-y-5">
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {latestVersion ? (
        <div className="flex items-center gap-2 text-xs text-muted">
          <Clock className="size-3" />
          Version {latestVersion.versionNumber} · Saved {formatTime(latestVersion.createdAt)}
        </div>
      ) : null}

      <form onSubmit={(e) => void handleSave(e)} className="space-y-4">
        {(["subjective", "objective", "assessment", "plan"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={`soap-${field}`} className="capitalize">{field}</Label>
            <Textarea
              id={`soap-${field}`}
              rows={3}
              placeholder={`Enter ${field} notes...`}
              value={form[field]}
              disabled={isFinalized}
              onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
            />
          </div>
        ))}

        {!isFinalized ? (
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? "Saving..." : `Save SOAP${latestVersion ? " (new version)" : ""}`}
          </Button>
        ) : null}
      </form>

      {encounter.soapVersions.length > 1 ? (
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-sm font-medium text-primary hover:underline"
          >
            {showHistory ? "Hide" : "Show"} version history ({encounter.soapVersions.length} versions)
          </button>
          {showHistory ? (
            <div className="mt-3 space-y-2">
              {[...encounter.soapVersions].reverse().map((v) => (
                <div key={v.id} className="rounded-xl border border-border bg-background px-4 py-3 text-xs">
                  <p className="font-medium text-text">Version {v.versionNumber} · {formatTime(v.createdAt)}</p>
                  {v.subjective ? <p className="mt-1 text-muted"><strong>S:</strong> {v.subjective}</p> : null}
                  {v.assessment ? <p className="text-muted"><strong>A:</strong> {v.assessment}</p> : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Diagnoses Tab ────────────────────────────────────────

function DiagnosesTab({ encounter, onRefresh }: { encounter: Encounter; onRefresh: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ codeSystem: "ICD-10", code: "", description: "", isPrimary: false });
  const [addDiagnosis, { loading }] = useMutation(ADD_DIAGNOSIS_MUTATION);
  const isFinalized = encounter.status.toUpperCase() === "FINALIZED";

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await addDiagnosis({ variables: { encounterId: encounter.id, data: { ...form, code: form.code || undefined } } });
      setForm({ codeSystem: "ICD-10", code: "", description: "", isPrimary: false });
      await onRefresh();
      setAlert({ type: "success", message: "Diagnosis added." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to add diagnosis.") });
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {encounter.diagnoses.length > 0 ? (
        <div className="space-y-2">
          {encounter.diagnoses.map((dx) => (
            <div key={dx.id} className={cn(
              "flex items-start gap-3 rounded-xl border-l-4 bg-surface px-4 py-3 shadow-subtle",
              dx.isPrimary ? "border-l-primary/60" : "border-l-border",
            )}>
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-text">{dx.description}</p>
                  {dx.isPrimary ? <Badge variant="primary">Primary</Badge> : null}
                </div>
                {dx.code ? (
                  <p className="text-xs text-muted">{dx.codeSystem} · {dx.code}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No diagnoses recorded yet.</p>
      )}

      {!isFinalized ? (
        <form onSubmit={(e) => void handleAdd(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold text-text">Add Diagnosis</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dxCodeSystem">Code system</Label>
              <select
                id="dxCodeSystem"
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.codeSystem}
                onChange={(e) => setForm((p) => ({ ...p, codeSystem: e.target.value }))}
              >
                {CODE_SYSTEM_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dxCode">Code (optional)</Label>
              <Input id="dxCode" placeholder="e.g. E11.9" value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="dxDescription">Description <span className="text-danger">*</span></Label>
              <Input id="dxDescription" placeholder="e.g. Type 2 diabetes mellitus without complications" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((p) => ({ ...p, isPrimary: e.target.checked }))} />
            Mark as primary diagnosis
          </label>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Adding..." : "Add Diagnosis"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

// ─── Observations Tab ─────────────────────────────────────

function ObservationsTab({ encounter, onRefresh }: { encounter: Encounter; onRefresh: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ type: "BLOOD_PRESSURE", valueNumeric: "", valueText: "", unit: "mmHg" });
  const [addObservation, { loading }] = useMutation(ADD_OBSERVATION_MUTATION);
  const isFinalized = encounter.status.toUpperCase() === "FINALIZED";

  const selectedObsType = OBSERVATION_TYPE_OPTIONS.find((o) => o.value === form.type);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await addObservation({
        variables: {
          encounterId: encounter.id,
          data: {
            type: form.type,
            valueNumeric: form.valueNumeric ? Number(form.valueNumeric) : undefined,
            valueText: form.valueText || undefined,
            unit: form.unit || undefined,
          },
        },
      });
      setForm({ type: "BLOOD_PRESSURE", valueNumeric: "", valueText: "", unit: "mmHg" });
      await onRefresh();
      setAlert({ type: "success", message: "Observation recorded." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to record observation.") });
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {encounter.observations.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {encounter.observations.map((obs) => (
            <div key={obs.id} className="rounded-xl border border-border bg-surface px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{obs.type.replace(/_/g, " ")}</p>
              <p className="mt-1 text-lg font-semibold text-text">
                {obs.valueNumeric != null ? obs.valueNumeric : obs.valueText ?? "—"}
                {obs.unit ? <span className="ml-1 text-sm font-normal text-muted">{obs.unit}</span> : null}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No observations recorded yet.</p>
      )}

      {!isFinalized ? (
        <form onSubmit={(e) => void handleAdd(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold text-text">Record Observation</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="obsType">Type</Label>
              <select
                id="obsType"
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.type}
                onChange={(e) => {
                  const opt = OBSERVATION_TYPE_OPTIONS.find((o) => o.value === e.target.value);
                  setForm((p) => ({ ...p, type: e.target.value, unit: opt?.unit ?? "" }));
                }}
              >
                {OBSERVATION_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="obsValue">Value</Label>
              <Input
                id="obsValue"
                type="number"
                step="any"
                placeholder={selectedObsType?.unit ?? ""}
                value={form.valueNumeric}
                onChange={(e) => setForm((p) => ({ ...p, valueNumeric: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="obsUnit">Unit</Label>
              <Input id="obsUnit" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="obsText">Text value (optional)</Label>
              <Input id="obsText" placeholder="e.g. 120/80" value={form.valueText} onChange={(e) => setForm((p) => ({ ...p, valueText: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Recording..." : "Record Observation"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

// ─── Care Plan Tab ────────────────────────────────────────

function CarePlanTab({ encounter, onRefresh }: { encounter: Encounter; onRefresh: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ type: "MEDICATION", description: "", targetDate: "" });
  const [createCarePlan, { loading }] = useMutation(CREATE_CARE_PLAN_MUTATION);
  const isFinalized = encounter.status.toUpperCase() === "FINALIZED";

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await createCarePlan({
        variables: {
          encounterId: encounter.id,
          data: { type: form.type, description: form.description, targetDate: form.targetDate || undefined },
        },
      });
      setForm({ type: "MEDICATION", description: "", targetDate: "" });
      await onRefresh();
      setAlert({ type: "success", message: "Care plan action added." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to add care plan action.") });
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {encounter.carePlanActions.length > 0 ? (
        <div className="space-y-2">
          {encounter.carePlanActions.map((action) => (
            <div key={action.id} className="flex items-start gap-3 rounded-xl border-l-4 border-l-primary/40 bg-surface px-4 py-3 shadow-subtle">
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text">{action.description}</p>
                  <Badge variant="secondary">{action.type.replace(/_/g, " ")}</Badge>
                  <Badge variant={action.status.toUpperCase() === "COMPLETED" ? "success" : "secondary"}>
                    {action.status}
                  </Badge>
                </div>
                {action.targetDate ? (
                  <p className="text-xs text-muted">Target: {action.targetDate}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No care plan actions yet.</p>
      )}

      {!isFinalized ? (
        <form onSubmit={(e) => void handleAdd(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-semibold text-text">Add Care Plan Action</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cpType">Type</Label>
              <select
                id="cpType"
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              >
                {CARE_PLAN_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpTargetDate">Target date (optional)</Label>
              <Input id="cpTargetDate" type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cpDescription">Description <span className="text-danger">*</span></Label>
              <Textarea id="cpDescription" rows={2} placeholder="Describe the action..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required />
            </div>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={loading}>
            {loading ? "Adding..." : "Add Action"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

// ─── Amendments Tab ───────────────────────────────────────

function AmendmentsTab({ encounter, onRefresh }: { encounter: Encounter; onRefresh: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ amendmentText: "" });
  const [addAmendment, { loading }] = useMutation(ADD_AMENDMENT_MUTATION);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      await addAmendment({
        variables: {
          encounterId: encounter.id,
          data: { amendmentText: form.amendmentText },
        },
      });
      setForm({ amendmentText: "" });
      await onRefresh();
      setAlert({ type: "success", message: "Amendment added." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to add amendment.") });
    }
  }

  return (
    <div className="space-y-5">
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <p className="text-sm text-muted">
        Amendments allow corrections to finalized encounter notes without altering the original record.
      </p>

      {encounter.amendments.length > 0 ? (
        <div className="space-y-2">
          {[...encounter.amendments].reverse().map((am) => (
            <div key={am.id} className="rounded-xl border-l-4 border-l-primary/40 bg-surface px-4 py-3 shadow-subtle">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">SOAP v{am.soapNoteVersionNumber}</Badge>
                <span className="text-xs text-muted">{formatTime(am.createdAt)}</span>
              </div>
              <p className="mt-1.5 text-sm text-text">{am.amendmentText}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted">No amendments recorded yet.</p>
      )}

      <form onSubmit={(e) => void handleAdd(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-semibold text-text">Add Amendment</p>
        <p className="text-xs text-muted">
          The amendment is recorded against the latest finalized SOAP note version.
        </p>
        <div className="space-y-2">
          <Label htmlFor="amendText">Amendment <span className="text-danger">*</span></Label>
          <Textarea
            id="amendText"
            rows={4}
            placeholder="Describe the correction or clarification..."
            value={form.amendmentText}
            onChange={(e) => setForm((p) => ({ ...p, amendmentText: e.target.value }))}
            required
          />
        </div>
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Saving..." : "Save Amendment"}
        </Button>
      </form>
    </div>
  );
}

// ─── Main workspace ───────────────────────────────────────

export function GraphqlEncounterWorkspace({ encounterId }: { encounterId: string }) {
  const [activeTab, setActiveTab] = useState<Tab>("soap");
  const [finalizeAlert, setFinalizeAlert] = useState<AlertState>(null);

  const { data, loading, error, refetch } = useQuery<{ encounter: Encounter }>(ENCOUNTER_QUERY, {
    variables: { id: encounterId },
    fetchPolicy: "network-only",
  });

  const [finalizeEncounter, { loading: finalizing }] = useMutation(FINALIZE_ENCOUNTER_MUTATION);
  const elapsed = useElapsedTimer(data?.encounter?.startedAt);

  const encounter = data?.encounter;
  const isFinalized = encounter?.status.toUpperCase() === "FINALIZED";

  async function handleFinalize() {
    setFinalizeAlert(null);
    try {
      await finalizeEncounter({ variables: { encounterId } });
      await refetch();
      setFinalizeAlert({ type: "success", message: "Encounter finalized. You can now issue prescriptions and lab orders from the appointment." });
    } catch (error) {
      setFinalizeAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to finalize encounter.") });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-64 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        {getGraphQLErrorMessage(error, "Unable to load encounter. It may not exist or you may not have access.")}
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "soap", label: "SOAP Notes", icon: <FileText className="size-3.5" /> },
    { key: "diagnoses", label: "Diagnoses", icon: <Stethoscope className="size-3.5" /> },
    { key: "observations", label: "Observations", icon: <Activity className="size-3.5" /> },
    { key: "careplan", label: "Care Plan", icon: <ListChecks className="size-3.5" /> },
    { key: "pcq", label: "PCQ", icon: <ClipboardList className="size-3.5" /> },
    { key: "labs", label: "Labs", icon: <FlaskConical className="size-3.5" /> },
    { key: "prescriptions", label: "Prescriptions", icon: <Pill className="size-3.5" /> },
    ...(isFinalized ? [{ key: "amendments" as Tab, label: "Amendments", icon: <MessageSquare className="size-3.5" /> }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className={cn(
        "rounded-2xl p-5 text-white shadow-soft sm:p-6",
        isFinalized ? "bg-gradient-to-br from-success to-emerald-600" : "bg-gradient-to-br from-primary to-blue-500",
      )}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-white/80">
              {isFinalized ? <Lock className="size-4" /> : <Clock className="size-4" />}
              {isFinalized ? "Finalized encounter" : `Session ${elapsed}`}
            </div>
            <p className="text-lg font-semibold">
              Patient {encounter.patientId.slice(0, 8)}…
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
                {encounter.status}
              </span>
              {encounter.encounterType ? (
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs capitalize">
                  {encounter.encounterType.replace(/_/g, " ").toLowerCase()}
                </span>
              ) : null}
              <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs">
                Started {formatTime(encounter.startedAt)}
              </span>
            </div>
          </div>

          {!isFinalized ? (
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={finalizing}
                onClick={() => void handleFinalize()}
                className="bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                {finalizing ? "Finalizing..." : "Finalize Encounter"}
              </Button>
            </div>
          ) : (
            <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 text-sm">
              <CheckCircle className="size-4" />
              {encounter.finalizedAt ? formatTime(encounter.finalizedAt) : "Finalized"}
            </div>
          )}
        </div>
      </div>

      <InlineAlert alert={finalizeAlert} onDismiss={() => setFinalizeAlert(null)} />

      {isFinalized ? (
        <div className="rounded-2xl border border-success/25 bg-success/5 px-4 py-3.5 text-sm text-success">
          This encounter is finalized. You can now issue prescriptions and lab orders from the{" "}
          <a href="/consultant/appointments" className="font-medium underline">appointments page</a>.
          Use the Amendments tab to add corrections to these notes.
        </div>
      ) : null}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-1 pb-3 text-sm font-medium transition mr-4",
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-text",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "soap" ? <SoapTab encounter={encounter} onRefresh={() => void refetch()} /> : null}
        {activeTab === "diagnoses" ? <DiagnosesTab encounter={encounter} onRefresh={() => void refetch()} /> : null}
        {activeTab === "observations" ? <ObservationsTab encounter={encounter} onRefresh={() => void refetch()} /> : null}
        {activeTab === "careplan" ? <CarePlanTab encounter={encounter} onRefresh={() => void refetch()} /> : null}
        {activeTab === "pcq" ? <AppointmentPCQReview appointmentId={encounter.appointmentId} /> : null}
        {activeTab === "labs" ? <EncounterLabOrders encounterId={encounter.id} isFinalized={isFinalized} /> : null}
        {activeTab === "prescriptions" ? <EncounterPrescriptions encounterId={encounter.id} isFinalized={isFinalized} /> : null}
        {activeTab === "amendments" && isFinalized ? <AmendmentsTab encounter={encounter} onRefresh={() => void refetch()} /> : null}
      </div>
    </div>
  );
}
