"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CheckCircle, AlertCircle, Send, ClipboardList } from "lucide-react";
import {
  ACTIVE_PCQ_TEMPLATE_QUERY,
  ACTIVE_PCQ_TEMPLATE_VERSION_QUERY,
  CONSULTATION_TYPE_OPTIONS,
  MY_PCQ_QUESTION_CONTRIBUTIONS_QUERY,
  PCQ_QUESTION_TYPE_OPTIONS,
  SUBMIT_PCQ_QUESTION_CONTRIBUTION_MUTATION,
} from "@/lib/consultant/pcq-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

function parseOptions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw) as string[]; } catch { return []; }
}

type PCQTemplate = {
  id: string;
  name: string;
  consultationType: string;
  status: string;
  specialtyId: string | null;
  isGlobal: boolean;
};

type PCQTemplateVersion = {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  publishedAt: string | null;
  questions: {
    id: string;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    order: number;
    options: string[] | string | null;
  }[];
};

type Contribution = {
  id: string;
  status: string;
  consultationType: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number | null;
  options: string[] | null;
  adminNote: string | null;
  appliedQuestionId: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

function InlineAlert({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Active Template View ─────────────────────────────────

function ActiveTemplateView({ consultationType }: { consultationType: string }) {
  const { data: tplData, loading: tplLoading } = useQuery<{ activePcqTemplate: PCQTemplate | null }>(
    ACTIVE_PCQ_TEMPLATE_QUERY,
    { variables: { consultationType }, fetchPolicy: "cache-and-network" },
  );
  const { data: versionData, loading: versionLoading } = useQuery<{ activePcqTemplateVersion: PCQTemplateVersion | null }>(
    ACTIVE_PCQ_TEMPLATE_VERSION_QUERY,
    { variables: { consultationType }, fetchPolicy: "cache-and-network" },
  );

  const loading = tplLoading || versionLoading;
  const template = tplData?.activePcqTemplate;
  const version = versionData?.activePcqTemplateVersion;

  if (loading && !template) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
        <ClipboardList className="size-8 text-muted" />
        <p className="text-sm text-muted">No active template for this consultation type.</p>
      </div>
    );
  }

  const sortedQuestions = version ? [...version.questions].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-surface px-5 py-4 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-text">{template.name}</p>
            <p className="text-xs text-muted capitalize">{template.consultationType.replace(/_/g, " ")} · {template.status}</p>
          </div>
          <div className="flex gap-1.5">
            {template.isGlobal ? <Badge variant="primary">Global</Badge> : null}
            <Badge variant="secondary">{template.status}</Badge>
          </div>
        </div>
      </div>

      {version ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Version {version.versionNumber} · {sortedQuestions.length} question{sortedQuestions.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {sortedQuestions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <span className="mt-0.5 text-xs font-bold text-muted">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">{q.questionText}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted border border-border capitalize">
                      {q.questionType}
                    </span>
                    {q.isRequired ? <Badge variant="primary">Required</Badge> : null}
                    {parseOptions(q.options).map((opt) => (
                      <span key={opt} className="rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary">{opt}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">No published version yet.</p>
      )}
    </div>
  );
}

// ─── Contribution Form ────────────────────────────────────

const BLANK_FORM = {
  consultationType: "initial",
  questionText: "",
  questionType: "text",
  isRequired: false,
  optionsCsv: "",
};

function ContributionForm() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [submit, { loading }] = useMutation(SUBMIT_PCQ_QUESTION_CONTRIBUTION_MUTATION);

  const needsOptions = form.questionType === "select" || form.questionType === "single_select";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      const options = needsOptions
        ? form.optionsCsv.split(",").map((s) => s.trim()).filter(Boolean)
        : null;
      await submit({
        variables: {
          data: {
            consultationType: form.consultationType,
            questionText: form.questionText,
            questionType: form.questionType,
            isRequired: form.isRequired,
            options,
          },
        },
        refetchQueries: [MY_PCQ_QUESTION_CONTRIBUTIONS_QUERY],
      });
      setAlert({ type: "success", message: "Contribution submitted for admin review." });
      setForm(BLANK_FORM);
    } catch {
      setAlert({ type: "error", message: "Failed to submit contribution. Please try again." });
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-text">Suggest a Question</p>
        <p className="text-xs text-muted">
          Submit a question for admin review. Approved questions may be added to the active template.
        </p>
      </div>
      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cType">Consultation type</Label>
          <select
            id="cType"
            className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            value={form.consultationType}
            onChange={(e) => setForm((p) => ({ ...p, consultationType: e.target.value }))}
          >
            {CONSULTATION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="qText">Question text <span className="text-danger">*</span></Label>
          <Input
            id="qText"
            placeholder="e.g. How long have you had this condition?"
            value={form.questionText}
            onChange={(e) => setForm((p) => ({ ...p, questionText: e.target.value }))}
            required
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="qType">Answer type</Label>
            <select
              id="qType"
              className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.questionType}
              onChange={(e) => setForm((p) => ({ ...p, questionType: e.target.value, optionsCsv: "" }))}
            >
              {PCQ_QUESTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {needsOptions ? (
            <div className="space-y-2">
              <Label htmlFor="qOptions">Options (comma-separated) <span className="text-danger">*</span></Label>
              <Input
                id="qOptions"
                placeholder="e.g. Yes, No, Sometimes"
                value={form.optionsCsv}
                onChange={(e) => setForm((p) => ({ ...p, optionsCsv: e.target.value }))}
                required={needsOptions}
              />
            </div>
          ) : null}
        </div>

        <label className="flex items-center gap-2 text-sm text-text cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRequired}
            onChange={(e) => setForm((p) => ({ ...p, isRequired: e.target.checked }))}
          />
          Mark as required
        </label>

        <Button type="submit" variant="primary" disabled={loading}>
          <Send className="size-4" />
          {loading ? "Submitting..." : "Submit Contribution"}
        </Button>
      </form>
    </div>
  );
}

// ─── My Contributions List ────────────────────────────────

const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const STATUS_VARIANT: Record<string, "primary" | "secondary" | "success" | "danger" | "warning"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

function MyContributions() {
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");

  const { data, loading } = useQuery<{ pcqQuestionContributions: Contribution[] }>(
    MY_PCQ_QUESTION_CONTRIBUTIONS_QUERY,
    {
      variables: { status: statusFilter === "all" ? undefined : statusFilter },
      fetchPolicy: "cache-and-network",
    },
  );

  const contributions = data?.pcqQuestionContributions ?? [];

  return (
    <div className="space-y-4">
      {/* Status tabs */}
      <div className="flex gap-1 rounded-xl bg-surface border border-border p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
              statusFilter === tab
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-text",
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && contributions.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-surface animate-pulse" />
          ))}
        </div>
      ) : contributions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
          <ClipboardList className="size-8 text-muted" />
          <p className="text-sm text-muted">
            {statusFilter === "all"
              ? "You haven't submitted any question contributions yet."
              : `No ${statusFilter} contributions.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contributions.map((c) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface px-4 py-3.5 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-text">{c.questionText}</p>
                <Badge variant={STATUS_VARIANT[c.status] ?? "secondary"} className="capitalize shrink-0">
                  {c.status}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted border border-border capitalize">
                  {c.consultationType.replace(/_/g, " ")}
                </span>
                <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted border border-border capitalize">
                  {c.questionType}
                </span>
                {c.isRequired ? <Badge variant="primary">Required</Badge> : null}
                {parseOptions(c.options).map((opt) => (
                  <span key={opt} className="rounded-full bg-primary/8 px-2 py-0.5 text-xs text-primary">{opt}</span>
                ))}
              </div>
              {c.adminNote ? (
                <p className="text-xs text-muted italic">Admin note: {c.adminNote}</p>
              ) : null}
              {c.appliedQuestionId ? (
                <p className="text-xs text-success">Applied to active template.</p>
              ) : null}
              <p className="text-xs text-muted">
                Submitted {new Date(c.createdAt).toLocaleDateString()}
                {c.reviewedAt ? ` · Reviewed ${new Date(c.reviewedAt).toLocaleDateString()}` : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────

type ActiveTab = "template" | "contribute" | "contributions";

export function PCQTemplateManager() {
  const [activeConsultationType, setActiveConsultationType] = useState("initial");
  const [activeTab, setActiveTab] = useState<ActiveTab>("template");

  const tabs: { key: ActiveTab; label: string }[] = [
    { key: "template", label: "Active Template" },
    { key: "contribute", label: "Suggest Question" },
    { key: "contributions", label: "My Contributions" },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-surface border border-border p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
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

      {/* Active Template */}
      {activeTab === "template" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text">Viewing template for:</p>
            <select
              className="rounded-xl border border-border bg-background px-3 py-1.5 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={activeConsultationType}
              onChange={(e) => setActiveConsultationType(e.target.value)}
            >
              {CONSULTATION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <ActiveTemplateView consultationType={activeConsultationType} />
        </div>
      ) : null}

      {/* Contribute */}
      {activeTab === "contribute" ? <ContributionForm /> : null}

      {/* My Contributions */}
      {activeTab === "contributions" ? <MyContributions /> : null}
    </div>
  );
}
