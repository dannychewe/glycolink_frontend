"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Pill } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MY_PRESCRIPTIONS_QUERY } from "@/lib/patient/prescriptions-graphql";
import { cn } from "@/lib/utils/cn";

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
  issuedAt: string | null;
  revokedAt: string | null;
  items: PrescriptionItem[];
};

type MyPrescriptionsData = {
  myPrescriptions: Prescription[];
};

type PrescriptionTab = "Active" | "Past";
const tabs: PrescriptionTab[] = ["Active", "Past"];

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function getStatusVariant(status: string): "success" | "warning" | "danger" | "secondary" {
  const s = normalizeStatus(status);
  if (s === "ACTIVE") return "success";
  if (s === "REVOKED") return "danger";
  if (s === "COMPLETED") return "secondary";
  return "secondary";
}

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-ZM", { month: "long", day: "numeric", year: "numeric" });
}

export function GraphqlPrescriptionsListView() {
  const [activeTab, setActiveTab] = useState<PrescriptionTab>("Active");

  const { data, loading, error } = useQuery<MyPrescriptionsData>(MY_PRESCRIPTIONS_QUERY, {
    fetchPolicy: "network-only",
  });

  const prescriptions = useMemo(() => data?.myPrescriptions ?? [], [data?.myPrescriptions]);

  const filtered = useMemo(() => {
    return prescriptions.filter((p) =>
      activeTab === "Active"
        ? normalizeStatus(p.status) === "ACTIVE"
        : normalizeStatus(p.status) !== "ACTIVE",
    );
  }, [activeTab, prescriptions]);

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Medications
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Prescriptions</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Prescriptions issued by your care team during consultations.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-surface px-3 py-3">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-surface text-text hover:bg-slate-50",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load prescriptions right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-36 animate-pulse bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map((prescription) => (
            <Card key={prescription.id} className="border-border/80">
              <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                    <Pill className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                      {prescription.items.length} medication{prescription.items.length !== 1 ? "s" : ""}
                    </p>
                    <p className="font-semibold text-text">
                      {prescription.items.map((i) => i.drugName).join(", ")}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs text-muted">
                      {formatDate(prescription.issuedAt) ? (
                        <span>{formatDate(prescription.issuedAt)}</span>
                      ) : null}
                      {prescription.revokedAt ? (
                        <span>· Revoked {formatDate(prescription.revokedAt)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Badge variant={getStatusVariant(prescription.status)}>
                  {normalizeStatus(prescription.status)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {prescription.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-border/70 bg-background px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-text">{item.drugName}</p>
                      <span className="text-xs text-muted">{item.dosage}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{item.frequency}</p>
                    {item.instructions ? (
                      <p className="mt-1.5 text-xs leading-5 text-muted">{item.instructions}</p>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
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
