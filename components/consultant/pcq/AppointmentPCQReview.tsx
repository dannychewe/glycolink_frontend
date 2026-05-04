"use client";

import { useQuery } from "@apollo/client";
import { ClipboardList } from "lucide-react";
import { PCQ_FOR_APPOINTMENT_QUERY } from "@/lib/consultant/pcq-graphql";
import { Badge } from "@/components/ui/badge";

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
  answerJson: unknown;
};

type PCQData = {
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
  templateVersion: {
    id: string;
    versionNumber: number;
    isCurrent: boolean;
    publishedAt: string | null;
  } | null;
  questions: PCQQuestion[];
  answers: PCQAnswer[];
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function renderAnswer(question: PCQQuestion, answer: PCQAnswer | undefined): React.ReactNode {
  if (!answer) {
    return <span className="text-muted italic">No answer provided</span>;
  }

  switch (question.questionType) {
    case "boolean":
      if (answer.answerBoolean === null) return <span className="text-muted italic">—</span>;
      return (
        <Badge variant={answer.answerBoolean ? "success" : "secondary"}>
          {answer.answerBoolean ? "Yes" : "No"}
        </Badge>
      );

    case "numeric":
      if (answer.answerNumeric === null) return <span className="text-muted italic">—</span>;
      return <span className="font-semibold text-text">{answer.answerNumeric}</span>;

    case "select":
      return answer.answerText
        ? <Badge variant="primary">{answer.answerText}</Badge>
        : <span className="text-muted italic">—</span>;

    case "text":
    case "textarea":
    default:
      return answer.answerText
        ? <p className="text-sm leading-6 text-text whitespace-pre-wrap">{answer.answerText}</p>
        : <span className="text-muted italic">—</span>;
  }
}

export function AppointmentPCQReview({ appointmentId }: { appointmentId: string }) {
  const { data, loading, error } = useQuery<{ getPcqForAppointment: PCQData | null }>(
    PCQ_FOR_APPOINTMENT_QUERY,
    { variables: { appointmentId }, fetchPolicy: "network-only" },
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-24 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-24 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load PCQ data.
      </div>
    );
  }

  const pcq = data?.getPcqForAppointment;

  if (!pcq) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-10 text-center">
        <ClipboardList className="size-8 text-muted/50" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-text">No PCQ submitted</p>
          <p className="text-xs text-muted">
            The patient has not submitted a pre-consult questionnaire for this appointment.
          </p>
        </div>
      </div>
    );
  }

  const answerMap = new Map<string, PCQAnswer>(pcq.answers.map((a) => [a.questionId, a]));
  const sortedQuestions = [...pcq.questions].sort((a, b) => a.order - b.order);

  const statusColor =
    pcq.status === "SUBMITTED" ? "success"
    : pcq.status === "LOCKED" ? "primary"
    : "secondary";

  return (
    <div className="space-y-5">
      {/* PCQ header */}
      <div className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Pre-Consult Questionnaire</p>
            <p className="text-base font-semibold text-text">
              {pcq.template?.name ?? "Questionnaire"}
            </p>
          </div>
          <Badge variant={statusColor}>{pcq.status}</Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-muted">
          {pcq.template ? (
            <span>
              Type: <span className="capitalize text-text">{pcq.template.consultationType.replace(/_/g, " ")}</span>
            </span>
          ) : null}
          {pcq.templateVersion ? (
            <span>Version {pcq.templateVersion.versionNumber}</span>
          ) : null}
          {pcq.submittedAt ? (
            <span>Submitted {formatDate(pcq.submittedAt)}</span>
          ) : null}
          {pcq.lockedAt ? (
            <span>Locked {formatDate(pcq.lockedAt)}</span>
          ) : null}
        </div>
      </div>

      {/* Questions & answers */}
      {sortedQuestions.length === 0 ? (
        <p className="text-sm text-muted">No questions in this questionnaire.</p>
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map((q, idx) => {
            const answer = answerMap.get(q.id);
            return (
              <div key={q.id} className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-text">
                    <span className="mr-2 text-muted">{idx + 1}.</span>
                    {q.questionText}
                    {q.isRequired ? <span className="ml-1 text-danger">*</span> : null}
                  </p>
                  <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs text-muted border border-border capitalize">
                    {q.questionType.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="pl-5">
                  {renderAnswer(q, answer)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
