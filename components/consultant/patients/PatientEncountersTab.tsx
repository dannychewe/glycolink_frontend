"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  FileText,
  Stethoscope,
  Activity,
} from "lucide-react";
import type {
  WorkspaceEncounter,
  WorkspaceCarePlanAction,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    timeZone: "Africa/Lusaka",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
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
): "success" | "warning" | "danger" | "secondary" | "primary" {
  const s = (status ?? "").toLowerCase();
  if (["finalized", "completed"].includes(s)) return "success";
  if (["in_progress", "draft"].includes(s)) return "warning";
  if (["cancelled"].includes(s)) return "danger";
  return "secondary";
}

function actionStatusVariant(
  status: string | null,
): "success" | "warning" | "danger" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return "success";
  if (["pending", "in_progress"].includes(s)) return "warning";
  if (s === "cancelled") return "danger";
  return "secondary";
}

function SoapSection({
  label,
  content,
}: {
  label: string;
  content: string | null;
}) {
  if (!content) return null;
  return (
    <div className="space-y-1">
      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </h5>
      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-text">
        {content}
      </p>
    </div>
  );
}

function EncounterCard({
  encounter,
  defaultExpanded,
}: {
  encounter: WorkspaceEncounter;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false);
  const latestSoap =
    encounter.soapVersions.length > 0
      ? encounter.soapVersions.reduce((latest, v) =>
          v.versionNumber > latest.versionNumber ? v : latest,
        )
      : null;
  const hasSoapContent =
    latestSoap &&
    (latestSoap.subjective ||
      latestSoap.objective ||
      latestSoap.assessment ||
      latestSoap.plan);
  const primaryDiagnosis = encounter.diagnoses.find((d) => d.isPrimary);
  const status = (encounter.status ?? "").toLowerCase();

  return (
    <div className="border border-border">
      <button
        type="button"
        className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-primary/5"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="mt-0.5 size-4 shrink-0 text-muted" />
        ) : (
          <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-ink">
              {titleCase(encounter.encounterType)}
            </span>
            <Badge
              className="rounded-md tracking-normal"
              variant={statusVariant(encounter.status)}
            >
              {titleCase(encounter.status)}
            </Badge>
            {primaryDiagnosis ? (
              <span className="text-xs text-muted">
                {primaryDiagnosis.description}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted">
            {formatDateTime(encounter.startedAt)}
            {encounter.endedAt
              ? ` — ${formatDateTime(encounter.endedAt)}`
              : ""}
          </p>
        </div>
        <Button
          href={`/consultant/consultations/${encounter.appointmentId}/summary`}
          variant="secondary"
          size="sm"
          onClick={(e) => e.stopPropagation()}
        >
          View
        </Button>
      </button>

      {expanded ? (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {/* Clinical summary */}
          {encounter.clinicalSummary ? (
            <div className="space-y-1">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <FileText className="size-3.5" />
                Clinical summary
              </h4>
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted">
                {encounter.clinicalSummary}
              </p>
            </div>
          ) : null}

          {/* SOAP notes */}
          {hasSoapContent ? (
            <div className="space-y-3">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <ClipboardList className="size-3.5" />
                SOAP note
                {latestSoap.isFinalized ? (
                  <Badge variant="success" className="rounded-md text-[10px]">
                    Finalized
                  </Badge>
                ) : (
                  <Badge
                    variant="secondary"
                    className="rounded-md text-[10px]"
                  >
                    v{latestSoap.versionNumber}
                  </Badge>
                )}
              </h4>
              <div className="grid gap-3 border border-border p-3 sm:grid-cols-2">
                <SoapSection label="Subjective" content={latestSoap.subjective} />
                <SoapSection label="Objective" content={latestSoap.objective} />
                <SoapSection label="Assessment" content={latestSoap.assessment} />
                <SoapSection label="Plan" content={latestSoap.plan} />
              </div>
            </div>
          ) : status !== "draft" ? (
            <p className="text-xs text-muted">No SOAP notes recorded.</p>
          ) : null}

          {/* Diagnoses */}
          {encounter.diagnoses.length > 0 ? (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Stethoscope className="size-3.5" />
                Diagnoses
              </h4>
              <ul className="divide-y divide-border border border-border">
                {encounter.diagnoses.map((dx) => (
                  <li
                    key={dx.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="text-text">
                      {dx.description}
                      {dx.code ? (
                        <span className="ml-2 text-xs text-muted">
                          {dx.codeSystem ? `${dx.codeSystem}: ` : ""}
                          {dx.code}
                        </span>
                      ) : null}
                    </span>
                    {dx.isPrimary ? (
                      <Badge
                        variant="primary"
                        className="rounded-md text-[10px]"
                      >
                        Primary
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Observations */}
          {encounter.observations.length > 0 ? (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <Activity className="size-3.5" />
                Observations
              </h4>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {encounter.observations.map((obs) => (
                  <div key={obs.id} className="border border-border px-3 py-2">
                    <p className="text-xs text-muted">{titleCase(obs.type)}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-ink">
                      {obs.valueNumeric != null
                        ? obs.valueNumeric
                        : obs.valueText ?? "--"}
                      {obs.unit ? (
                        <span className="ml-1 text-xs font-normal text-muted">
                          {obs.unit}
                        </span>
                      ) : null}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Care plan actions */}
          {encounter.carePlanActions.length > 0 ? (
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                <CheckCircle2 className="size-3.5" />
                Care plan actions
              </h4>
              <ul className="divide-y divide-border border border-border">
                {encounter.carePlanActions.map((action) => (
                  <li
                    key={action.id}
                    className="flex flex-wrap items-start justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-text">
                        <span className="font-medium">
                          {titleCase(action.type)}:
                        </span>{" "}
                        {action.description}
                      </p>
                      {action.targetDate ? (
                        <p className="mt-0.5 text-xs text-muted">
                          Due {formatDate(action.targetDate)}
                        </p>
                      ) : null}
                    </div>
                    <Badge
                      className="rounded-md tracking-normal"
                      variant={actionStatusVariant(action.status)}
                    >
                      {titleCase(action.status)}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {encounter.finalizedAt ? (
            <p className="flex items-center gap-1 text-xs text-success">
              <CheckCircle2 className="size-3" />
              Finalized {formatDateTime(encounter.finalizedAt)}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function PatientEncountersTab({
  encounters,
  carePlanActions,
}: Readonly<{
  encounters: WorkspaceEncounter[];
  carePlanActions: WorkspaceCarePlanAction[];
}>) {
  const [filter, setFilter] = useState("all");

  const visible = encounters.filter((e) => {
    if (filter === "all") return true;
    return (e.status ?? "").toLowerCase() === filter;
  });

  const statusCounts = encounters.reduce(
    (acc, e) => {
      const s = (e.status ?? "").toLowerCase();
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <Stethoscope className="size-4 text-primary" />
          Encounters
          <span className="text-xs font-medium tabular-nums text-muted">
            {encounters.length}
          </span>
        </h2>
        <Select
          aria-label="Filter encounters"
          className="w-40"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          options={[
            { value: "all", label: `All (${encounters.length})` },
            ...(statusCounts.finalized
              ? [
                  {
                    value: "finalized",
                    label: `Finalized (${statusCounts.finalized})`,
                  },
                ]
              : []),
            ...(statusCounts.draft
              ? [{ value: "draft", label: `Draft (${statusCounts.draft})` }]
              : []),
            ...(statusCounts.in_progress
              ? [
                  {
                    value: "in_progress",
                    label: `In Progress (${statusCounts.in_progress})`,
                  },
                ]
              : []),
          ]}
        />
      </header>

      {visible.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          No encounters match this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((e, i) => (
            <EncounterCard
              key={e.id}
              encounter={e}
              defaultExpanded={i === 0}
            />
          ))}
        </div>
      )}

      {/* Standalone care plan actions from encounters */}
      {carePlanActions.length > 0 ? (
        <div className="space-y-3 border-t border-border pt-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <CheckCircle2 className="size-4 text-primary" />
            All encounter actions
            <span className="text-xs font-medium tabular-nums text-muted">
              {carePlanActions.length}
            </span>
          </h3>
          <ul className="divide-y divide-border border border-border">
            {carePlanActions.map((action) => (
              <li
                key={action.id}
                className="flex flex-wrap items-start justify-between gap-3 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-text">
                    <span className="font-medium">
                      {titleCase(action.type)}:
                    </span>{" "}
                    {action.description}
                  </p>
                  {action.targetDate ? (
                    <p className="mt-0.5 text-xs text-muted">
                      Due {formatDate(action.targetDate)}
                    </p>
                  ) : null}
                </div>
                <Badge
                  className="rounded-md tracking-normal"
                  variant={actionStatusVariant(action.status)}
                >
                  {titleCase(action.status)}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
