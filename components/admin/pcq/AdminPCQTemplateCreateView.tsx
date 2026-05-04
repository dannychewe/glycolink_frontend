"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, ArrowLeft, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_CREATE_PCQ_TEMPLATE_MUTATION,
  ADMIN_PCQ_TEMPLATES_QUERY,
  SPECIALTIES_QUERY,
} from "@/lib/admin/graphql";
import { CONSULTATION_TYPE_OPTIONS } from "@/lib/consultant/pcq-graphql";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;
type Specialty = { id: string; name: string };

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

const selectClass = "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export function AdminPCQTemplateCreateView() {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({
    name: "",
    consultationType: "initial",
    specialtyId: "",
  });

  const { data: specialtiesData, loading: specialtiesLoading } = useQuery<{ specialties: Specialty[] }>(
    SPECIALTIES_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const specialties = specialtiesData?.specialties ?? [];

  const [createTemplate, { loading }] = useMutation(ADMIN_CREATE_PCQ_TEMPLATE_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      const result = await createTemplate({
        variables: {
          name: form.name,
          consultationType: form.consultationType,
          specialtyId: form.specialtyId || undefined,
        },
        refetchQueries: [ADMIN_PCQ_TEMPLATES_QUERY],
      });
      const templateId = result.data?.createPcqTemplate?.template?.id;
      if (templateId) {
        router.push(`/admin/pcq/${templateId}`);
      } else {
        setAlert({ type: "error", message: "Template created but ID was not returned." });
      }
    } catch {
      setAlert({ type: "error", message: "Unable to create PCQ template." });
    }
  }

  return (
    <div className="space-y-6">
      <Button href="/admin/pcq" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to PCQ Templates
      </Button>

      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace · PCQ Templates
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">New Template</h1>
        <p className="max-w-2xl text-sm text-muted">
          Create a new questionnaire template. After saving you&apos;ll be taken to the template page where you can add versions and questions.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Template details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                value={form.name}
                placeholder="e.g. Initial Diabetes Consultation"
                onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultation-type">Consultation type</Label>
              <select
                id="consultation-type"
                className={selectClass}
                value={form.consultationType}
                onChange={(event) => setForm((c) => ({ ...c, consultationType: event.target.value }))}
              >
                {CONSULTATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialty">
                Specialty{" "}
                <span className="font-normal text-muted">(optional — leave blank for a global template)</span>
              </Label>
              <select
                id="specialty"
                className={selectClass}
                value={form.specialtyId}
                onChange={(event) => setForm((c) => ({ ...c, specialtyId: event.target.value }))}
                disabled={specialtiesLoading}
              >
                <option value="">— Global (no specialty) —</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {specialtiesLoading ? (
                <p className="text-xs text-muted">Loading specialties…</p>
              ) : null}
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Template"}
              </Button>
              <Button href="/admin/pcq" variant="secondary" type="button">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
