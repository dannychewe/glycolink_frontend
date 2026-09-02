"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, ArrowLeft, CheckCircle, FilePlus2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import {
  ADMIN_CORPORATE_PLANS_QUERY,
  ADMIN_CREATE_BENEFIT_PLAN_MUTATION,
  ADMIN_PROVIDERS_QUERY,
  SPECIALTIES_QUERY,
} from "@/lib/admin/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;
type Specialty = { id: string; name: string };
type ProviderItem = {
  id: string;
  displayName: string;
  hpczNumber: string | null;
  status: string;
  organization: { name: string } | null;
};

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

export function AdminCorporateNewPlanView({ corporateId }: Readonly<{ corporateId: string }>) {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [providerPick, setProviderPick] = useState("");
  const [form, setForm] = useState({
    maxConsultations: "",
    discountPercentage: "",
  });

  const { data: specialtiesData, loading: specialtiesLoading } = useQuery<{ specialties: Specialty[] }>(
    SPECIALTIES_QUERY,
    { fetchPolicy: "cache-first" },
  );
  const specialties = specialtiesData?.specialties ?? [];
  const providersQuery = useQuery<{
    systemProviders: { items: ProviderItem[] };
  }>(ADMIN_PROVIDERS_QUERY, {
    variables: { page: 1, limit: 100 },
    fetchPolicy: "cache-and-network",
  });
  const providers = providersQuery.data?.systemProviders.items ?? [];
  const providerOptions = providers
    .filter((provider) => !selectedProviders.includes(provider.id))
    .map((provider) => ({
      value: provider.id,
      label: provider.displayName,
      description: [provider.organization?.name, provider.hpczNumber].filter(Boolean).join(" · "),
      badge: provider.status,
    }));
  const selectedProviderDetails = selectedProviders.map(
    (providerId) => providers.find((provider) => provider.id === providerId) ?? null,
  );

  const [createBenefitPlan, { loading }] = useMutation(ADMIN_CREATE_BENEFIT_PLAN_MUTATION);

  function toggleSpecialty(name: string) {
    setSelectedSpecialties((current) =>
      current.includes(name) ? current.filter((s) => s !== name) : [...current, name],
    );
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await createBenefitPlan({
        variables: {
          corporateId,
          data: {
            maxConsultations: form.maxConsultations ? Number(form.maxConsultations) : undefined,
            discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : undefined,
            allowedSpecialties: selectedSpecialties.length > 0 ? selectedSpecialties : undefined,
            approvedProviders: selectedProviders.length > 0 ? selectedProviders : undefined,
          },
        },
        refetchQueries: [
          { query: ADMIN_CORPORATE_PLANS_QUERY, variables: { corporateId } },
        ],
      });
      router.push(`/admin/corporate/${corporateId}`);
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to create benefit plan.") });
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
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">New Benefit Plan</h1>
        <p className="max-w-2xl text-sm text-muted">
          Configure coverage limits, discounts, and allowed specialties for this corporate account.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FilePlus2 className="size-5 text-primary" />
            Plan details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="max-consults">
                  Max consultations{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </Label>
                <Input
                  id="max-consults"
                  type="number"
                  min="0"
                  value={form.maxConsultations}
                  placeholder="Unlimited if blank"
                  onChange={(e) => setForm((c) => ({ ...c, maxConsultations: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">
                  Discount %{" "}
                  <span className="font-normal text-muted">(optional)</span>
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={form.discountPercentage}
                  placeholder="0 – 100"
                  onChange={(e) => setForm((c) => ({ ...c, discountPercentage: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Allowed specialties{" "}
                <span className="font-normal text-muted">(optional — all allowed if none selected)</span>
              </Label>
              {specialtiesLoading ? (
                <p className="text-xs text-muted">Loading specialties…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {specialties.map((s) => {
                    const active = selectedSpecialties.includes(s.name);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSpecialty(s.name)}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          active
                            ? "border-primary bg-primary text-white"
                            : "border-border bg-surface text-muted hover:border-primary/40 hover:text-text",
                        )}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <SearchableSelector
                id="approved-providers"
                label="Approved providers"
                value={providerPick}
                options={providerOptions}
                placeholder="Search provider"
                emptyLabel={providersQuery.loading ? "Loading providers..." : "No providers found"}
                disabled={providersQuery.loading}
                onChange={(providerId) => {
                  setSelectedProviders((current) =>
                    current.includes(providerId) ? current : [...current, providerId],
                  );
                  setProviderPick("");
                }}
              />
              {selectedProviders.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedProviders.map((providerId, index) => {
                    const provider = selectedProviderDetails[index];
                    return (
                      <button
                        key={providerId}
                        type="button"
                        onClick={() =>
                          setSelectedProviders((current) => current.filter((currentId) => currentId !== providerId))
                        }
                        className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary/10"
                      >
                        {provider?.displayName ?? `Provider ${providerId.slice(0, 8)}`} ×
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating…" : "Create Plan"}
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
