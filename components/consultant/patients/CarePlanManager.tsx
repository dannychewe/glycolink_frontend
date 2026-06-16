"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import { AlertCircle, CheckCircle, ClipboardPlus, Plus, X } from "lucide-react";
import {
  ADD_PATIENT_CARE_PLAN_ACTION_MUTATION,
  CREATE_PATIENT_CARE_PLAN_MUTATION,
  mapWorkspaceError,
  type CarePlanStatus,
  type WorkspaceOngoingCarePlan,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

type CarePlanManagerProps = Readonly<{
  patientId: string;
  carePlans: WorkspaceOngoingCarePlan[];
  onChanged: () => void;
}>;

const inputClass =
  "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function statusVariant(status: string | null | undefined): "success" | "warning" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "success";
  if (s === "paused") return "warning";
  return "secondary";
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function Alert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── Add-action form (inline, per existing plan) ──────────

function AddActionForm({
  carePlanId,
  onDone,
}: {
  carePlanId: string;
  onDone: () => void;
}) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addAction, { loading }] = useMutation(ADD_PATIENT_CARE_PLAN_ACTION_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!type.trim() || !description.trim()) {
      setError("Action type and description are required.");
      return;
    }
    try {
      await addAction({
        variables: {
          carePlanId,
          data: {
            type: type.trim(),
            description: description.trim(),
            targetDate: targetDate || undefined,
          },
        },
      });
      onDone();
    } catch (err) {
      setError(mapWorkspaceError(err));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-xl border border-border bg-background p-3">
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Action type (e.g. lab, lifestyle)" value={type} onChange={(e) => setType(e.target.value)} />
        <input type="date" className={inputClass} value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
      </div>
      <Textarea
        placeholder="What should happen?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="min-h-[60px] text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Adding…" : "Add action"}
        </Button>
      </div>
    </form>
  );
}

// ─── Create-plan form ─────────────────────────────────────

function CreatePlanForm({
  patientId,
  onClose,
  onCreated,
}: {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<CarePlanStatus>("active");
  const [error, setError] = useState<string | null>(null);
  const [createPlan, { loading }] = useMutation(CREATE_PATIENT_CARE_PLAN_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    try {
      await createPlan({
        variables: {
          patientId,
          data: {
            title: title.trim(),
            summary: summary.trim() || undefined,
            status,
          },
        },
      });
      onCreated();
    } catch (err) {
      setError(mapWorkspaceError(err));
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3 rounded-xl border border-border bg-background p-4">
      {error ? <p className="text-xs text-danger">{error}</p> : null}
      <div className="space-y-1.5">
        <Label htmlFor="cp-title">Title <span className="text-danger">*</span></Label>
        <Input id="cp-title" placeholder="e.g. 90-day glucose stabilization" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-summary">Summary</Label>
        <Textarea
          id="cp-summary"
          placeholder="Goals and overview of this ongoing plan…"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="min-h-[64px] text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cp-status">Status</Label>
        <select id="cp-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as CarePlanStatus)}>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Creating…" : "Create care plan"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Main ─────────────────────────────────────────────────

export function CarePlanManager({ patientId, carePlans, onChanged }: CarePlanManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2">
          <ClipboardPlus className="size-5 text-primary" />
          Ongoing Care Plans
        </CardTitle>
        <Button variant={showCreate ? "secondary" : "primary"} size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="size-4" />
          {showCreate ? "Cancel" : "New plan"}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert alert={alert} onDismiss={() => setAlert(null)} />

        {showCreate ? (
          <CreatePlanForm
            patientId={patientId}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              setAlert({ type: "success", message: "Care plan created." });
              onChanged();
            }}
          />
        ) : null}

        {carePlans.length === 0 && !showCreate ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            No ongoing care plans yet. Create one to track care that continues between appointments.
          </p>
        ) : null}

        {carePlans.map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-text">{plan.title}</p>
                {plan.summary ? <p className="text-sm leading-6 text-muted">{plan.summary}</p> : null}
              </div>
              <Badge variant={statusVariant(plan.status)}>{(plan.status ?? "active").toString()}</Badge>
            </div>

            {plan.actions.length > 0 ? (
              <ul className="mt-3 space-y-2 border-t border-border pt-3">
                {plan.actions.map((action) => (
                  <li key={action.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-text">
                      {action.type ? <span className="font-medium capitalize">{action.type}: </span> : null}
                      {action.description}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {action.targetDate ? <span>Due {formatDate(action.targetDate)}</span> : null}
                      <Badge variant={statusVariant(action.status)}>{(action.status ?? "active").toString()}</Badge>
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-3">
              {addingTo === plan.id ? (
                <AddActionForm
                  carePlanId={plan.id}
                  onDone={() => {
                    setAddingTo(null);
                    setAlert({ type: "success", message: "Action added to care plan." });
                    onChanged();
                  }}
                />
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setAddingTo(plan.id)}>
                  <Plus className="size-4" />
                  Add action
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
