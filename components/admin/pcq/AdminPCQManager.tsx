"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Globe,
  ListChecks,
  Plus,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_APPROVE_PCQ_QUESTION_CONTRIBUTION_MUTATION,
  ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY,
  ADMIN_PCQ_TEMPLATES_QUERY,
  ADMIN_REJECT_PCQ_QUESTION_CONTRIBUTION_MUTATION,
} from "@/lib/admin/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

type StatusTab = "pending" | "approved" | "rejected" | "all";
type AlertState = { type: "success" | "error"; message: string } | null;

type Contribution = {
  id: string;
  templateId: string | null;
  consultationType: string;
  submittedByProviderId: string | null;
  submittedByProviderName: string | null;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number | null;
  options: string[] | string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: string | null;
  appliedQuestionId: string | null;
  createdAt: string;
};

type ContributionsData = {
  pcqQuestionContributions: Contribution[];
};

type PCQTemplate = {
  id: string;
  name: string;
  consultationType: string;
  status: string;
  specialtyId: string | null;
  isGlobal: boolean;
};

const STATUS_TABS: StatusTab[] = ["pending", "approved", "rejected", "all"];

function parseOptions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function InlineAlert({ alert, onDismiss }: Readonly<{ alert: AlertState; onDismiss: () => void }>) {
  if (!alert) return null;
  const isError = alert.type === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isError
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function ContributionCard({
  contribution,
  onDone,
}: Readonly<{
  contribution: Contribution;
  onDone: (alert: AlertState) => void;
}>) {
  const [expanded, setExpanded] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [templateId, setTemplateId] = useState(contribution.templateId ?? "");
  const [approve, { loading: approving }] = useMutation(
    ADMIN_APPROVE_PCQ_QUESTION_CONTRIBUTION_MUTATION,
  );
  const [reject, { loading: rejecting }] = useMutation(
    ADMIN_REJECT_PCQ_QUESTION_CONTRIBUTION_MUTATION,
  );

  const statusLower = contribution.status.toLowerCase();
  const isPending = statusLower === "pending";
  const busy = approving || rejecting;
  const options = parseOptions(contribution.options);

  async function handleApprove() {
    try {
      await approve({
        variables: {
          contributionId: contribution.id,
          templateId: templateId.trim() || undefined,
          adminNote: adminNote.trim() || undefined,
        },
        refetchQueries: [ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY],
      });
      setAdminNote("");
      onDone({ type: "success", message: "Contribution approved." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to approve contribution.") });
    }
  }

  async function handleReject() {
    try {
      await reject({
        variables: {
          contributionId: contribution.id,
          adminNote: adminNote.trim() || undefined,
        },
        refetchQueries: [ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY],
      });
      setAdminNote("");
      onDone({ type: "error", message: "Contribution rejected." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to reject contribution.") });
    }
  }

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface transition-all",
        isPending ? "border-warning/40 bg-warning/5" : "border-border",
      )}
    >
      <div className="px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
                  statusLower === "approved" && "bg-success/15 text-success",
                  statusLower === "pending" && "bg-warning/15 text-warning",
                  statusLower === "rejected" && "bg-danger/15 text-danger",
                )}
              >
                {contribution.status}
              </span>
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted">
                {formatLabel(contribution.consultationType)}
              </span>
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted">
                {formatLabel(contribution.questionType)}
              </span>
              {contribution.isRequired ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Required
                </span>
              ) : null}
            </div>

            <p className="text-base font-semibold text-text">{contribution.questionText}</p>

            {options.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {options.map((option) => (
                  <span
                    key={option}
                    className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                  >
                    {option}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-muted">
              Submitted by{" "}
              <span className="font-medium text-text">
                {contribution.submittedByProviderName ?? "Provider"}
              </span>{" "}
              · {formatDate(contribution.createdAt)}
            </p>

            {contribution.adminNote ? (
              <p className="rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted">
                Admin note: {contribution.adminNote}
              </p>
            ) : null}
          </div>

          {isPending ? (
            <div className="flex shrink-0 flex-col gap-2 sm:items-end">
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleApprove()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-success/85 disabled:opacity-50"
                >
                  <CheckCircle className="size-4" />
                  {approving ? "Approving…" : "Approve"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleReject()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-danger/85 disabled:opacity-50"
                >
                  <X className="size-4" />
                  {rejecting ? "Rejecting…" : "Reject"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                className="flex items-center gap-1 text-xs text-muted hover:text-text"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="size-3.5" /> Hide options
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" /> Add note / template
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="text-right text-xs text-muted">
              <p>Reviewed {formatDate(contribution.reviewedAt)}</p>
              {contribution.appliedQuestionId ? (
                <p className="mt-1 font-medium text-success">Applied to template</p>
              ) : null}
            </div>
          )}
        </div>

        {isPending && expanded ? (
          <div className="mt-4 grid gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`tmpl-${contribution.id}`} className="text-xs">
                Template ID override
              </Label>
              <Input
                id={`tmpl-${contribution.id}`}
                value={templateId}
                placeholder="Leave blank for active global template"
                onChange={(event) => setTemplateId(event.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`note-${contribution.id}`} className="text-xs">
                Admin note
              </Label>
              <Input
                id={`note-${contribution.id}`}
                value={adminNote}
                placeholder="Optional review note"
                onChange={(event) => setAdminNote(event.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ContributionQueue() {
  const [status, setStatus] = useState<StatusTab>("pending");
  const [alert, setAlert] = useState<AlertState>(null);
  const { data, loading, error } = useQuery<ContributionsData>(
    ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY,
    {
      variables: { status: status === "all" ? undefined : status },
      fetchPolicy: "cache-and-network",
    },
  );

  const allData = useQuery<ContributionsData>(ADMIN_PCQ_QUESTION_CONTRIBUTIONS_QUERY, {
    variables: { status: "pending" },
    fetchPolicy: "cache-and-network",
  });

  const pendingCount = allData.data?.pcqQuestionContributions?.length ?? 0;
  const contributions = data?.pcqQuestionContributions ?? [];

  return (
    <div className="space-y-5">
      {pendingCount > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3">
          <AlertCircle className="size-5 shrink-0 text-warning" />
          <p className="text-sm font-medium text-warning">
            {pendingCount} contribution{pendingCount !== 1 ? "s" : ""} waiting for review
          </p>
        </div>
      ) : null}

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatus(tab)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition",
              status === tab ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Unable to load contributions.
        </div>
      ) : null}

      {loading && contributions.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-border/50" />
          ))}
        </div>
      ) : null}

      {!loading && contributions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
          <ClipboardList className="size-9 text-muted/50" />
          <p className="text-sm font-medium text-text">No {status === "all" ? "" : status} contributions</p>
          <p className="text-xs text-muted">
            {status === "pending"
              ? "All caught up — nothing waiting for review."
              : "Nothing to show for this filter."}
          </p>
        </div>
      ) : null}

      <div className="space-y-3">
        {contributions.map((contribution) => (
          <ContributionCard key={contribution.id} contribution={contribution} onDone={setAlert} />
        ))}
      </div>
    </div>
  );
}

function TemplateList() {
  const { data, loading, error } = useQuery<{ pcqTemplates: PCQTemplate[] }>(
    ADMIN_PCQ_TEMPLATES_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const templates = data?.pcqTemplates ?? [];

  if (loading && templates.length === 0) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-border/50" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
        Unable to load templates.
      </p>
    );
  }
  if (templates.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        No templates yet. Create one below.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((template) => {
        const statusLower = template.status.toLowerCase();
        return (
          <Button
            key={template.id}
            href={`/admin/pcq/${template.id}`}
            variant="ghost"
            className="flex h-auto w-full items-center gap-3 rounded-xl border border-border px-4 py-3 text-left hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{template.name}</p>
              <p className="text-xs text-muted">{formatLabel(template.consultationType)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {template.isGlobal ? <Globe className="size-3.5 text-primary" /> : null}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                  statusLower === "active" ? "bg-success/15 text-success" : "bg-border/60 text-muted",
                )}
              >
                {template.status}
              </span>
              <ChevronRight className="size-4 text-muted" />
            </div>
          </Button>
        );
      })}
    </div>
  );
}

function TemplateManagement() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="size-5 text-primary" />
              Templates
            </CardTitle>
            <p className="mt-1 text-sm text-muted">
              Click a template to view and manage its questions.
            </p>
          </div>
          <Button href="/admin/pcq/new">
            <Plus className="size-4" />
            New Template
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <TemplateList />
      </CardContent>
    </Card>
  );
}

export function AdminPCQManager() {
  const [activeTab, setActiveTab] = useState<"queue" | "templates">("queue");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">PCQ Templates</h1>
        <p className="max-w-3xl text-sm text-muted">
          Review consultant question contributions, and manage global questionnaire templates.
        </p>
      </header>

      <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
        {[
          { key: "queue", label: "Contributions" },
          { key: "templates", label: "Template Management" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as "queue" | "templates")}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-semibold transition",
              activeTab === tab.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "queue" ? <ContributionQueue /> : <TemplateManagement />}
    </div>
  );
}
