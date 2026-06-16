"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle, Pencil, Plus, SlidersHorizontal, X } from "lucide-react";
import {
  CONSULTANT_CLINICAL_RULES_QUERY,
  UPSERT_CONSULTANT_CLINICAL_RULE_MUTATION,
  mapClinicalRuleError,
  RULE_DIABETES_TYPE_OPTIONS,
  RULE_SEVERITY_OPTIONS,
  RULE_TRIGGER_OPTIONS,
  type ClinicalRuleInput,
  type ConsultantClinicalRule,
  type RuleDiabetesType,
  type RuleSeverity,
  type RuleTrigger,
} from "@/lib/consultant/clinical-rules-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

const inputClass =
  "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function severityVariant(severity: string): "primary" | "warning" | "danger" {
  const s = severity.toLowerCase();
  if (s === "critical" || s === "high") return "danger";
  if (s === "warning") return "warning";
  return "primary";
}

function triggerLabel(trigger: string) {
  return RULE_TRIGGER_OPTIONS.find((t) => t.value === trigger)?.label ?? trigger.replace(/_/g, " ");
}

function diabetesLabel(value: string | null) {
  if (!value) return null;
  return RULE_DIABETES_TYPE_OPTIONS.find((d) => d.value === value)?.label ?? value;
}

type FormState = {
  trigger: RuleTrigger;
  title: string;
  description: string;
  severity: RuleSeverity;
  action: string;
  diabetesType: "" | RuleDiabetesType;
  conditionCode: string;
  conditionText: string;
  priority: string;
  active: boolean;
};

function blankForm(): FormState {
  return {
    trigger: "high_glucose",
    title: "",
    description: "",
    severity: "info",
    action: "",
    diabetesType: "",
    conditionCode: "",
    conditionText: "",
    priority: "",
    active: true,
  };
}

function ruleToForm(rule: ConsultantClinicalRule): FormState {
  return {
    trigger: rule.trigger as RuleTrigger,
    title: rule.title,
    description: rule.description,
    severity: (rule.severity as RuleSeverity) ?? "info",
    action: rule.action,
    diabetesType: (rule.diabetesType as RuleDiabetesType) ?? "",
    conditionCode: rule.conditionCode ?? "",
    conditionText: rule.conditionText ?? "",
    priority: rule.priority != null ? String(rule.priority) : "",
    active: rule.active,
  };
}

function RuleForm({
  initial,
  editingId,
  onCancel,
  onSaved,
}: {
  initial: FormState;
  editingId: string | null;
  onCancel: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [error, setError] = useState<string | null>(null);
  const [upsert, { loading }] = useMutation(UPSERT_CONSULTANT_CLINICAL_RULE_MUTATION, {
    refetchQueries: [{ query: CONSULTANT_CLINICAL_RULES_QUERY, variables: {} }],
  });

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.description.trim() || !form.action.trim()) {
      setError("Title, description, and action are required.");
      return;
    }
    const data: ClinicalRuleInput = {
      trigger: form.trigger,
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity,
      action: form.action.trim(),
      active: form.active,
    };
    if (editingId) data.id = editingId;
    if (form.diabetesType) data.diabetesType = form.diabetesType;
    if (form.conditionCode.trim()) data.conditionCode = form.conditionCode.trim();
    if (form.conditionText.trim()) data.conditionText = form.conditionText.trim();
    if (form.priority.trim() && !Number.isNaN(Number(form.priority))) data.priority = Number(form.priority);

    try {
      await upsert({ variables: { data } });
      onSaved(editingId ? "Rule updated." : "Rule created.");
    } catch (err) {
      setError(mapClinicalRuleError(err));
    }
  }

  const triggerHelp = RULE_TRIGGER_OPTIONS.find((t) => t.value === form.trigger)?.help;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 rounded-xl border border-border bg-background p-4">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rule-trigger">Trigger <span className="text-danger">*</span></Label>
          <select id="rule-trigger" className={inputClass} value={form.trigger} onChange={(e) => set("trigger", e.target.value as RuleTrigger)}>
            {RULE_TRIGGER_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {triggerHelp ? <p className="text-xs text-muted">{triggerHelp}</p> : null}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-severity">Severity</Label>
          <select id="rule-severity" className={inputClass} value={form.severity} onChange={(e) => set("severity", e.target.value as RuleSeverity)}>
            {RULE_SEVERITY_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-title">Title <span className="text-danger">*</span></Label>
        <Input id="rule-title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Recommendation title shown to you" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-description">Description <span className="text-danger">*</span></Label>
        <Textarea
          id="rule-description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Explanation shown on the patient workspace recommendation."
          className="min-h-[72px] text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-action">Action <span className="text-danger">*</span></Label>
        <Input id="rule-action" value={form.action} onChange={(e) => set("action", e.target.value)} placeholder="e.g. Review readings" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="rule-diabetes">Diabetes type filter</Label>
          <select id="rule-diabetes" className={inputClass} value={form.diabetesType} onChange={(e) => set("diabetesType", e.target.value as FormState["diabetesType"])}>
            <option value="">Any</option>
            {RULE_DIABETES_TYPE_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-priority">Priority (lower wins first)</Label>
          <Input id="rule-priority" type="number" value={form.priority} onChange={(e) => set("priority", e.target.value)} placeholder="e.g. 10" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-cond-code">Condition code filter</Label>
          <Input id="rule-cond-code" value={form.conditionCode} onChange={(e) => set("conditionCode", e.target.value)} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rule-cond-text">Condition text filter</Label>
          <Input id="rule-cond-text" value={form.conditionText} onChange={(e) => set("conditionText", e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-text">
        <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-4 rounded border-border" />
        Active
      </label>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "Saving…" : editingId ? "Save changes" : "Create rule"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

export function ClinicalRulesManager() {
  const [alert, setAlert] = useState<AlertState>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, loading, error } = useQuery<{ consultantClinicalRules: ConsultantClinicalRule[] }>(
    CONSULTANT_CLINICAL_RULES_QUERY,
    { variables: {}, fetchPolicy: "cache-and-network" },
  );

  const rules = data?.consultantClinicalRules ?? [];

  function handleSaved(msg: string) {
    setCreating(false);
    setEditingId(null);
    setAlert({ type: "success", message: msg });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-6 py-6 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-primary">
            <SlidersHorizontal className="size-4" /> Clinical Rules
          </p>
          <h1 className="text-2xl font-semibold text-text">Recommendation overrides</h1>
          <p className="max-w-2xl text-sm text-muted">
            Customize the wording and severity of workspace recommendations by trigger, diabetes type, and condition.
            Matching rules override the default backend recommendation.
          </p>
        </div>
        {!creating ? (
          <Button variant="primary" onClick={() => { setCreating(true); setEditingId(null); }}>
            <Plus className="size-4" /> New rule
          </Button>
        ) : null}
      </header>

      {alert ? (
        <div className={cn(
          "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
          alert.type === "error" ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
        )}>
          {alert.type === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
          <p className="flex-1">{alert.message}</p>
          <button type="button" onClick={() => setAlert(null)} className="shrink-0 opacity-60 hover:opacity-100"><X className="size-4" /></button>
        </div>
      ) : null}

      {creating ? (
        <Card>
          <CardHeader className="pb-4"><CardTitle>New rule</CardTitle></CardHeader>
          <CardContent>
            <RuleForm initial={blankForm()} editingId={null} onCancel={() => setCreating(false)} onSaved={handleSaved} />
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">Unable to load clinical rules.</div>
      ) : null}

      {loading && rules.length === 0 ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-border/40" />)}</div>
      ) : null}

      {!loading && rules.length === 0 && !creating && !error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <SlidersHorizontal className="size-8 text-muted/40" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-text">No custom rules yet</p>
            <p className="text-xs text-muted">Default backend recommendations apply until you add an override.</p>
          </div>
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}><Plus className="size-4" /> New rule</Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {rules.map((rule) => (
          editingId === rule.id ? (
            <Card key={rule.id}>
              <CardHeader className="pb-4"><CardTitle>Edit rule</CardTitle></CardHeader>
              <CardContent>
                <RuleForm initial={ruleToForm(rule)} editingId={rule.id} onCancel={() => setEditingId(null)} onSaved={handleSaved} />
              </CardContent>
            </Card>
          ) : (
            <div key={rule.id} className={cn("rounded-xl border bg-surface px-5 py-4 shadow-subtle", !rule.active && "opacity-60")}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-text">{rule.title}</p>
                    <Badge variant={severityVariant(rule.severity)}>{rule.severity}</Badge>
                    {!rule.active ? <Badge variant="secondary">Inactive</Badge> : null}
                  </div>
                  <p className="text-sm leading-6 text-muted">{rule.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="rounded-full bg-primary/8 px-2 py-0.5 font-medium text-primary">{triggerLabel(rule.trigger)}</span>
                    {diabetesLabel(rule.diabetesType) ? <span className="rounded-full bg-background px-2 py-0.5">{diabetesLabel(rule.diabetesType)}</span> : null}
                    {rule.conditionCode ? <span className="rounded-full bg-background px-2 py-0.5">Code: {rule.conditionCode}</span> : null}
                    {rule.conditionText ? <span className="rounded-full bg-background px-2 py-0.5">“{rule.conditionText}”</span> : null}
                    {rule.priority != null ? <span>Priority {rule.priority}</span> : null}
                    {rule.action ? <span className="font-medium text-primary">{rule.action}</span> : null}
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => { setEditingId(rule.id); setCreating(false); }}>
                  <Pencil className="size-4" /> Edit
                </Button>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
