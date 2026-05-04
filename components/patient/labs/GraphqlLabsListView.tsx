"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Activity, AlertTriangle, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { RECENT_LAB_RESULTS_QUERY } from "@/lib/patient/labs-graphql";
import { GraphqlLabOrderDetailModal } from "@/components/patient/labs/GraphqlLabOrderDetailModal";
import { cn } from "@/lib/utils/cn";

type CriticalFlag = {
  id: string;
  severity: string;
  notifiedProviderAt: string | null;
  acknowledgedAt: string | null;
};

type LabResult = {
  id: string;
  valueText: string | null;
  valueNumeric: number | null;
  unit: string | null;
  referenceRange: string | null;
  flag: string | null;
  resultedAt: string | null;
  criticalFlags: CriticalFlag[];
};

type LabResultItem = {
  labOrderId: string;
  encounterId: string | null;
  testId: string;
  testName: string;
  orderedAt: string | null;
  result: LabResult | null;
};

type RecentLabResultsData = {
  recentLabResults: LabResultItem[];
};

type LabsTab = "All" | "Abnormal";
const tabs: LabsTab[] = ["All", "Abnormal"];

function isAbnormal(flag: string | null) {
  if (!flag) return false;
  const f = flag.trim().toUpperCase();
  return f !== "NORMAL" && f !== "N";
}

function isCritical(result: LabResult | null) {
  if (!result) return false;
  const f = result.flag?.trim().toUpperCase() ?? "";
  if (f === "CRITICAL" || f === "CRITICAL_HIGH" || f === "CRITICAL_LOW") return true;
  return (result.criticalFlags?.length ?? 0) > 0;
}

function getFlagVariant(flag: string | null): "success" | "warning" | "danger" | "secondary" {
  if (!flag) return "secondary";
  const f = flag.trim().toUpperCase();
  if (f === "NORMAL" || f === "N") return "success";
  if (f === "CRITICAL" || f === "CRITICAL_HIGH" || f === "CRITICAL_LOW") return "danger";
  if (f === "HIGH" || f === "H" || f === "LOW" || f === "L") return "warning";
  return "secondary";
}

function formatFlag(flag: string | null) {
  if (!flag) return "Pending";
  const f = flag.trim().toUpperCase();
  if (f === "N") return "Normal";
  if (f === "H") return "High";
  if (f === "L") return "Low";
  if (f === "CRITICAL_HIGH") return "Critical High";
  if (f === "CRITICAL_LOW") return "Critical Low";
  return f.charAt(0) + f.slice(1).toLowerCase();
}

function formatResultValue(result: LabResult | null) {
  if (!result) return "Pending";
  if (result.valueNumeric !== null && result.valueNumeric !== undefined) {
    return `${result.valueNumeric}${result.unit ? ` ${result.unit}` : ""}`;
  }
  if (result.valueText) return result.valueText;
  return "Pending";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", { month: "long", day: "numeric", year: "numeric" });
}

export function GraphqlLabsListView() {
  const [activeTab, setActiveTab] = useState<LabsTab>("All");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, loading, error } = useQuery<RecentLabResultsData>(RECENT_LAB_RESULTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "network-only",
  });

  const results = useMemo(() => data?.recentLabResults ?? [], [data?.recentLabResults]);

  const counts = useMemo(
    () => ({
      total: results.length,
      abnormal: results.filter((r) => isAbnormal(r.result?.flag ?? null)).length,
    }),
    [results],
  );

  const filtered = useMemo(() => {
    if (activeTab === "Abnormal") {
      return results.filter((r) => isAbnormal(r.result?.flag ?? null));
    }
    return results;
  }, [activeTab, results]);

  return (
    <>
      <div className="space-y-7">
        <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
          <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
          <div className="relative space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
              Lab results
            </p>
            <h1 className="text-3xl font-semibold text-text sm:text-4xl">Lab Tests</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
              View your recent lab results and order details from your consultations.
            </p>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-border/80 bg-surface/80 shadow-soft">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Total results</p>
                <p className="text-2xl font-semibold text-text">{counts.total}</p>
              </div>
              <FlaskConical className="size-5 text-primary" />
            </CardContent>
          </Card>
          <Card className="border-border/80 bg-surface/80 shadow-soft">
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.14em] text-muted">Abnormal</p>
                <p className="text-2xl font-semibold text-text">{counts.abnormal}</p>
              </div>
              <AlertTriangle className="size-5 text-warning" />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 rounded-xl border border-border/70 bg-surface px-3 py-3">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "rounded-xl border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  isActive
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-text hover:bg-slate-50",
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
            Unable to load lab results right now.
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-36 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((item) => {
              const critical = isCritical(item.result);
              return (
                <Card
                  key={item.testId}
                  className={cn(
                    "border-border/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-subtle",
                    critical && "border-danger/40 bg-danger/5",
                  )}
                >
                  <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                        Lab result
                      </p>
                      <p className="text-lg font-semibold text-text">{item.testName}</p>
                      <div className="flex flex-wrap items-baseline gap-3">
                        <p className="text-2xl font-bold text-text">
                          {formatResultValue(item.result)}
                        </p>
                        {item.result?.referenceRange ? (
                          <p className="text-sm text-muted">
                            Ref: {item.result.referenceRange}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm text-muted">
                        Ordered {formatDate(item.orderedAt)}
                        {item.result?.resultedAt
                          ? ` · Resulted ${formatDate(item.result.resultedAt)}`
                          : null}
                      </p>
                      {critical ? (
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger">
                          <Activity className="size-3.5" />
                          Critical value — your provider has been notified
                        </div>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getFlagVariant(item.result?.flag ?? null)}>
                        {formatFlag(item.result?.flag ?? null)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setSelectedOrderId(item.labOrderId)}
                      className="sm:w-auto"
                    >
                      View Order
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
            <p className="text-base font-medium text-text">No lab results found</p>
            <p className="mt-1 text-sm text-muted">
              {activeTab === "Abnormal"
                ? "No abnormal results in your recent labs."
                : "Lab results from your consultations will appear here."}
            </p>
          </div>
        ) : null}
      </div>

      {selectedOrderId ? (
        <GraphqlLabOrderDetailModal
          labOrderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      ) : null}
    </>
  );
}
