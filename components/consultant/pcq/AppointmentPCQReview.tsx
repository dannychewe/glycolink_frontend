"use client";

import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle, ClipboardList, Send, X } from "lucide-react";
import {
  ASSIGN_PCQ_TO_APPOINTMENT_MUTATION,
  PCQ_FOR_APPOINTMENT_QUERY,
  PCQ_TEMPLATES_QUERY,
} from "@/lib/consultant/pcq-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

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
  patientId: string;
  assignedByProviderId: string | null;
  assignedByProviderName: string | null;
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

type TemplateItem = {
  id: string;
  name: string;
  consultationType: string;
  status: string;
  isGlobal: boolean;
  versions: {
    id: string;
    isCurrent: boolean;
    publishedAt: string | null;
  }[];
};

type AlertState = { type: "success" | "error"; message: string } | null;

const selectClass = "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

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

    case "number":
      if (answer.answerNumeric === null) return <span className="text-muted italic">—</span>;
      return <span className="font-semibold text-text">{answer.answerNumeric}</span>;

    case "single_select":
      return answer.answerText
        ? <Badge variant="primary">{answer.answerText}</Badge>
        : <span className="text-muted italic">—</span>;

    case "multi_select": {
      const values = Array.isArray(answer.answerJson)
        ? (answer.answerJson as unknown[]).map(String)
        : answer.answerText
          ? [answer.answerText]
          : [];
      if (values.length === 0) return <span className="text-muted italic">—</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => <Badge key={v} variant="primary">{v}</Badge>)}
        </div>
      );
    }

    case "json": {
      if (answer.answerJson == null) return <span className="text-muted italic">—</span>;
      return (
        <pre className="overflow-x-auto rounded-lg bg-background px-3 py-2 text-xs text-text">
          {JSON.stringify(answer.answerJson, null, 2)}
        </pre>
      );
    }

    case "text":
    case "long_text":
    case "date":
    default:
      return answer.answerText
        ? <p className="text-sm leading-6 text-text whitespace-pre-wrap">{answer.answerText}</p>
        : <span className="text-muted italic">—</span>;
  }
}

function InlineAlert({ alert, onDismiss }: Readonly<{ alert: AlertState; onDismiss: () => void }>) {
  if (!alert) return null;
  const isError = alert.type === "error";

  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function AppointmentPcqAssignmentForm({
  appointmentId,
  onAssigned,
}: Readonly<{ appointmentId: string; onAssigned: () => void }>) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [templateId, setTemplateId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [reason, setReason] = useState("");

  const { data, loading } = useQuery<{ pcqTemplates: TemplateItem[] }>(
    PCQ_TEMPLATES_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const [assign, { loading: assigning }] = useMutation(ASSIGN_PCQ_TO_APPOINTMENT_MUTATION);

  const assignable = useMemo(
    () =>
      (data?.pcqTemplates ?? []).filter(
        (template) =>
          !template.isGlobal &&
          template.status.toLowerCase() === "active" &&
          template.versions.some((version) => version.isCurrent && version.publishedAt),
      ),
    [data],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    if (!templateId) {
      setAlert({ type: "error", message: "Select a template to assign." });
      return;
    }

    try {
      await assign({
        variables: {
          data: {
            appointmentId,
            templateId,
            dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
            reason: reason.trim() || undefined,
          },
        },
      });
      setAlert({ type: "success", message: "Appointment questionnaire assigned. The patient will see it as a pending action." });
      setTemplateId("");
      setDueAt("");
      setReason("");
      onAssigned();
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to assign appointment questionnaire.") });
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text">Assign appointment PCQ</p>
        <p className="text-xs text-muted">
          Request extra answers before this appointment. This is separate from the baseline questionnaire.
        </p>
      </div>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appointment-pcq-template">Template <span className="text-danger">*</span></Label>
          <select
            id="appointment-pcq-template"
            className={selectClass}
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            disabled={loading}
          >
            <option value="">Select an active template</option>
            {assignable.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name} ({template.consultationType.replace(/_/g, " ")})
              </option>
            ))}
          </select>
          {!loading && assignable.length === 0 ? (
            <p className="text-xs text-muted">
              No active supplemental templates with a published version are available yet.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointment-pcq-due">Due date (optional)</Label>
          <input
            id="appointment-pcq-due"
            type="datetime-local"
            className={selectClass}
            value={dueAt}
            onChange={(event) => setDueAt(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="appointment-pcq-reason">Reason (optional)</Label>
          <Textarea
            id="appointment-pcq-reason"
            placeholder="e.g. Symptoms update before the video consultation."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-[72px] text-sm"
          />
        </div>

        <Button type="submit" variant="primary" disabled={assigning || !templateId}>
          <Send className="size-4" />
          {assigning ? "Assigning..." : "Assign Questionnaire"}
        </Button>
      </form>
    </div>
  );
}

export function AppointmentPCQReview({ appointmentId }: { appointmentId: string }) {
  const { data, loading, error, refetch } = useQuery<{ getPcqForAppointment: PCQData | null }>(
    PCQ_FOR_APPOINTMENT_QUERY,
    { variables: { appointmentId }, fetchPolicy: "network-only" },
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-lg bg-border/40" />
        <div className="h-24 animate-pulse rounded-lg bg-border/40" />
        <div className="h-24 animate-pulse rounded-lg bg-border/40" />
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
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
          <ClipboardList className="size-8 text-muted/50" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">No appointment PCQ assigned</p>
            <p className="text-xs text-muted">
              No appointment questionnaire has been assigned. This does not block the consultation.
            </p>
          </div>
        </div>
        <AppointmentPcqAssignmentForm appointmentId={appointmentId} onAssigned={() => void refetch()} />
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
      <div className="rounded-lg border border-border bg-surface px-5 py-4 space-y-3">
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
          {pcq.assignedByProviderName ? (
            <span>Assigned by {pcq.assignedByProviderName}</span>
          ) : null}
          {pcq.dueAt ? (
            <span>Due {formatDate(pcq.dueAt)}</span>
          ) : null}
          {pcq.submittedAt ? (
            <span>Submitted {formatDate(pcq.submittedAt)}</span>
          ) : null}
          {pcq.lockedAt ? (
            <span>Locked {formatDate(pcq.lockedAt)}</span>
          ) : null}
        </div>

        {pcq.assignmentReason ? (
          <p className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted">
            Reason: {pcq.assignmentReason}
          </p>
        ) : null}
      </div>

      {/* Questions & answers */}
      {sortedQuestions.length === 0 ? (
        <p className="text-sm text-muted">No questions in this questionnaire.</p>
      ) : (
        <div className="space-y-3">
          {sortedQuestions.map((q, idx) => {
            const answer = answerMap.get(q.id);
            return (
              <div key={q.id} className="rounded-lg border border-border bg-surface px-5 py-4 space-y-2">
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
