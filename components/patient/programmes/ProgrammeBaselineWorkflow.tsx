"use client";

import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PCQQuestionField } from "@/components/patient/pcq/PCQQuestionField";
import { usePcqExplicitSave } from "@/components/patient/pcq/use-pcq-explicit-save";
import {
  PATIENT_BASELINE_PCQ_QUERY,
  PATIENT_SUBMIT_PCQ_MUTATION,
} from "@/lib/patient/pcq-graphql";
import {
  INITIALIZE_PROGRAMME_BASELINE_MUTATION,
  MY_CURRENT_PROGRAMME_ENROLMENT_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  SUBMIT_PROGRAMME_BASELINE_MUTATION,
  type ProgrammeBaselineAssessment,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";

type EnrolmentData = {
  myCurrentProgrammeEnrolment: ProgrammeEnrolment | null;
};

type BaselineData = {
  programmeCurrentBaseline: ProgrammeBaselineAssessment | null;
};

type PCQQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  options: string[] | null;
};

type PCQAnswer = {
  id: string;
  questionId: string;
  answerText: string | null;
  answerNumeric: number | null;
  answerBoolean: boolean | null;
  answerJson: string | null;
};

type BaselinePCQ = {
  id: string;
  status: string;
  template: { name: string } | null;
  questions: PCQQuestion[];
  answers: PCQAnswer[];
};

type BaselinePCQData = {
  baselinePcq: BaselinePCQ | null;
};

// Baseline assessment statuses where the questionnaire is locked from further edits —
// either it's already with (or past) clinical review, or superseded by a later version.
const READONLY_BASELINE_STATUSES = ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "SUPERSEDED"];

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

  const pcqQuery = useQuery<BaselinePCQData>(PATIENT_BASELINE_PCQ_QUERY, {
    skip: !enrolment?.id,
    fetchPolicy: "cache-and-network",
  });
  const pcq = pcqQuery.data?.baselinePcq ?? null;

  const explicitSave = usePcqExplicitSave();
  const [initializeBaseline, initializeState] = useMutation(INITIALIZE_PROGRAMME_BASELINE_MUTATION);
  const [submitBaseline, submitBaselineState] = useMutation(SUBMIT_PROGRAMME_BASELINE_MUTATION);
  const [submitPcq, submitPcqState] = useMutation(PATIENT_SUBMIT_PCQ_MUTATION);

  const loading = enrolmentQuery.loading || baselineQuery.loading || pcqQuery.loading;
  const submitting = initializeState.loading || submitBaselineState.loading || submitPcqState.loading;
  const submitError = initializeState.error || submitBaselineState.error || submitPcqState.error;

  const isReadOnly =
    (baseline ? READONLY_BASELINE_STATUSES.includes(baseline.status) : false) ||
    pcq?.status.toUpperCase() === "LOCKED";
  const questions = pcq ? [...pcq.questions].sort((a, b) => a.order - b.order) : [];

  async function refetchAll() {
    await Promise.all([enrolmentQuery.refetch(), baselineQuery.refetch(), pcqQuery.refetch()]);
  }

  async function handleSubmit() {
    if (!pcq || !enrolment) return;
    const saved = await explicitSave.saveAll();
    if (!saved) return;
    try {
      await submitPcq({ variables: { responseId: pcq.id } });
      let baselineId = baseline?.id;
      if (!baselineId) {
        const result = await initializeBaseline({
          variables: { enrolmentId: enrolment.id, pcqResponseId: pcq.id },
        });
        baselineId = result.data?.initializeProgrammeBaseline?.baseline?.id;
      }
      if (baselineId) {
        // Always pass the current PCQ response id, not just on first creation — a
        // baseline can already exist without one linked (e.g. a clinic-initiated
        // re-baseline), and submit is the one guaranteed place to reattach it.
        await submitBaseline({ variables: { baselineId, pcqResponseId: pcq.id } });
      }
      await refetchAll();
    } catch {
      // errors surface via submitError below
    }
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

  if (pcqQuery.error || !pcq) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-5 py-8 text-center text-sm text-warning">
        Unable to load your baseline questionnaire. Please try again or contact your clinic.
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
            <h2 className="mt-1 text-xl font-semibold text-text">
              {pcq.template?.name ?? "Programme Baseline"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              This assessment gives your clinic the context needed to activate your diabetes care plan.
            </p>
          </div>
          <Badge variant={statusVariant(baseline?.status)}>{titleCase(baseline?.status)}</Badge>
        </div>

        {baseline?.status === "RETURNED" ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-medium">Your clinic asked for changes before this can be approved.</p>
              {baseline.reviewNote ? <p className="mt-1">{baseline.reviewNote}</p> : null}
              <p className="mt-1 text-xs">Update your answers below and resubmit.</p>
            </div>
          </div>
        ) : null}

        {baseline?.status === "SUBMITTED" || baseline?.status === "UNDER_REVIEW" ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <p>Submitted — your clinic is reviewing your answers.</p>
          </div>
        ) : null}

        {submitError ? (
          <div className="mt-4 flex gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{mapApolloError(submitError)}</p>
          </div>
        ) : null}
      </div>

      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No questions available for this questionnaire yet.</p>
        </div>
      ) : (
        <div className="space-y-6 rounded-lg border border-border bg-surface p-5">
          {questions.map((question) => (
            <PCQQuestionField
              key={question.id}
              question={question}
              answers={pcq.answers}
              responseId={pcq.id}
              disabled={isReadOnly}
              register={explicitSave.register}
            />
          ))}
        </div>
      )}

      {!isReadOnly ? (
        <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            {explicitSave.savedAt
              ? `Answers saved ${new Date(explicitSave.savedAt).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}`
              : "Your answers autosave as you go."}
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void explicitSave.saveAll()}
              disabled={explicitSave.saving || questions.length === 0}
            >
              {explicitSave.saving ? "Saving…" : "Save and continue later"}
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting || questions.length === 0}>
              {submitting ? "Submitting…" : baseline?.status === "RETURNED" ? "Resubmit baseline" : "Submit baseline"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
