"use client";

import { useQuery } from "@apollo/client";
import { Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MY_PRESCRIPTIONS_QUERY } from "@/lib/patient/prescriptions-graphql";

type PrescriptionItem = {
  id: string;
  drugName: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  status: string;
};

type Prescription = {
  id: string;
  status: string;
  issuedAt: string | null;
  items: PrescriptionItem[];
};

type MyPrescriptionsData = {
  myPrescriptions: Prescription[];
};

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

export function PrescriptionSummarySection() {
  const { data, loading } = useQuery<MyPrescriptionsData>(MY_PRESCRIPTIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl">Prescriptions</h2>
        <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
      </section>
    );
  }

  const prescriptions = data?.myPrescriptions ?? [];
  const active = prescriptions.find((p) => p.status?.toUpperCase() === "ACTIVE");
  const latest = active ?? prescriptions[0] ?? null;
  const latestItem = latest?.items[0] ?? null;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Prescriptions</h2>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle">
        {!latest || !latestItem ? (
          <p className="text-sm text-muted">No prescriptions on record.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                  <Pill className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    Latest prescription
                  </p>
                  <p className="font-semibold text-text">{latestItem.drugName}</p>
                </div>
              </div>
              <Badge variant={latest.status?.toUpperCase() === "ACTIVE" ? "success" : "secondary"}>
                {latest.status}
              </Badge>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-background px-4 py-3">
                <p className="text-xs text-muted">Dosage</p>
                <p className="mt-0.5 text-sm font-semibold text-text">{latestItem.dosage}</p>
              </div>
              <div className="rounded-xl bg-background px-4 py-3">
                <p className="text-xs text-muted">Frequency</p>
                <p className="mt-0.5 text-sm font-semibold text-text">{latestItem.frequency}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
              {formatDate(latest.issuedAt) ? (
                <span>Issued {formatDate(latest.issuedAt)}</span>
              ) : null}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <Button href="/patient/prescriptions" variant="secondary">
                View Prescriptions
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
