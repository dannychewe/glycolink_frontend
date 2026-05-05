"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Plus, Trash2, CheckCircle, AlertCircle, ChevronDown, ChevronRight, Pill } from "lucide-react";
import {
  CREATE_PRESCRIPTION_MUTATION,
  DRUG_SUGGESTIONS,
  FREQUENCY_OPTIONS,
  PRESCRIPTIONS_BY_ENCOUNTER_QUERY,
  REVOKE_PRESCRIPTION_MUTATION,
  ROUTE_OPTIONS,
} from "@/lib/consultant/prescriptions-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type PrescriptionItem = {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  status: string;
};

type Prescription = {
  id: string;
  status: string;
  issuedAt: string;
  revokedAt: string | null;
  items: PrescriptionItem[];
};

type ItemInput = {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  instructions: string;
};

type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusVariant(status: string): "success" | "danger" | "secondary" {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "REVOKED") return "danger";
  return "secondary";
}

function formatFrequency(value: string) {
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ").toLowerCase();
}

function formatRoute(value: string | null) {
  if (!value) return null;
  return ROUTE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Revoke Panel ─────────────────────────────────────────

function RevokePanel({
  prescriptionId,
  encounterId,
  onDone,
}: {
  prescriptionId: string;
  encounterId: string;
  onDone: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [reason, setReason] = useState("");
  const [revoke, { loading }] = useMutation(REVOKE_PRESCRIPTION_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!reason.trim()) {
      setAlert({ type: "error", message: "A reason is required to revoke a prescription." });
      return;
    }
    setAlert(null);
    try {
      await revoke({
        variables: { prescriptionId, reason: reason.trim() },
        refetchQueries: [
          { query: PRESCRIPTIONS_BY_ENCOUNTER_QUERY, variables: { encounterId } },
        ],
      });
      setAlert({ type: "success", message: "Prescription revoked." });
      setTimeout(onDone, 1000);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to revoke prescription.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mt-3 space-y-3 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-danger">Revoke Prescription</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <div className="space-y-1.5">
        <Label htmlFor={`revoke-reason-${prescriptionId}`}>
          Reason <span className="text-danger">*</span>
        </Label>
        <Textarea
          id={`revoke-reason-${prescriptionId}`}
          rows={2}
          placeholder="State the clinical reason for revocation..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-danger px-3 text-xs font-medium text-white transition hover:bg-danger/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading ? "Revoking..." : "Confirm Revoke"}
        </button>
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancel</Button>
      </div>
    </form>
  );
}

// ─── Prescription Card ────────────────────────────────────

function PrescriptionCard({
  prescription,
  encounterId,
}: {
  prescription: Prescription;
  encounterId: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showRevoke, setShowRevoke] = useState(false);
  const isActive = prescription.status.toUpperCase() === "ACTIVE";

  return (
    <div className={cn(
      "rounded-xl border bg-background",
      isActive ? "border-success/30" : "border-border",
    )}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text">
              {prescription.items.length} item{prescription.items.length !== 1 ? "s" : ""}
            </p>
            <Badge variant={statusVariant(prescription.status)}>{prescription.status}</Badge>
          </div>
          <p className="text-xs text-muted">
            Issued {formatDate(prescription.issuedAt)}
            {prescription.revokedAt ? ` · Revoked ${formatDate(prescription.revokedAt)}` : ""}
          </p>
        </div>
        {expanded ? <ChevronDown className="size-4 text-muted" /> : <ChevronRight className="size-4 text-muted" />}
      </button>

      {expanded ? (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          {prescription.items.map((item) => (
            <div key={item.id} className="rounded-lg border border-border bg-surface px-3 py-2.5 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text">{item.drugName}</p>
                {item.route ? (
                  <span className="shrink-0 text-xs text-muted">{formatRoute(item.route)}</span>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                <span className="font-medium text-text">{item.dosage}</span>
                <span>{formatFrequency(item.frequency)}</span>
                {item.duration ? <span>for {item.duration}</span> : null}
              </div>
              {item.instructions ? (
                <p className="text-xs text-muted italic">{item.instructions}</p>
              ) : null}
            </div>
          ))}

          {isActive ? (
            <div className="pt-1">
              {showRevoke ? (
                <RevokePanel
                  prescriptionId={prescription.id}
                  encounterId={encounterId}
                  onDone={() => setShowRevoke(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowRevoke(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-danger/30 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/5"
                >
                  <ChevronRight className="size-3.5" />
                  Revoke Prescription
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─── Create Prescription Form ─────────────────────────────

const emptyItem = (): ItemInput => ({
  drugName: "",
  dosage: "",
  frequency: "ONCE_DAILY",
  duration: "",
  route: "ORAL",
  instructions: "",
});

function CreatePrescriptionForm({
  encounterId,
  onCreated,
}: {
  encounterId: string;
  onCreated: () => void;
}) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [items, setItems] = useState<ItemInput[]>([emptyItem()]);
  const [createPrescription, { loading }] = useMutation(CREATE_PRESCRIPTION_MUTATION);

  function updateItem(idx: number, field: keyof ItemInput, value: string) {
    setItems((p) => p.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function addItem() {
    setItems((p) => [...p, emptyItem()]);
  }

  function removeItem(idx: number) {
    setItems((p) => p.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const valid = items.filter((item) => item.drugName.trim() && item.dosage.trim());
    if (valid.length === 0) {
      setAlert({ type: "error", message: "Add at least one medication with a drug name and dosage." });
      return;
    }
    setAlert(null);
    try {
      await createPrescription({
        variables: {
          encounterId,
          items: valid.map((item) => ({
            drugName: item.drugName.trim(),
            dosage: item.dosage.trim(),
            frequency: item.frequency,
            duration: item.duration.trim() || undefined,
            route: item.route || undefined,
            instructions: item.instructions.trim() || undefined,
          })),
        },
        refetchQueries: [
          { query: PRESCRIPTIONS_BY_ENCOUNTER_QUERY, variables: { encounterId } },
        ],
      });
      setItems([emptyItem()]);
      setAlert({ type: "success", message: "Prescription created." });
      setTimeout(onCreated, 800);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Failed to create prescription.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-semibold text-text">New Prescription</p>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted">Item {idx + 1}</p>
              {items.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-muted hover:text-danger transition"
                  aria-label="Remove item"
                >
                  <Trash2 className="size-3.5" />
                </button>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor={`drug-${idx}`}>Drug name <span className="text-danger">*</span></Label>
                <Input
                  id={`drug-${idx}`}
                  list={`drug-suggestions-${idx}`}
                  placeholder="e.g. Metformin"
                  value={item.drugName}
                  onChange={(e) => updateItem(idx, "drugName", e.target.value)}
                  required
                />
                <datalist id={`drug-suggestions-${idx}`}>
                  {DRUG_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`dosage-${idx}`}>Dosage <span className="text-danger">*</span></Label>
                <Input
                  id={`dosage-${idx}`}
                  placeholder="e.g. 500mg"
                  value={item.dosage}
                  onChange={(e) => updateItem(idx, "dosage", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`frequency-${idx}`}>Frequency</Label>
                <select
                  id={`frequency-${idx}`}
                  value={item.frequency}
                  onChange={(e) => updateItem(idx, "frequency", e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {FREQUENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`route-${idx}`}>Route</Label>
                <select
                  id={`route-${idx}`}
                  value={item.route}
                  onChange={(e) => updateItem(idx, "route", e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {ROUTE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`duration-${idx}`}>Duration (optional)</Label>
                <Input
                  id={`duration-${idx}`}
                  placeholder="e.g. 30 days"
                  value={item.duration}
                  onChange={(e) => updateItem(idx, "duration", e.target.value)}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor={`instructions-${idx}`}>Instructions (optional)</Label>
                <Input
                  id={`instructions-${idx}`}
                  placeholder="e.g. Take with food"
                  value={item.instructions}
                  onChange={(e) => updateItem(idx, "instructions", e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Plus className="size-4" />
          Add medication
        </button>
      </div>

      <Button type="submit" variant="primary" size="sm" disabled={loading}>
        {loading ? "Creating..." : "Create Prescription"}
      </Button>
    </form>
  );
}

// ─── Main Component ───────────────────────────────────────

export function EncounterPrescriptions({
  encounterId,
  isFinalized,
}: {
  encounterId: string;
  isFinalized: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  const { data, loading, error } = useQuery<{ prescriptionsByEncounter: Prescription[] }>(
    PRESCRIPTIONS_BY_ENCOUNTER_QUERY,
    { variables: { encounterId }, fetchPolicy: "network-only" },
  );

  const prescriptions = data?.prescriptionsByEncounter ?? [];

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="h-16 animate-pulse rounded-xl bg-border/40" />
        <div className="h-16 animate-pulse rounded-xl bg-border/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load prescriptions.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {prescriptions.length > 0 ? (
        <div className="space-y-2">
          {prescriptions.map((rx) => (
            <PrescriptionCard key={rx.id} prescription={rx} encounterId={encounterId} />
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted">
          <Pill className="size-5 shrink-0 text-muted/50" />
          No prescriptions issued for this encounter yet.
        </div>
      )}

      {isFinalized ? (
        showForm ? (
          <CreatePrescriptionForm
            encounterId={encounterId}
            onCreated={() => setShowForm(false)}
          />
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            <Plus className="size-4" />
            New Prescription
          </Button>
        )
      ) : (
        <p className="text-xs text-muted">
          Prescriptions can only be issued after the encounter is finalized.
        </p>
      )}
    </div>
  );
}
