"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  FilePlus2,
  UserPlus,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  ADMIN_CORPORATE_MEMBERS_QUERY,
  ADMIN_CORPORATE_PLANS_QUERY,
} from "@/lib/admin/graphql";
import { cn } from "@/lib/utils/cn";

type Tab = "members" | "plans";

type CorporateMember = {
  id: string;
  patientId: string;
  employeeId: string | null;
  status: string;
  joinedAt: string;
};

type BenefitPlan = {
  id: string;
  corporateId: string;
  maxConsultations: number | null;
  discountPercentage: number | null;
  allowedSpecialties: string[] | null;
  approvedProviders: string[] | null;
  createdAt: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function MembersPanel({ corporateId }: Readonly<{ corporateId: string }>) {
  const { data, loading, error } = useQuery<{ corporateMembers: CorporateMember[] }>(
    ADMIN_CORPORATE_MEMBERS_QUERY,
    { variables: { corporateId }, fetchPolicy: "cache-and-network" },
  );
  const members = data?.corporateMembers ?? [];

  if (loading && members.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-border/50" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
        <AlertCircle className="size-4 shrink-0 text-danger" />
        <p className="text-sm text-danger">Unable to load members.</p>
      </div>
    );
  }
  if (members.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        No members enrolled yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const statusLower = member.status.toLowerCase();
        return (
          <div key={member.id} className="flex items-center gap-4 rounded-xl border border-border bg-surface px-4 py-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users className="size-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">{member.patientId}</p>
              <p className="text-xs text-muted">
                {member.employeeId ? `Employee ID: ${member.employeeId} · ` : ""}
                Joined {formatDate(member.joinedAt)}
              </p>
            </div>
            <span className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize",
              statusLower === "active" ? "bg-success/15 text-success" : "bg-border/60 text-muted",
            )}>
              {member.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PlansPanel({ corporateId }: Readonly<{ corporateId: string }>) {
  const { data, loading, error } = useQuery<{ corporatePlans: BenefitPlan[] }>(
    ADMIN_CORPORATE_PLANS_QUERY,
    { variables: { corporateId }, fetchPolicy: "cache-and-network" },
  );
  const plans = data?.corporatePlans ?? [];

  if (loading && plans.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-border/50" />
        ))}
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3">
        <AlertCircle className="size-4 shrink-0 text-danger" />
        <p className="text-sm text-danger">Unable to load benefit plans.</p>
      </div>
    );
  }
  if (plans.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted">
        No benefit plans created yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {plans.map((plan) => (
        <div key={plan.id} className="rounded-xl border border-border bg-surface px-4 py-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Max consultations</p>
              <p className="text-sm font-semibold text-text">
                {plan.maxConsultations ?? "Unlimited"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Discount</p>
              <p className="text-sm font-semibold text-text">
                {plan.discountPercentage != null ? `${plan.discountPercentage}%` : "None"}
              </p>
            </div>
          </div>
          {(plan.allowedSpecialties ?? []).length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs text-muted">Allowed specialties</p>
              <div className="flex flex-wrap gap-1.5">
                {(plan.allowedSpecialties ?? []).map((s) => (
                  <Badge key={s} variant="primary">{s}</Badge>
                ))}
              </div>
            </div>
          ) : null}
          {(plan.approvedProviders ?? []).length > 0 ? (
            <div>
              <p className="mb-1.5 text-xs text-muted">Approved providers</p>
              <div className="flex flex-wrap gap-1.5">
                {(plan.approvedProviders ?? []).map((p) => (
                  <span key={p} className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <p className="text-xs text-muted">Created {formatDate(plan.createdAt)}</p>
        </div>
      ))}
    </div>
  );
}

export function AdminCorporateDetailView({ corporateId }: Readonly<{ corporateId: string }>) {
  const [activeTab, setActiveTab] = useState<Tab>("members");

  return (
    <div className="space-y-6">
      <Button href="/admin/corporate" variant="ghost" size="sm" className="-ml-2">
        <ArrowLeft className="size-4" />
        Back to Corporate
      </Button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Admin Workspace · Corporate
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Corporate Account</h1>
          <p className="font-mono text-xs text-muted">{corporateId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href={`/admin/corporate/${corporateId}/enroll`} variant="secondary" size="sm">
            <UserPlus className="size-4" />
            Enroll Member
          </Button>
          <Button href={`/admin/corporate/${corporateId}/plans/new`} size="sm">
            <FilePlus2 className="size-4" />
            New Benefit Plan
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
              {([
                { key: "members", label: "Members", icon: Users },
                { key: "plans", label: "Benefit Plans", icon: BadgeCheck },
              ] as const).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-semibold transition",
                    activeTab === key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "members" ? (
            <MembersPanel corporateId={corporateId} />
          ) : (
            <PlansPanel corporateId={corporateId} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
