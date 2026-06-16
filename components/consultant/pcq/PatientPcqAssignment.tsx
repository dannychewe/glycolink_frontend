"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle, ClipboardList, Send, X } from "lucide-react";
import {
  ASSIGN_PCQ_TO_PATIENT_MUTATION,
  PCQ_TEMPLATES_QUERY,
} from "@/lib/consultant/pcq-graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PCQResponseDetail } from "@/components/consultant/pcq/PCQResponseDetail";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

type TemplateItem = {
  id: string;
  name: string;
  consultationType: string;
  status: string;
  isGlobal: boolean;
};

const selectClass = "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function PatientPcqAssignment({ patientId }: Readonly<{ patientId: string }>) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [templateId, setTemplateId] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [reason, setReason] = useState("");
  const [assignedResponseId, setAssignedResponseId] = useState<string | null>(null);

  const { data, loading } = useQuery<{ pcqTemplates: TemplateItem[] }>(
    PCQ_TEMPLATES_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  // Only active, tenant-scoped (non-global) templates are assignable.
  const assignable = useMemo(
    () => (data?.pcqTemplates ?? []).filter((t) => !t.isGlobal && t.status.toLowerCase() === "active"),
    [data],
  );

  const [assign, { loading: assigning }] = useMutation(ASSIGN_PCQ_TO_PATIENT_MUTATION);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    if (!templateId) {
      setAlert({ type: "error", message: "Select a template to assign." });
      return;
    }
    try {
      const result = await assign({
        variables: {
          data: {
            patientId,
            templateId,
            dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
            reason: reason.trim() || undefined,
          },
        },
      });
      const response = result.data?.assignPcqToPatient?.response;
      setAssignedResponseId(response?.id ?? null);
      setAlert({ type: "success", message: "Questionnaire assigned. The patient will see it in their PCQ list." });
      setTemplateId("");
      setDueAt("");
      setReason("");
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to assign questionnaire.") });
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="size-5 text-primary" />
          Assign Supplemental PCQ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alert ? (
          <div className={cn(
            "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
            alert.type === "error" ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
          )}>
            {alert.type === "error" ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
            <p className="flex-1">{alert.message}</p>
            <button type="button" onClick={() => setAlert(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        ) : null}

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assign-template">Template <span className="text-danger">*</span></Label>
            <select
              id="assign-template"
              className={selectClass}
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              disabled={loading}
            >
              <option value="">— Select an active template —</option>
              {assignable.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.consultationType.replace(/_/g, " ")})
                </option>
              ))}
            </select>
            {!loading && assignable.length === 0 ? (
              <p className="text-xs text-muted">
                No active supplemental templates yet. Create and activate one under PCQ Templates first.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-due">Due date (optional)</Label>
            <input
              id="assign-due"
              type="datetime-local"
              className={selectClass}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assign-reason">Reason (optional)</Label>
            <Textarea
              id="assign-reason"
              placeholder="e.g. Check neuropathy symptoms before follow-up."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[72px] text-sm"
            />
          </div>

          <Button type="submit" variant="primary" disabled={assigning || !templateId}>
            <Send className="size-4" />
            {assigning ? "Assigning…" : "Assign Questionnaire"}
          </Button>
        </form>

        {assignedResponseId ? (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Assigned response</p>
            <PCQResponseDetail responseId={assignedResponseId} />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
