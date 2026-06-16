"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  GitBranchPlus,
  Globe,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADD_PCQ_QUESTION_MUTATION,
  CONSULTATION_TYPE_OPTIONS,
  CREATE_PCQ_TEMPLATE_VERSION_MUTATION,
  DELETE_PCQ_QUESTION_MUTATION,
  DELETE_PCQ_TEMPLATE_MUTATION,
  PCQ_QUESTION_TYPE_OPTIONS,
  PCQ_TEMPLATE_DETAIL_QUERY,
  PCQ_TEMPLATES_QUERY,
  PUBLISH_PCQ_TEMPLATE_VERSION_MUTATION,
  UPDATE_PCQ_QUESTION_MUTATION,
  UPDATE_PCQ_TEMPLATE_MUTATION,
} from "@/lib/consultant/pcq-graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

type PCQQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number | null;
  options: string[] | string | null;
};

type PCQTemplateVersion = {
  id: string;
  versionNumber: number;
  isCurrent: boolean;
  publishedAt: string | null;
  questions: PCQQuestion[];
};

type PCQTemplate = {
  id: string;
  name: string;
  consultationType: string;
  status: string;
  specialtyId: string | null;
  isGlobal: boolean;
  versions: PCQTemplateVersion[];
};

function parseOptions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not published";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function needsOptions(type: string) {
  return type === "single_select" || type === "multi_select";
}

function selectClass() {
  return "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
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

// ─── Edit Template Form ────────────────────────────────────

function EditTemplateForm({
  template,
  onDone,
}: Readonly<{ template: PCQTemplate; onDone: (alert: AlertState) => void }>) {
  const [form, setForm] = useState({
    name: template.name,
    consultationType: template.consultationType,
    status: template.status,
  });
  const [updateTemplate, { loading }] = useMutation(UPDATE_PCQ_TEMPLATE_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await updateTemplate({
        variables: {
          templateId: template.id,
          data: { name: form.name, consultationType: form.consultationType, status: form.status },
        },
        refetchQueries: [
          { query: PCQ_TEMPLATE_DETAIL_QUERY, variables: { id: template.id } },
          PCQ_TEMPLATES_QUERY,
        ],
      });
      onDone({ type: "success", message: "Template updated." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to update template.") });
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            value={form.name}
            onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-type">Consultation type</Label>
          <select
            id="edit-type"
            className={selectClass()}
            value={form.consultationType}
            onChange={(e) => setForm((c) => ({ ...c, consultationType: e.target.value }))}
          >
            {CONSULTATION_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-status">Status</Label>
          <select
            id="edit-status"
            className={selectClass()}
            value={form.status}
            onChange={(e) => setForm((c) => ({ ...c, status: e.target.value }))}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

// ─── Question Card ─────────────────────────────────────────

function QuestionCard({
  question,
  templateId,
  readOnly,
  onDone,
}: Readonly<{ question: PCQQuestion; templateId: string; readOnly: boolean; onDone: (alert: AlertState) => void }>) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    questionText: question.questionText,
    questionType: question.questionType,
    isRequired: question.isRequired,
    order: String(question.order ?? ""),
    optionsCsv: parseOptions(question.options).join(", "),
  });

  const [updateQuestion, { loading: updating }] = useMutation(UPDATE_PCQ_QUESTION_MUTATION);
  const [deleteQuestion, { loading: deleting }] = useMutation(DELETE_PCQ_QUESTION_MUTATION);

  const options = parseOptions(question.options);
  const refetch = [{ query: PCQ_TEMPLATE_DETAIL_QUERY, variables: { id: templateId } }];

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    try {
      await updateQuestion({
        variables: {
          questionId: question.id,
          data: {
            questionText: form.questionText,
            questionType: form.questionType,
            isRequired: form.isRequired,
            order: form.order ? Number(form.order) : undefined,
            options: needsOptions(form.questionType)
              ? form.optionsCsv.split(",").map((s) => s.trim()).filter(Boolean)
              : null,
          },
        },
        refetchQueries: refetch,
      });
      setEditing(false);
      onDone({ type: "success", message: "Question updated." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to update question.") });
    }
  }

  async function handleDelete() {
    try {
      await deleteQuestion({ variables: { questionId: question.id }, refetchQueries: refetch });
      onDone({ type: "success", message: "Question deleted." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to delete question.") });
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-surface">
      <div className="flex gap-4 px-5 py-4">
        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {question.order ?? "–"}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="text-sm font-semibold text-text">{question.questionText}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs text-muted">
              {formatLabel(question.questionType)}
            </span>
            {question.isRequired ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">Required</span>
            ) : (
              <span className="rounded-full bg-border/60 px-2.5 py-0.5 text-xs text-muted">Optional</span>
            )}
            {options.map((opt) => (
              <span key={opt} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted">{opt}</span>
            ))}
          </div>
        </div>
        {!readOnly ? (
          <div className="flex shrink-0 items-start gap-1.5">
            <button
              type="button"
              onClick={() => { setEditing((v) => !v); setConfirmDelete(false); }}
              className="rounded-lg p-1.5 text-muted hover:bg-border/40 hover:text-text"
              title="Edit question"
            >
              <Pencil className="size-3.5" />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={deleting}
                  onClick={() => void handleDelete()}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg p-1.5 text-muted hover:bg-border/40"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setEditing(false); }}
                className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                title="Delete question"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </div>

      {editing && !readOnly ? (
        <div className="border-t border-border px-5 py-4">
          <form onSubmit={(e) => void handleUpdate(e)} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`qt-${question.id}`} className="text-xs">Question text</Label>
              <Textarea
                id={`qt-${question.id}`}
                value={form.questionText}
                onChange={(e) => setForm((c) => ({ ...c, questionText: e.target.value }))}
                className="min-h-[72px] text-sm"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor={`qtype-${question.id}`} className="text-xs">Type</Label>
                <select
                  id={`qtype-${question.id}`}
                  className={selectClass()}
                  value={form.questionType}
                  onChange={(e) => setForm((c) => ({ ...c, questionType: e.target.value, optionsCsv: "" }))}
                >
                  {PCQ_QUESTION_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`qorder-${question.id}`} className="text-xs">Order</Label>
                <Input
                  id={`qorder-${question.id}`}
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => setForm((c) => ({ ...c, order: e.target.value }))}
                  className="h-11"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={form.isRequired}
                    onChange={(e) => setForm((c) => ({ ...c, isRequired: e.target.checked }))}
                  />
                  Required
                </label>
              </div>
            </div>
            {needsOptions(form.questionType) ? (
              <div className="space-y-2">
                <Label htmlFor={`qopts-${question.id}`} className="text-xs">Options</Label>
                <Input
                  id={`qopts-${question.id}`}
                  value={form.optionsCsv}
                  placeholder="Comma-separated options"
                  onChange={(e) => setForm((c) => ({ ...c, optionsCsv: e.target.value }))}
                />
              </div>
            ) : null}
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={updating}>
                {updating ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

// ─── Add Question Form ─────────────────────────────────────

function AddQuestionForm({
  versionId,
  templateId,
  onDone,
  onCancel,
}: Readonly<{ versionId: string; templateId: string; onDone: (alert: AlertState) => void; onCancel: () => void }>) {
  const [form, setForm] = useState({
    questionText: "",
    questionType: "text",
    isRequired: false,
    order: "",
    optionsCsv: "",
  });
  const [addQuestion, { loading }] = useMutation(ADD_PCQ_QUESTION_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      await addQuestion({
        variables: {
          versionId,
          data: {
            questionText: form.questionText,
            questionType: form.questionType,
            isRequired: form.isRequired,
            order: form.order ? Number(form.order) : undefined,
            options: needsOptions(form.questionType)
              ? form.optionsCsv.split(",").map((s) => s.trim()).filter(Boolean)
              : undefined,
          },
        },
        refetchQueries: [{ query: PCQ_TEMPLATE_DETAIL_QUERY, variables: { id: templateId } }],
      });
      setForm({ questionText: "", questionType: "text", isRequired: false, order: "", optionsCsv: "" });
      onDone({ type: "success", message: "Question added." });
    } catch (error) {
      onDone({ type: "error", message: getGraphQLErrorMessage(error, "Unable to add question.") });
    }
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 px-5 py-4">
      <p className="mb-3 text-sm font-semibold text-text">New question</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="new-qt" className="text-xs">Question text</Label>
          <Textarea
            id="new-qt"
            value={form.questionText}
            onChange={(e) => setForm((c) => ({ ...c, questionText: e.target.value }))}
            className="min-h-[72px] text-sm"
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="new-qtype" className="text-xs">Type</Label>
            <select
              id="new-qtype"
              className={selectClass()}
              value={form.questionType}
              onChange={(e) => setForm((c) => ({ ...c, questionType: e.target.value, optionsCsv: "" }))}
            >
              {PCQ_QUESTION_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-qorder" className="text-xs">Order</Label>
            <Input
              id="new-qorder"
              type="number"
              min="1"
              value={form.order}
              placeholder="Append if blank"
              onChange={(e) => setForm((c) => ({ ...c, order: e.target.value }))}
              className="h-11"
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={form.isRequired}
                onChange={(e) => setForm((c) => ({ ...c, isRequired: e.target.checked }))}
              />
              Required
            </label>
          </div>
        </div>
        {needsOptions(form.questionType) ? (
          <div className="space-y-2">
            <Label htmlFor="new-qopts" className="text-xs">Options</Label>
            <Input
              id="new-qopts"
              value={form.optionsCsv}
              placeholder="Comma-separated options"
              onChange={(e) => setForm((c) => ({ ...c, optionsCsv: e.target.value }))}
              required
            />
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button type="submit" size="sm" disabled={loading}>
            <Plus className="size-4" />
            {loading ? "Adding…" : "Add Question"}
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────

export function ConsultantPCQTemplateBuilder({ templateId }: Readonly<{ templateId: string }>) {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [editingTemplate, setEditingTemplate] = useState(false);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [addingQuestion, setAddingQuestion] = useState(false);

  const { data, loading, error } = useQuery<{ pcqTemplate: PCQTemplate }>(
    PCQ_TEMPLATE_DETAIL_QUERY,
    { variables: { id: templateId }, fetchPolicy: "cache-and-network" },
  );

  const [createVersion, { loading: creatingVersion }] = useMutation(CREATE_PCQ_TEMPLATE_VERSION_MUTATION);
  const [publishVersion, { loading: publishing }] = useMutation(PUBLISH_PCQ_TEMPLATE_VERSION_MUTATION);
  const [deleteTemplate, { loading: deletingTemplate }] = useMutation(DELETE_PCQ_TEMPLATE_MUTATION);

  const template = data?.pcqTemplate;
  const readOnly = template?.isGlobal ?? false;
  const versions = template?.versions ?? [];
  const currentVersion = versions.find((v) => v.isCurrent) ?? versions[0] ?? null;
  const displayVersion = versions.find((v) => v.id === selectedVersionId) ?? currentVersion;
  const sortedQuestions = displayVersion
    ? [...displayVersion.questions].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    : [];

  const refetchDetail = [{ query: PCQ_TEMPLATE_DETAIL_QUERY, variables: { id: templateId } }];

  async function handleCreateVersion() {
    try {
      const result = await createVersion({ variables: { templateId }, refetchQueries: refetchDetail });
      const newId = result.data?.createPcqTemplateVersion?.templateVersion?.id;
      if (newId) setSelectedVersionId(newId);
      setAlert({ type: "success", message: "New draft version created." });
    } catch (err) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(err, "Unable to create version.") });
    }
  }

  async function handlePublish(versionId: string) {
    try {
      await publishVersion({ variables: { versionId }, refetchQueries: refetchDetail });
      setAlert({ type: "success", message: "Version published and set as current." });
    } catch (err) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(err, "Unable to publish version.") });
    }
  }

  async function handleDeleteTemplate() {
    try {
      await deleteTemplate({ variables: { templateId }, refetchQueries: [PCQ_TEMPLATES_QUERY] });
      router.push("/consultant/pcq");
    } catch (err) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(err, "Unable to delete template.") });
      setConfirmDeleteTemplate(false);
    }
  }

  if (loading && !template) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-border/50" />
        <div className="h-24 animate-pulse rounded-2xl bg-border/50" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Button href="/consultant/pcq" variant="ghost" size="sm">
          <ArrowLeft className="size-4" /> Back to PCQ Templates
        </Button>
        <div className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 px-5 py-4">
          <AlertCircle className="size-5 shrink-0 text-danger" />
          <p className="text-sm text-danger">Unable to load this template.</p>
        </div>
      </div>
    );
  }

  const statusLower = template.status.toLowerCase();

  return (
    <div className="space-y-6">
      <Button href="/consultant/pcq" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" /> Back to PCQ Templates
      </Button>

      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Consultant Workspace · PCQ Templates
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">{template.name}</h1>
        </div>
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => { setEditingTemplate((v) => !v); setConfirmDeleteTemplate(false); }}
            >
              <Pencil className="size-4" />
              {editingTemplate ? "Cancel edit" : "Edit"}
            </Button>
            {confirmDeleteTemplate ? (
              <>
                <button
                  type="button"
                  disabled={deletingTemplate}
                  onClick={() => void handleDeleteTemplate()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-white hover:bg-danger/85 disabled:opacity-50"
                >
                  {deletingTemplate ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteTemplate(false)}
                  className="rounded-lg p-2 text-muted hover:bg-border/40"
                >
                  <X className="size-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => { setConfirmDeleteTemplate(true); setEditingTemplate(false); }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 px-3 py-2 text-xs font-semibold text-danger hover:bg-danger/5"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            )}
          </div>
        ) : null}
      </div>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {readOnly ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-text">
          <Globe className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            This is the global baseline questionnaire. It is read-only here — use{" "}
            <span className="font-semibold">Suggest Question</span> to propose changes for admin review.
          </p>
        </div>
      ) : null}

      {/* ── Edit template form ── */}
      {editingTemplate && !readOnly ? (
        <Card>
          <CardContent className="pt-5">
            <EditTemplateForm
              template={template}
              onDone={(a) => { setAlert(a); setEditingTemplate(false); }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-border bg-background px-3 py-1 text-sm text-muted">
            {formatLabel(template.consultationType)}
          </span>
          {template.isGlobal ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
              <Globe className="size-3.5" /> Global
            </span>
          ) : null}
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold capitalize",
            statusLower === "active" ? "bg-success/15 text-success" : "bg-border/60 text-muted",
          )}>
            {template.status}
          </span>
        </div>
      )}

      {/* ── Versions ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitBranchPlus className="size-5 text-primary" />
              Versions
              <Badge variant="secondary">{versions.length}</Badge>
            </CardTitle>
            {!readOnly ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={creatingVersion}
                onClick={() => void handleCreateVersion()}
              >
                <Plus className="size-4" />
                {creatingVersion ? "Creating…" : "New Version"}
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No versions yet. Create a version to start adding questions.
            </p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 transition cursor-pointer",
                    displayVersion?.id === v.id ? "border-primary bg-primary/5" : "border-border bg-surface hover:border-primary/30",
                  )}
                  onClick={() => setSelectedVersionId(v.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-text">v{v.versionNumber}</span>
                      {v.isCurrent ? (
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">
                          Current
                        </span>
                      ) : null}
                      <span className="text-xs text-muted">{formatDate(v.publishedAt)}</span>
                    </div>
                  </div>
                  {!v.isCurrent && !readOnly ? (
                    <button
                      type="button"
                      disabled={publishing}
                      onClick={(e) => { e.stopPropagation(); void handlePublish(v.id); }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50"
                    >
                      <Upload className="size-3.5" />
                      Publish
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Questions ── */}
      {displayVersion ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="size-5 text-primary" />
                Questions — v{displayVersion.versionNumber}
                <Badge variant="secondary">{sortedQuestions.length}</Badge>
              </CardTitle>
              {!addingQuestion && !readOnly ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => setAddingQuestion(true)}>
                  <Plus className="size-4" />
                  Add Question
                </Button>
              ) : null}
            </div>
            {displayVersion.isCurrent && !readOnly ? (
              <p className="text-xs text-muted">
                This is the current version. Editing questions here affects future assignments.
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-3">
            {addingQuestion && !readOnly ? (
              <AddQuestionForm
                versionId={displayVersion.id}
                templateId={templateId}
                onDone={(a) => { setAlert(a); setAddingQuestion(false); }}
                onCancel={() => setAddingQuestion(false)}
              />
            ) : null}
            {sortedQuestions.length === 0 && !addingQuestion ? (
              <p className="rounded-2xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
                No questions yet.{readOnly ? "" : " Add the first one above."}
              </p>
            ) : null}
            {sortedQuestions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                templateId={templateId}
                readOnly={readOnly}
                onDone={setAlert}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
