"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client";
import { AlertCircle, ArrowLeft, CheckCircle, UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ADMIN_CORPORATE_MEMBERS_QUERY,
  ADMIN_ENROLL_CORPORATE_MEMBER_MUTATION,
} from "@/lib/admin/graphql";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

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

export function AdminCorporateEnrollView({ corporateId }: Readonly<{ corporateId: string }>) {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ patientId: "", employeeId: "" });

  const [enrollMember, { loading }] = useMutation(ADMIN_ENROLL_CORPORATE_MEMBER_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await enrollMember({
        variables: {
          corporateId,
          patientId: form.patientId,
          employeeId: form.employeeId.trim() || undefined,
        },
        refetchQueries: [
          { query: ADMIN_CORPORATE_MEMBERS_QUERY, variables: { corporateId } },
        ],
      });
      router.push(`/admin/corporate/${corporateId}`);
    } catch {
      setAlert({ type: "error", message: "Unable to enroll member." });
    }
  }

  return (
    <div className="space-y-6">
      <Button href={`/admin/corporate/${corporateId}`} variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to Account
      </Button>

      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace · Corporate
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Enroll Member</h1>
        <p className="max-w-2xl text-sm text-muted">
          Add a patient to this corporate account. On success you&apos;ll return to the account page.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Member details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="patient-id">Patient ID</Label>
              <Input
                id="patient-id"
                value={form.patientId}
                placeholder="Patient UUID"
                onChange={(e) => setForm((c) => ({ ...c, patientId: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="employee-id">
                Employee ID{" "}
                <span className="font-normal text-muted">(optional)</span>
              </Label>
              <Input
                id="employee-id"
                value={form.employeeId}
                placeholder="e.g. EMP-00123"
                onChange={(e) => setForm((c) => ({ ...c, employeeId: e.target.value }))}
              />
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                {loading ? "Enrolling…" : "Enroll Member"}
              </Button>
              <Button href={`/admin/corporate/${corporateId}`} variant="secondary" type="button">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
