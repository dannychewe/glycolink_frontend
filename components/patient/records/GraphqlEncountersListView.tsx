"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { CalendarDays, ClipboardList, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Clinical records"
        title="My Records"
        description="View consultation notes, diagnoses, observations, and care plans from your visits."
      />

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <div className="flex items-center justify-between gap-2 bg-surface px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">Total encounters</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{counts.all}</p>
          </div>
          <ClipboardList className="size-5 shrink-0 text-muted" />
        </div>
        <div className="flex items-center justify-between gap-2 bg-surface px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">Finalized</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{counts.finalized}</p>
          </div>
          <FileCheck2 className="size-5 shrink-0 text-muted" />
        </div>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((tab) => {
          const isActive = tab === activeTab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-text",
              )}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-warning">
          Unable to load clinical records right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-3">
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
              className="border-border/80 transition-all duration-200"
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
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium text-text">No records found</p>
          <p className="mt-1 text-sm text-muted">
            Clinical records appear here after your consultations are completed.
          </p>
        </div>
      ) : null}
    </div>
  );
}
