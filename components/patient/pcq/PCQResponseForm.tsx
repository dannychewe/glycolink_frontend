"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, UserRound } from "lucide-react";
import {
  PATIENT_PCQ_DETAIL_QUERY,
  PATIENT_PCQ_LIST_QUERY,
  PATIENT_SUBMIT_PCQ_MUTATION,
} from "@/lib/patient/pcq-graphql";
import { PCQQuestionField } from "@/components/patient/pcq/PCQQuestionField";
import { usePcqExplicitSave } from "@/components/patient/pcq/use-pcq-explicit-save";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type PCQQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  options: string[] | string | null;
};

type PCQAnswer = {
  id: string;
  questionId: string;
  answerText: string | null;
  answerNumeric: number | null;
  answerBoolean: boolean | null;
  answerJson: unknown;
};

type PCQResponse = {
  id: string;
  appointmentId: string | null;
  patientId: string;
  assignedByProviderName: string | null;
  responseScope: string;
  status: string;
  assignmentReason: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  lockedAt: string | null;
  template: {
    id: string;
    name: string;
    consultationType: string;
    status: string;
    specialtyId: string | null;
    isGlobal: boolean;
  } | null;
  templateVersion: {
    id: string;
    versionNumber: number;
    isCurrent: boolean;
    publishedAt: string | null;
  } | null;
  questions: PCQQuestion[];
  answers: PCQAnswer[];
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function statusVariant(status: string): "success" | "secondary" | "warning" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED") return "success";
  if (s === "LOCKED") return "secondary";
  return "warning";
}

const SCOPE_LABEL: Record<string, string> = {
  BASELINE: "Baseline questionnaire",
  APPOINTMENT: "Appointment questionnaire",
  ASSIGNED: "Assigned by your consultant",
};

export function PCQResponseForm({ responseId }: { responseId: string }) {
  const router = useRouter();
  const explicitSave = usePcqExplicitSave();

  const { data, loading, error } = useQuery<{ pcqResponse: PCQResponse | null }>(
    PATIENT_PCQ_DETAIL_QUERY,
    { variables: { id: responseId }, fetchPolicy: "network-only" },
  );

  const [submitPcq, { loading: submitting, error: submitError }] = useMutation(
    PATIENT_SUBMIT_PCQ_MUTATION,
    {
      refetchQueries: [
        PATIENT_PCQ_LIST_QUERY,
        { query: PATIENT_PCQ_DETAIL_QUERY, variables: { id: responseId } },
      ],
      onCompleted: () => router.push("/patient/pcq"),
    },
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-border/40" />
        <div className="h-64 animate-pulse rounded-xl bg-border/40" />
      </div>
    );
  }

  if (error || !data?.pcqResponse) {
    return (
      <div className="space-y-4">
        <Button href="/patient/pcq" variant="ghost" size="sm" className="-ml-2">
          <ArrowLeft className="size-4" /> Back to questionnaires
        </Button>
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
          Unable to load this questionnaire. Please try again or contact support.
        </div>
      </div>
    );
  }

  const pcq = data.pcqResponse;
  const status = pcq.status.toUpperCase();
  const isReadOnly = status === "SUBMITTED" || status === "LOCKED";
  const questions = [...pcq.questions].sort((a, b) => a.order - b.order);

  async function handleSubmit() {
    // Flush every field through savePcqAnswer before submitting. This is what
    // makes untouched required booleans persist their "false" answer (an
    // unchecked box never fires onChange, so no draft row exists for it) — the
    // backend would otherwise reject the submit as a missing required answer.
    // Only submit once the save is clean so we never lock in a half-saved form.
    const saved = await explicitSave.saveAll();
    if (!saved) return;
    await submitPcq({ variables: { responseId: pcq.id } });
  }

  return (
    <div className="space-y-6">
      <Button href="/patient/pcq" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" /> Back to questionnaires
      </Button>

      {/* Status / context bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            {SCOPE_LABEL[pcq.responseScope] ?? pcq.responseScope}
          </p>
          {pcq.template ? <p className="text-sm font-medium text-text">{pcq.template.name}</p> : null}
          <p className="text-sm text-muted">
            {pcq.submittedAt
              ? `Submitted ${formatDateTime(pcq.submittedAt)}`
              : pcq.lockedAt
                ? `Locked ${formatDateTime(pcq.lockedAt)}`
                : pcq.responseScope === "BASELINE"
                  ? "Submit this baseline questionnaire to become consultation-ready."
                  : "Fill in all required fields and submit."}
          </p>
          <div className="flex flex-wrap gap-3 pt-0.5 text-xs text-muted">
            {pcq.templateVersion ? <span>Version {pcq.templateVersion.versionNumber}</span> : null}
            {pcq.assignedByProviderName ? (
              <span className="inline-flex items-center gap-1">
                <UserRound className="size-3.5" /> {pcq.assignedByProviderName}
              </span>
            ) : null}
            {pcq.dueAt && !isReadOnly ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="size-3.5" /> Due {formatDateTime(pcq.dueAt)}
              </span>
            ) : null}
          </div>
        </div>
        <Badge variant={statusVariant(pcq.status)}>{pcq.status}</Badge>
      </div>

      {pcq.assignmentReason ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-text">
          <span className="font-medium">Why you were asked: </span>{pcq.assignmentReason}
        </div>
      ) : null}

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No questions available for this questionnaire.</p>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {questions.length} question{questions.length === 1 ? "" : "s"}
              {isReadOnly ? " · Read only" : ""}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
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
          </CardContent>
        </Card>
      )}

      {submitError ? (
        <p className="text-sm text-danger">
          Submission failed. Please check your answers and try again.
        </p>
      ) : null}

      {explicitSave.error ? (
        <p className="text-sm text-danger">
          Couldn&apos;t save your answers. Please check your connection and try again.
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!isReadOnly ? (
          <p className="text-xs text-muted">
            {explicitSave.savedAt
              ? `Answers saved ${formatDateTime(explicitSave.savedAt)}`
              : "Your answers autosave as you go."}
          </p>
        ) : (
          <span />
        )}

        {!isReadOnly ? (
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => void explicitSave.saveAll()}
              disabled={explicitSave.saving || questions.length === 0}
            >
              {explicitSave.saving ? "Saving…" : "Save and continue later"}
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting || explicitSave.saving || questions.length === 0}>
              {submitting ? "Submitting…" : "Submit questionnaire"}
            </Button>
          </div>
        ) : (
          <Button type="button" variant="secondary" href="/patient/pcq">
            Back to questionnaires
          </Button>
        )}
      </div>
    </div>
  );
}
