"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Plus,
} from "lucide-react";
import {
  PCQ_RESPONSE_QUERY,
  SEND_PCQ_REMINDER_MUTATION,
} from "@/lib/consultant/pcq-graphql";
import type { WorkspacePcqResponse } from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    timeZone: "Africa/Lusaka",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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
): "success" | "warning" | "danger" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (["submitted", "locked"].includes(s)) return "success";
  if (["in_progress", "draft"].includes(s)) return "warning";
  return "secondary";
}

function isOverdue(response: WorkspacePcqResponse) {
  if (!response.dueAt) return false;
  const s = (response.status ?? "").toLowerCase();
  if (["submitted", "locked"].includes(s)) return false;
  return new Date(response.dueAt) < new Date();
}

type PcqQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  options: unknown;
};

type PcqAnswer = {
  id: string;
  questionId: string;
  answerText: string | null;
  answerNumeric: number | null;
  answerBoolean: boolean | null;
  answerJson: unknown;
};

type PcqResponseDetail = {
  id: string;
  status: string | null;
  responseScope: string | null;
  submittedAt: string | null;
  template: { id: string; name: string } | null;
  questions: PcqQuestion[];
  answers: PcqAnswer[];
};

function formatAnswer(
  question: PcqQuestion,
  answer: PcqAnswer | undefined,
): string {
  if (!answer) return "Not answered";

  if (answer.answerBoolean != null) return answer.answerBoolean ? "Yes" : "No";

  if (answer.answerNumeric != null) return String(answer.answerNumeric);

  if (answer.answerText) return answer.answerText;

  if (answer.answerJson != null) {
    const val = answer.answerJson;
    if (Array.isArray(val)) return val.join(", ");
    if (typeof val === "string") return val;
    return JSON.stringify(val);
  }

  return "Not answered";
}

function ResponseDetailModal({
  responseId,
  templateName,
  onClose,
}: {
  responseId: string;
  templateName: string;
  onClose: () => void;
}) {
  const { data, loading, error } = useQuery<{
    pcqResponse: PcqResponseDetail;
  }>(PCQ_RESPONSE_QUERY, {
    variables: { id: responseId },
    fetchPolicy: "cache-and-network",
  });

  const response = data?.pcqResponse;
  const sortedQuestions = [...(response?.questions ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <DetailModal
      title={templateName}
      subtitle={
        response
          ? `${titleCase(response.responseScope)} · ${titleCase(response.status)}`
          : undefined
      }
      className="sm:max-w-2xl"
      onClose={onClose}
      footer={
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded bg-border/40" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-danger">
          Unable to load questionnaire responses.
        </p>
      ) : response ? (
        <div className="space-y-4">
          {response.submittedAt ? (
            <p className="text-xs text-muted">
              Submitted {formatDateTime(response.submittedAt)}
            </p>
          ) : null}
          {sortedQuestions.length === 0 ? (
            <p className="text-sm text-muted">
              No questions in this questionnaire.
            </p>
          ) : (
            <ol className="divide-y divide-border border border-border">
              {sortedQuestions.map((q, idx) => {
                const answer = response.answers.find(
                  (a) => a.questionId === q.id,
                );
                const answered = answer != null;
                return (
                  <li key={q.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-text">
                      <span className="mr-2 tabular-nums text-muted">
                        {idx + 1}.
                      </span>
                      {q.questionText}
                      {q.isRequired ? (
                        <span className="ml-1 text-danger">*</span>
                      ) : null}
                    </p>
                    <p
                      className={`mt-1.5 text-sm ${answered ? "text-text" : "text-muted italic"}`}
                    >
                      {formatAnswer(q, answer)}
                    </p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      ) : null}
    </DetailModal>
  );
}

export function PatientQuestionnairesTab({
  pcqResponses,
  onAssign,
}: Readonly<{
  pcqResponses: WorkspacePcqResponse[];
  onAssign: () => void;
}>) {
  const [viewing, setViewing] = useState<WorkspacePcqResponse | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [sendReminder] = useMutation(SEND_PCQ_REMINDER_MUTATION);

  async function handleSendReminder(responseId: string) {
    setSendingReminder(responseId);
    setReminderError(null);
    try {
      await sendReminder({ variables: { responseId } });
      setReminderSent((prev) => new Set(prev).add(responseId));
    } catch {
      setReminderError("Unable to send reminder. Please try again.");
    } finally {
      setSendingReminder(null);
    }
  }

  const overdueCount = pcqResponses.filter(isOverdue).length;

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-text">
          <FileText className="size-4 text-primary" />
          Questionnaires
          <span className="text-xs font-medium tabular-nums text-muted">
            {pcqResponses.length}
          </span>
        </h2>
        <Button type="button" size="sm" onClick={onAssign}>
          <Plus className="size-4" />
          Assign questionnaire
        </Button>
      </header>

      {overdueCount > 0 ? (
        <div className="flex items-center gap-2 border border-warning/40 bg-warning/5 px-4 py-2.5 text-sm text-warning">
          <Clock className="size-4" />
          {overdueCount} overdue questionnaire{overdueCount !== 1 ? "s" : ""}
        </div>
      ) : null}

      {reminderError ? (
        <p role="alert" className="text-sm text-danger">
          {reminderError}
        </p>
      ) : null}

      {pcqResponses.length === 0 ? (
        <p className="border-y border-border py-8 text-center text-sm text-muted">
          No questionnaires assigned.
        </p>
      ) : (
        <div className="space-y-2">
          {pcqResponses.map((p) => {
            const overdue = isOverdue(p);
            const submitted =
              (p.status ?? "").toLowerCase() === "submitted";

            const canRemind =
              !submitted && !reminderSent.has(p.id);

            return (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 border border-border p-4"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
                  onClick={() => setViewing(p)}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">
                      {p.template.name}
                    </span>
                    <Badge
                      className="rounded-md tracking-normal"
                      variant={statusVariant(p.status)}
                    >
                      {titleCase(p.status)}
                    </Badge>
                    {overdue ? (
                      <Badge
                        className="rounded-md tracking-normal"
                        variant="danger"
                      >
                        Overdue
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {titleCase(p.responseScope)}
                    {p.dueAt ? ` · Due ${formatDate(p.dueAt)}` : ""}
                    {p.submittedAt
                      ? ` · Submitted ${formatDate(p.submittedAt)}`
                      : ""}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-2">
                  {submitted ? (
                    <span className="text-xs font-medium text-primary">
                      View answers
                    </span>
                  ) : canRemind ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={sendingReminder === p.id}
                      onClick={() => void handleSendReminder(p.id)}
                    >
                      <Bell className="size-4" />
                      {sendingReminder === p.id ? "Sending..." : "Remind"}
                    </Button>
                  ) : reminderSent.has(p.id) ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 className="size-3" />
                      Sent
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewing ? (
        <ResponseDetailModal
          responseId={viewing.id}
          templateName={viewing.template.name}
          onClose={() => setViewing(null)}
        />
      ) : null}
    </div>
  );
}
