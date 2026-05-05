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
  ADMIN_CREATE_CORPORATE_ACCOUNT_MUTATION,
  ADMIN_ORGANIZATIONS_DROPDOWN_QUERY,
} from "@/lib/admin/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;
type OrgItem = { id: string; name: string; type: string };

const selectClass = "flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

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

export function AdminCorporateCreateView() {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ name: "", organizationId: "" });

  const { data: orgsData, loading: orgsLoading } = useQuery<{
    systemOrganizations: { items: OrgItem[] };
  }>(ADMIN_ORGANIZATIONS_DROPDOWN_QUERY, { fetchPolicy: "cache-first" });
  const orgs = orgsData?.systemOrganizations?.items ?? [];

  const [createCorporateAccount, { loading }] = useMutation(ADMIN_CREATE_CORPORATE_ACCOUNT_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      const result = await createCorporateAccount({
        variables: { data: { name: form.name, organizationId: form.organizationId } },
      });
      const id = result.data?.createCorporateAccount?.corporateAccount?.id;
      if (id) {
        router.push(`/admin/corporate/${id}`);
      } else {
        setAlert({ type: "error", message: "Account created but ID was not returned." });
      }
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to create corporate account.") });
    }
  }

  return (
    <div className="space-y-6">
      <Button href="/admin/corporate" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to Corporate
      </Button>

      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace · Corporate
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">New Corporate Account</h1>
        <p className="max-w-2xl text-sm text-muted">
          Register a corporate account linked to an organisation. After saving you can enroll members and create benefit plans.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="corp-name">Account name</Label>
              <Input
                id="corp-name"
                value={form.name}
                placeholder="e.g. Acme Ltd Employee Health"
                onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-select">Organisation</Label>
              <select
                id="org-select"
                className={selectClass}
                value={form.organizationId}
                onChange={(e) => setForm((c) => ({ ...c, organizationId: e.target.value }))}
                disabled={orgsLoading}
                required
              >
                <option value="">— Select organisation —</option>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
              {orgsLoading ? <p className="text-xs text-muted">Loading organisations…</p> : null}
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading || !form.organizationId}>
                {loading ? "Creating…" : "Create Account"}
              </Button>
              <Button href="/admin/corporate" variant="secondary" type="button">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
