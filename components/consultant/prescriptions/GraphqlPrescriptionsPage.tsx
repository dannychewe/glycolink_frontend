"use client";

import { useQuery } from "@apollo/client";
import { Pill } from "lucide-react";
import { ACTIVE_MEDICATIONS_QUERY } from "@/lib/consultant/prescriptions-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FREQUENCY_OPTIONS, ROUTE_OPTIONS } from "@/lib/consultant/prescriptions-graphql";

type ActiveMedication = {
  id: string;
  prescriptionId: string;
  encounterId: string | null;
  providerId: string | null;
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string | null;
  route: string | null;
  instructions: string | null;
  status: string;
  issuedAt: string;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function formatFrequency(value: string) {
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value.replace(/_/g, " ").toLowerCase();
}

function formatRoute(value: string | null) {
  if (!value) return null;
  return ROUTE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

function statusVariant(status: string): "success" | "danger" | "secondary" {
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "success";
  if (s === "REVOKED" || s === "DISCONTINUED") return "danger";
  return "secondary";
}

export function GraphqlPrescriptionsPage() {
  const { data, loading, error } = useQuery<{ activeMedications: ActiveMedication[] }>(
    ACTIVE_MEDICATIONS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const medications = data?.activeMedications ?? [];

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load active medications.
      </div>
    );
  }

  if (medications.length === 0) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-text">
          <p className="font-medium">Prescriptions are issued from within the consultation workspace.</p>
          <p className="mt-1 text-muted">
            Finalize an encounter, then use the Prescriptions tab to issue medications for that session.
          </p>
          <Button href="/consultant/consultations" variant="secondary" size="sm" className="mt-3">
            Go to Consultations
          </Button>
        </div>
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <Pill className="size-8 text-muted/40" />
          <p className="text-sm font-medium text-text">No active medications</p>
          <p className="text-xs text-muted">Active prescriptions will appear here once issued.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-text">
        <p className="font-medium">Issue prescriptions from the consultation workspace.</p>
        <p className="mt-1 text-muted">
          To prescribe medications, finalize an encounter and use the Prescriptions tab.
        </p>
        <Button href="/consultant/consultations" variant="secondary" size="sm" className="mt-3">
          Go to Consultations
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {medications.length} active medication{medications.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {medications.map((med) => (
          <div
            key={med.id}
            className="rounded-2xl border-l-4 border-l-success/50 bg-surface px-5 py-4 shadow-subtle"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-base font-semibold text-text">{med.drugName}</p>
                  <Badge variant={statusVariant(med.status)}>{med.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-muted">
                  <span className="font-medium text-text">{med.dosage}</span>
                  <span>{formatFrequency(med.frequency)}</span>
                  {med.route ? <span>{formatRoute(med.route)}</span> : null}
                  {med.duration ? <span>for {med.duration}</span> : null}
                </div>
                {med.instructions ? (
                  <p className="text-xs text-muted italic">{med.instructions}</p>
                ) : null}
              </div>
              <p className="text-xs text-muted">Issued {formatDate(med.issuedAt)}</p>
            </div>

            {med.encounterId ? (
              <div className="mt-3 border-t border-border pt-3">
                <Button
                  href={`/consultant/consultations/${med.encounterId}`}
                  variant="ghost"
                  size="sm"
                >
                  View Encounter
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
