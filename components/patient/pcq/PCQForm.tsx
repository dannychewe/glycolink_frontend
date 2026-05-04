"use client";

import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import {
  PATIENT_PCQ_FOR_APPOINTMENT_QUERY,
  PATIENT_SUBMIT_PCQ_MUTATION,
} from "@/lib/patient/pcq-graphql";
import { PCQQuestionField } from "@/components/patient/pcq/PCQQuestionField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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

type PCQResponse = {
  id: string;
  appointmentId: string;
  status: string;
  submittedAt: string | null;
  lockedAt: string | null;
  template: {
    id: string;
    name: string;
    consultationType: string;
    status: string;
    isGlobal: boolean;
  } | null;
  questions: PCQQuestion[];
  answers: PCQAnswer[];
};

type PCQData = {
  getPcqForAppointment: PCQResponse;
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status: string): "success" | "secondary" | "warning" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED") return "success";
  if (s === "LOCKED") return "secondary";
  return "warning";
}

export function PCQForm({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();

  const { data, loading, error } = useQuery<PCQData>(
    PATIENT_PCQ_FOR_APPOINTMENT_QUERY,
    {
      variables: { appointmentId },
      fetchPolicy: "network-only",
    },
  );

  const [submitPcq, { loading: submitting, error: submitError }] = useMutation(
    PATIENT_SUBMIT_PCQ_MUTATION,
    {
      onCompleted: () => {
        router.push(`/patient/bookings/${appointmentId}`);
      },
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

  if (error || !data?.getPcqForAppointment) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load questionnaire. Please try again or contact support.
      </div>
    );
  }

  const pcq = data.getPcqForAppointment;
  const isReadOnly =
    pcq.status.toUpperCase() === "SUBMITTED" ||
    pcq.status.toUpperCase() === "LOCKED";

  const questions = [...pcq.questions].sort((a, b) => a.order - b.order);

  async function handleSubmit() {
    await submitPcq({ variables: { responseId: pcq.id } });
  }

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          {pcq.template ? (
            <p className="text-sm font-medium text-text">{pcq.template.name}</p>
          ) : null}
          <p className="text-sm text-muted">
            {pcq.submittedAt
              ? `Submitted ${formatDateTime(pcq.submittedAt)}`
              : pcq.lockedAt
                ? `Locked ${formatDateTime(pcq.lockedAt)}`
                : "Fill in all required fields and submit before your appointment"}
          </p>
        </div>
        <Badge variant={statusVariant(pcq.status)}>{pcq.status}</Badge>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
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
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Submit error */}
      {submitError ? (
        <p className="text-sm text-danger">
          Submission failed. Please check your answers and try again.
        </p>
      ) : null}

      {/* Actions */}
      {!isReadOnly ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || questions.length === 0}
          >
            {submitting ? "Submitting…" : "Submit Questionnaire"}
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push(`/patient/bookings/${appointmentId}`)}
          >
            Back to Appointment
          </Button>
        </div>
      )}
    </div>
  );
}
