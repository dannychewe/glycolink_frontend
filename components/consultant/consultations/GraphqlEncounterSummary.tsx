"use client";

import { useQuery } from "@apollo/client";
import { ENCOUNTER_QUERY } from "@/lib/consultant/consultation-graphql";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function SummaryBlock({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-surface px-4 py-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="text-sm leading-6 text-text whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function GraphqlEncounterSummary({ encounterId }: { encounterId: string }) {
  const { data, loading, error } = useQuery(ENCOUNTER_QUERY, {
    variables: { id: encounterId },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-48 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  if (error || !data?.encounter) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load encounter summary.
      </div>
    );
  }

  const encounter = data.encounter;
  const latestSoap = encounter.soapVersions?.at(-1);
  const primaryDx = encounter.diagnoses?.find((d: { isPrimary: boolean }) => d.isPrimary) ?? encounter.diagnoses?.[0];

  return (
    <div className="space-y-6">
      <header className="space-y-3 rounded-2xl border border-border bg-surface px-6 py-6 shadow-subtle">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Encounter Summary
        </p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">
              Patient {encounter.patientId.slice(0, 8)}…
            </h1>
            <p className="text-sm text-muted">{formatDate(encounter.startedAt)}</p>
          </div>
          <Badge variant={encounter.status.toUpperCase() === "FINALIZED" ? "success" : "primary"}>
            {encounter.status}
          </Badge>
        </div>
        <div className="flex gap-2 pt-1">
          <Button href={`/consultant/consultations/${encounterId}`} variant="secondary" size="sm">
            Open Workspace
          </Button>
          <Button href="/consultant/consultations" variant="ghost" size="sm">
            All Consultations
          </Button>
        </div>
      </header>

      {/* SOAP */}
      {latestSoap ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            SOAP Notes · Version {latestSoap.versionNumber}
          </p>
          <div className="grid gap-3 xl:grid-cols-2">
            <SummaryBlock label="Subjective" value={latestSoap.subjective} />
            <SummaryBlock label="Objective" value={latestSoap.objective} />
            <SummaryBlock label="Assessment" value={latestSoap.assessment} />
            <SummaryBlock label="Plan" value={latestSoap.plan} />
          </div>
        </div>
      ) : null}

      {/* Diagnoses */}
      {encounter.diagnoses?.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Diagnoses</p>
          <div className="space-y-2">
            {encounter.diagnoses.map((dx: { id: string; description: string; codeSystem: string | null; code: string | null; isPrimary: boolean }) => (
              <div key={dx.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{dx.description}</p>
                  {dx.code ? <p className="text-xs text-muted">{dx.codeSystem} · {dx.code}</p> : null}
                </div>
                {dx.isPrimary ? <Badge variant="primary">Primary</Badge> : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Observations */}
      {encounter.observations?.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Observations</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {encounter.observations.map((obs: { id: string; type: string; valueNumeric: number | null; valueText: string | null; unit: string | null }) => (
              <div key={obs.id} className="rounded-2xl border border-border bg-surface px-4 py-3">
                <p className="text-xs text-muted">{obs.type.replace(/_/g, " ")}</p>
                <p className="mt-1 text-lg font-semibold text-text">
                  {obs.valueNumeric != null ? obs.valueNumeric : obs.valueText ?? "—"}
                  {obs.unit ? <span className="ml-1 text-sm font-normal text-muted">{obs.unit}</span> : null}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Care plan */}
      {encounter.carePlanActions?.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Care Plan</p>
          <div className="space-y-2">
            {encounter.carePlanActions.map((action: { id: string; type: string; description: string; targetDate: string | null; status: string }) => (
              <div key={action.id} className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text">{action.description}</p>
                  {action.targetDate ? <p className="text-xs text-muted">Target: {action.targetDate}</p> : null}
                </div>
                <Badge variant="secondary">{action.type.replace(/_/g, " ")}</Badge>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Clinical summary */}
      {encounter.clinicalSummary ? (
        <SummaryBlock label="Clinical Summary" value={encounter.clinicalSummary} />
      ) : null}

      {/* Primary diagnosis callout */}
      {primaryDx ? (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Primary Diagnosis</p>
          <p className="mt-1 text-sm font-medium text-text">{primaryDx.description}</p>
        </div>
      ) : null}
    </div>
  );
}
