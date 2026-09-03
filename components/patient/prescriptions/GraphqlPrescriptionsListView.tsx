"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, statusKeyForMedicationOrder, type StatusKey } from "@/components/design-system";
import { MY_PRESCRIPTIONS_QUERY } from "@/lib/patient/prescriptions-graphql";
import { cn } from "@/lib/utils/cn";

type PrescriptionItem = {
  id: string;
  drugName: string;
  dosage: string | null;
  frequency: string | null;
  duration: number | null;
  route: string | null;
  instructions: string | null;
  status: string;
};

type Prescription = {
  id: string;
  status: string;
  issuedAt: string | null;
  revokedAt: string | null;
  items: PrescriptionItem[];
};

type MyPrescriptionsData = {
  myPrescriptions: Prescription[];
};

type PrescriptionTab = "Active" | "Past";
const tabs: PrescriptionTab[] = ["Active", "Past"];

/**
 * The backend's top-level `Prescription.status` is only ever ISSUED or REVOKED
 * (PrescriptionsPrescriptionStatusChoices) — ACTIVE/COMPLETED/EXPIRED only exist
 * on each medication order (PrescriptionsMedicationOrderStatusChoices). "Is this
 * prescription active" has to be derived from its items, never read off
 * `prescription.status` directly.
 */
function derivedPrescriptionStatus(prescription: Prescription): StatusKey {
  if (prescription.status.trim().toUpperCase() === "REVOKED") return "REVOKED";
  const itemStatuses = prescription.items.map((item) => item.status.trim().toUpperCase());
  if (itemStatuses.includes("ACTIVE")) return "ACTIVE";
  if (itemStatuses.includes("ISSUED")) return "ISSUED";
  if (itemStatuses.length > 0 && itemStatuses.every((s) => s === "COMPLETED")) return "COMPLETED";
  if (itemStatuses.includes("EXPIRED")) return "EXPIRED";
  return "ISSUED";
}

function isCurrentlyActive(prescription: Prescription) {
  const status = derivedPrescriptionStatus(prescription);
  return status === "ACTIVE" || status === "ISSUED";
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-ZM", { month: "long", day: "numeric", year: "numeric" });
}

function Fact({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[13px] font-semibold uppercase tracking-[0.04em] text-muted">{label}</span>
      <span className="text-[15px] font-bold tabular-nums text-text">{value}</span>
      {unit ? <span className="text-xs text-muted">{unit}</span> : null}
    </div>
  );
}

function PrescriptionItemRow({ item }: { item: PrescriptionItem }) {
  return (
    <div className="flex flex-col gap-4 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-xl font-bold leading-tight text-text">{item.drugName}</p>
        <StatusBadge status={statusKeyForMedicationOrder(item.status)} />
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border border-border bg-background px-4 py-3">
        {item.dosage ? <Fact label="Dose" value={item.dosage} /> : null}
        {item.frequency ? <Fact label="Frequency" value={item.frequency} /> : null}
        {item.duration != null ? <Fact label="Duration" value={item.duration} unit="days" /> : null}
        {item.route ? <Fact label="Route" value={item.route} /> : null}
      </div>

      {item.instructions ? (
        <p className="text-sm leading-6 text-muted">{item.instructions}</p>
      ) : null}
    </div>
  );
}

export function GraphqlPrescriptionsListView() {
  const [activeTab, setActiveTab] = useState<PrescriptionTab>("Active");

  const { data, loading, error } = useQuery<MyPrescriptionsData>(MY_PRESCRIPTIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  const prescriptions = useMemo(() => data?.myPrescriptions ?? [], [data?.myPrescriptions]);

  const filtered = useMemo(() => {
    return prescriptions.filter((p) => (activeTab === "Active" ? isCurrentlyActive(p) : !isCurrentlyActive(p)));
  }, [activeTab, prescriptions]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Medications"
        title="Prescriptions"
        description="Every dose, frequency and duration shown in full — never truncated."
      />

      <div className="inline-flex gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
                isActive ? "bg-primary/10 text-primary" : "text-muted hover:text-text",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load prescriptions right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg border border-border bg-border/30" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="grid gap-5">
          {filtered.map((prescription) => (
            <div key={prescription.id} className="overflow-hidden rounded-lg border border-border bg-surface">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-background px-6 py-3">
                <p className="text-sm text-muted">
                  Issued {formatDate(prescription.issuedAt) ?? "date unknown"}
                  {prescription.revokedAt ? ` · Revoked ${formatDate(prescription.revokedAt)}` : ""}
                </p>
                <StatusBadge status={derivedPrescriptionStatus(prescription)} size="sm" />
              </div>
              <div className="divide-y divide-border">
                {prescription.items.map((item) => (
                  <PrescriptionItemRow key={item.id} item={item} />
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-border bg-background px-6 py-4">
                <Button type="button" variant="secondary" size="sm">
                  View details
                </Button>
                {isCurrentlyActive(prescription) ? (
                  <Button type="button" size="sm">
                    Request refill
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium text-text">No prescriptions found</p>
          <p className="mt-1 text-sm text-muted">
            {activeTab === "Active"
              ? "No active prescriptions at the moment."
              : "No past prescriptions on record."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
