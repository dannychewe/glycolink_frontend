"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { CalendarDays, ClipboardList, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PATIENT_ENCOUNTERS_QUERY } from "@/lib/patient/clinical-records-graphql";
import { cn } from "@/lib/utils/cn";

type EncounterItem = {
  id: string;
  appointmentId: string | null;
  patientId: string;
  providerId: string;
  encounterType: string | null;
  status: string;
  clinicalSummary: string | null;
  startedAt: string | null;
  endedAt: string | null;
  finalizedAt: string | null;
};

type PatientEncountersData = {
  myEncounters: EncounterItem[];
};

type EncounterTab = "All" | "Finalized";
const tabs: EncounterTab[] = ["All", "Finalized"];

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function formatDate(value: string | null) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatEncounterType(value: string | null) {
  if (!value) return "Consultation";
  const normalized = value.trim().toLowerCase();
  if (normalized === "telemedicine") return "Telemedicine";
  if (normalized === "in_person") return "In-person";
  if (normalized === "home_visit") return "Home visit";
  return value;
}

function getBadgeVariant(status: string): "success" | "primary" | "secondary" {
  const normalized = normalizeStatus(status);
  if (normalized === "FINALIZED") return "success";
  if (normalized === "OPEN" || normalized === "IN_PROGRESS") return "primary";
  return "secondary";
}

function formatStatus(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "IN_PROGRESS") return "In Progress";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

export function GraphqlEncountersListView() {
  const [activeTab, setActiveTab] = useState<EncounterTab>("All");

  const { data, loading, error } = useQuery<PatientEncountersData>(
    PATIENT_ENCOUNTERS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const encounters = useMemo(() => data?.myEncounters ?? [], [data?.myEncounters]);

  const counts = useMemo(
    () => ({
      all: encounters.length,
      finalized: encounters.filter((e) => normalizeStatus(e.status) === "FINALIZED").length,
    }),
    [encounters],
  );

  const filtered = useMemo(() => {
    if (activeTab === "Finalized") {
      return encounters.filter((e) => normalizeStatus(e.status) === "FINALIZED");
    }
    return encounters;
  }, [activeTab, encounters]);

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Clinical records
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">My Records</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            View consultation notes, diagnoses, observations, and care plans from your visits.
          </p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border-border/80 bg-surface/80 shadow-soft">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Total encounters</p>
              <p className="text-2xl font-semibold text-text">{counts.all}</p>
            </div>
            <ClipboardList className="size-5 text-primary" />
          </CardContent>
        </Card>
        <Card className="border-border/80 bg-surface/80 shadow-soft">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted">Finalized</p>
              <p className="text-2xl font-semibold text-text">{counts.finalized}</p>
            </div>
            <FileCheck2 className="size-5 text-primary" />
          </CardContent>
        </Card>
      </div>

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
          Unable to load clinical records right now.
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
          {filtered.map((encounter) => (
            <Card
              key={encounter.id}
              className="border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-subtle"
            >
              <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {formatEncounterType(encounter.encounterType)} encounter
                  </p>
                  <p className="text-lg font-semibold text-text">
                    {encounter.finalizedAt
                      ? `Finalized ${formatDate(encounter.finalizedAt)}`
                      : `Started ${formatDate(encounter.startedAt)}`}
                  </p>
                  {encounter.clinicalSummary ? (
                    <p className="line-clamp-2 max-w-prose text-sm text-muted">
                      {encounter.clinicalSummary}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-3.5" />
                      {formatDate(encounter.startedAt)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getBadgeVariant(encounter.status)}>
                    {formatStatus(encounter.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  href={`/patient/records/${encounter.id}`}
                  variant="secondary"
                  className="sm:w-auto"
                  fullWidth
                >
                  View Record
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No records found</p>
          <p className="mt-1 text-sm text-muted">
            Clinical records appear here after your consultations are completed.
          </p>
        </div>
      ) : null}
    </div>
  );
}
