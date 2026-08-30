"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  INITIALIZE_PROGRAMME_BASELINE_MUTATION,
  MY_CURRENT_PROGRAMME_ENROLMENT_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  SUBMIT_PROGRAMME_BASELINE_MUTATION,
  UPDATE_PROGRAMME_BASELINE_MUTATION,
  type ProgrammeBaselineAssessment,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";

type EnrolmentData = {
  myCurrentProgrammeEnrolment: ProgrammeEnrolment | null;
};

type BaselineData = {
  programmeCurrentBaseline: ProgrammeBaselineAssessment | null;
};

type BaselineJson = {
  diabetesHistoryJson: string;
  treatmentContextJson: string;
  measurementContextJson: string;
  patientContextJson: string;
  sourceReferencesJson: string;
};

function pretty(value: unknown) {
  if (value == null) return "{}";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "{}";
  }
}

function parseJson(label: string, value: string) {
  try {
    return JSON.parse(value || "{}") as unknown;
  } catch {
    throw new Error(`${label} must be valid JSON.`);
  }
}

function statusVariant(status: string | null | undefined) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "APPROVED") return "success" as const;
  if (normalized === "RETURNED") return "warning" as const;
  if (normalized === "SUBMITTED" || normalized === "UNDER_REVIEW") return "primary" as const;
  return "secondary" as const;
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Not started";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function mapApolloError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The programme baseline could not be saved.";
}

export function ProgrammeBaselineWorkflow() {
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const enrolmentQuery = useQuery<EnrolmentData>(MY_CURRENT_PROGRAMME_ENROLMENT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const enrolment = enrolmentQuery.data?.myCurrentProgrammeEnrolment ?? null;
  const baselineQuery = useQuery<BaselineData>(PROGRAMME_CURRENT_BASELINE_QUERY, {
    variables: { enrolmentId: enrolment?.id },
    skip: !enrolment?.id,
    fetchPolicy: "cache-and-network",
  });

  const baseline = baselineQuery.data?.programmeCurrentBaseline ?? null;
  const initialJson = useMemo<BaselineJson>(
    () => ({
      diabetesHistoryJson: pretty(baseline?.diabetesHistoryJson),
      treatmentContextJson: pretty(baseline?.treatmentContextJson),
      measurementContextJson: pretty(baseline?.measurementContextJson),
      patientContextJson: pretty(baseline?.patientContextJson),
      sourceReferencesJson: pretty(baseline?.sourceReferencesJson),
    }),
    [baseline],
  );
  const [form, setForm] = useState<BaselineJson>(initialJson);
  const [lastBaselineId, setLastBaselineId] = useState<string | null>(null);

  useEffect(() => {
    if (baseline?.id !== lastBaselineId) {
      setLastBaselineId(baseline?.id ?? null);
      setForm(initialJson);
    }
  }, [baseline?.id, initialJson, lastBaselineId]);

  const [initializeBaseline, initializeState] = useMutation(INITIALIZE_PROGRAMME_BASELINE_MUTATION, {
    onCompleted: () => {
      setMessage({ tone: "success", text: "Programme baseline started." });
      void baselineQuery.refetch();
    },
    onError: (error) => setMessage({ tone: "error", text: mapApolloError(error) }),
  });
  const [updateBaseline, updateState] = useMutation(UPDATE_PROGRAMME_BASELINE_MUTATION, {
    onCompleted: () => {
      setMessage({ tone: "success", text: "Programme baseline saved." });
      void baselineQuery.refetch();
    },
    onError: (error) => setMessage({ tone: "error", text: mapApolloError(error) }),
  });
  const [submitBaseline, submitState] = useMutation(SUBMIT_PROGRAMME_BASELINE_MUTATION, {
    onCompleted: () => {
      setMessage({ tone: "success", text: "Programme baseline submitted for review." });
      void baselineQuery.refetch();
    },
    onError: (error) => setMessage({ tone: "error", text: mapApolloError(error) }),
  });

  const loading = enrolmentQuery.loading || baselineQuery.loading;
  const saving = initializeState.loading || updateState.loading || submitState.loading;
  const editable = !baseline || !["APPROVED", "SUPERSEDED", "UNDER_REVIEW"].includes(baseline.status);

  async function handleStart() {
    if (!enrolment?.id) return;
    await initializeBaseline({ variables: { enrolmentId: enrolment.id } });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    if (!baseline?.id) return;
    try {
      await updateBaseline({
        variables: {
          baselineId: baseline.id,
          data: {
            diabetesHistoryJson: parseJson("Diabetes history", form.diabetesHistoryJson),
            treatmentContextJson: parseJson("Treatment context", form.treatmentContextJson),
            measurementContextJson: parseJson("Measurement context", form.measurementContextJson),
            patientContextJson: parseJson("Patient context", form.patientContextJson),
            sourceReferencesJson: parseJson("Source references", form.sourceReferencesJson),
          },
        },
      });
    } catch (error) {
      setMessage({ tone: "error", text: mapApolloError(error) });
    }
  }

  async function handleSubmit() {
    if (!baseline?.id) return;
    await submitBaseline({ variables: { baselineId: baseline.id } });
  }

  if (loading && !enrolment) {
    return <div className="h-48 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <div className="rounded-lg border border-border bg-surface px-5 py-8 text-center">
        <AlertCircle className="mx-auto size-8 text-warning" />
        <p className="mt-3 font-semibold text-text">No active diabetes programme enrolment</p>
        <p className="mt-1 text-sm text-muted">Your clinic will invite or enrol you before baseline assessment starts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {enrolment.programme.name}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text">Programme Baseline</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              This assessment gives your clinic the context needed to activate your diabetes care plan.
            </p>
          </div>
          <Badge variant={statusVariant(baseline?.status)}>{titleCase(baseline?.status)}</Badge>
        </div>

        {message ? (
          <div
            className={`mt-4 flex gap-2 rounded-lg border px-3 py-2 text-sm ${
              message.tone === "success"
                ? "border-success/30 bg-success/5 text-success"
                : "border-danger/30 bg-danger/5 text-danger"
            }`}
          >
            {message.tone === "success" ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertCircle className="mt-0.5 size-4" />}
            <p>{message.text}</p>
          </div>
        ) : null}

        {!baseline ? (
          <Button type="button" className="mt-5" onClick={() => void handleStart()} disabled={saving}>
            {saving ? "Starting..." : "Start baseline"}
          </Button>
        ) : null}
      </div>

      {baseline ? (
        <form onSubmit={(event) => void handleSave(event)} className="space-y-4 rounded-lg border border-border bg-surface p-5">
          {[
            ["diabetesHistoryJson", "Diabetes history"],
            ["treatmentContextJson", "Treatment context"],
            ["measurementContextJson", "Measurement context"],
            ["patientContextJson", "Patient context"],
            ["sourceReferencesJson", "Source references"],
          ].map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <Textarea
                id={key}
                value={form[key as keyof BaselineJson]}
                disabled={!editable || saving}
                onChange={(event) =>
                  setForm((current) => ({ ...current, [key]: event.target.value }))
                }
                className="min-h-24 font-mono text-xs"
              />
            </div>
          ))}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!editable || saving}>
              {saving ? "Saving..." : "Save baseline"}
            </Button>
            <Button type="button" variant="secondary" disabled={!editable || saving} onClick={() => void handleSubmit()}>
              Submit for review
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
