"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import { AlertTriangle, CheckCircle2, Pill, RefreshCw, X } from "lucide-react";
import {
  REVOKE_PRESCRIPTION_MUTATION,
  RENEW_PRESCRIPTION_MUTATION,
} from "@/lib/consultant/prescriptions-graphql";
import type {
  WorkspacePrescription,
  WorkspacePrescriptionItem,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusVariant(
  status: string | null,
): "success" | "warning" | "danger" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (["issued", "active"].includes(s)) return "success";
  if (["revoked", "expired"].includes(s)) return "danger";
  return "secondary";
}

function isRevocable(status: string | null) {
  return (status ?? "").toLowerCase() === "issued";
}

function MedicationRow({ item }: { item: WorkspacePrescriptionItem }) {
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-text">{item.drugName}</p>
        <p className="mt-0.5 text-xs text-muted">
          {[item.dosage, item.frequency, item.route]
            .filter(Boolean)
            .join(" · ")}
          {item.duration ? ` — ${item.duration} days` : ""}
        </p>
        {item.instructions ? (
          <p className="mt-0.5 text-xs text-muted">{item.instructions}</p>
        ) : null}
      </div>
      <Badge className="rounded-md tracking-normal" variant={statusVariant(item.status)}>
        {titleCase(item.status)}
      </Badge>
    </li>
  );
}

function RevokeModal({
  prescription,
  onClose,
  onRevoked,
}: {
  prescription: WorkspacePrescription;
  onClose: () => void;
  onRevoked: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [revoke, { loading }] = useMutation(REVOKE_PRESCRIPTION_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || !reason.trim()) return;
    setError(null);
    try {
      await revoke({
        variables: {
          prescriptionId: prescription.id,
          reason: reason.trim(),
        },
      });
      onRevoked();
      onClose();
    } catch {
      setError("Unable to revoke this prescription. Please try again.");
    }
  }

  return (
    <DetailModal
      title="Discontinue prescription"
      className="sm:max-w-md"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="revoke-prescription-form"
            size="sm"
            variant="danger"
            disabled={loading || !reason.trim()}
          >
            <AlertTriangle className="size-4" />
            {loading ? "Revoking..." : "Discontinue"}
          </Button>
        </div>
      }
    >
      <form
        id="revoke-prescription-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        <div className="border border-border p-3 text-sm">
          <p className="font-medium text-ink">
            Issued {formatDate(prescription.issuedAt)}
          </p>
          <ul className="mt-2 space-y-1">
            {prescription.items.map((it) => (
              <li key={it.id} className="text-xs text-muted">
                {it.drugName}
                {it.dosage ? ` — ${it.dosage}` : ""}
              </li>
            ))}
          </ul>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor="revoke-reason">
            Reason <span className="text-danger">*</span>
          </Label>
          <Input
            id="revoke-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Adverse reaction, switched to alternative"
            disabled={loading}
            required
          />
        </div>
      </form>
    </DetailModal>
  );
}

function RenewModal({
  prescription,
  onClose,
  onRenewed,
}: {
  prescription: WorkspacePrescription;
  onClose: () => void;
  onRenewed: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [renew, { loading }] = useMutation(RENEW_PRESCRIPTION_MUTATION);

  async function handleRenew() {
    if (loading) return;
    setError(null);
    try {
      await renew({
        variables: { prescriptionId: prescription.id },
      });
      onRenewed();
      onClose();
    } catch {
      setError("Unable to renew this prescription. Please try again.");
    }
  }

  return (
    <DetailModal
      title="Renew prescription"
      className="sm:max-w-md"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={() => void handleRenew()}
          >
            <RefreshCw className="size-4" />
            {loading ? "Renewing..." : "Renew prescription"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          This will create a new prescription with the same medications. The
          original prescription will remain in history.
        </p>
        <div className="border border-border p-3 text-sm">
          <p className="font-medium text-ink">
            Issued {formatDate(prescription.issuedAt)}
          </p>
          <ul className="mt-2 space-y-1">
            {prescription.items.map((it) => (
              <li key={it.id} className="text-xs text-muted">
                {it.drugName}
                {it.dosage ? ` — ${it.dosage}` : ""}
                {it.frequency ? `, ${it.frequency}` : ""}
              </li>
            ))}
          </ul>
        </div>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>
    </DetailModal>
  );
}

export function PatientPrescriptionsTab({
  prescriptions,
  onChanged,
}: Readonly<{
  prescriptions: WorkspacePrescription[];
  onChanged: () => void;
}>) {
  const [filter, setFilter] = useState("all");
  const [revoking, setRevoking] = useState<WorkspacePrescription | null>(null);
  const [renewing, setRenewing] = useState<WorkspacePrescription | null>(null);

  const visible = prescriptions.filter((p) => {
    if (filter === "all") return true;
    return (p.status ?? "").toLowerCase() === filter;
  });

  const issuedCount = prescriptions.filter(
    (p) => (p.status ?? "").toLowerCase() === "issued",
  ).length;
  const revokedCount = prescriptions.filter(
    (p) => (p.status ?? "").toLowerCase() === "revoked",
  ).length;

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <Pill className="size-4 text-primary" />
          Prescriptions
          <span className="text-xs font-medium tabular-nums text-muted">
            {prescriptions.length}
          </span>
        </h2>
        <Select
          aria-label="Filter prescriptions"
          className="w-40"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          options={[
            { value: "all", label: `All (${prescriptions.length})` },
            ...(issuedCount
              ? [{ value: "issued", label: `Active (${issuedCount})` }]
              : []),
            ...(revokedCount
              ? [
                  {
                    value: "revoked",
                    label: `Discontinued (${revokedCount})`,
                  },
                ]
              : []),
          ]}
        />
      </header>

      {visible.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          No prescriptions match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((pr) => (
            <div key={pr.id} className="border border-border">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-ink">
                    Issued {formatDate(pr.issuedAt)}
                  </span>
                  <Badge
                    className="rounded-md tracking-normal"
                    variant={statusVariant(pr.status)}
                  >
                    {titleCase(pr.status)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {isRevocable(pr.status) ? (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRenewing(pr)}
                      >
                        <RefreshCw className="size-4" />
                        Renew
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setRevoking(pr)}
                      >
                        <X className="size-4" />
                        Discontinue
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <ul className="divide-y divide-border border-t border-border px-4">
                {pr.items.map((item) => (
                  <MedicationRow key={item.id} item={item} />
                ))}
              </ul>
              {(pr.status ?? "").toLowerCase() === "revoked" &&
              pr.revokedAt ? (
                <p className="border-t border-border px-4 py-2 text-xs text-danger">
                  Discontinued {formatDate(pr.revokedAt)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        New prescriptions are created during an encounter consultation.
      </p>

      {revoking ? (
        <RevokeModal
          prescription={revoking}
          onClose={() => setRevoking(null)}
          onRevoked={onChanged}
        />
      ) : null}

      {renewing ? (
        <RenewModal
          prescription={renewing}
          onClose={() => setRenewing(null)}
          onRenewed={onChanged}
        />
      ) : null}
    </div>
  );
}
