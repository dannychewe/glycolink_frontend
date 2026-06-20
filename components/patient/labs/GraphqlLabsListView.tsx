"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { Activity, AlertTriangle, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lab results"
          title="Lab Tests"
          description="View your recent lab results and order details from your consultations."
        />

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
          <div className="flex items-center justify-between gap-2 bg-surface px-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">Total results</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{counts.total}</p>
            </div>
            <FlaskConical className="size-5 shrink-0 text-muted" />
          </div>
          <div className="flex items-center justify-between gap-2 bg-surface px-4 py-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">Abnormal</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", counts.abnormal > 0 ? "text-warning" : "text-ink")}>{counts.abnormal}</p>
            </div>
            <AlertTriangle className={cn("size-5 shrink-0", counts.abnormal > 0 ? "text-warning" : "text-muted")} />
          </div>
        </div>

        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => {
            const isActive = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-text",
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {error ? (
          <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-3 text-sm text-warning">
            Unable to load lab results right now.
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="h-36 animate-pulse bg-border/40" />
            ))}
          </div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="grid gap-3">
            {filtered.map((item) => {
              const critical = isCritical(item.result);
              return (
                <Card
                  key={item.testId}
                  className={cn(
                    "transition-colors hover:bg-background",
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
          <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
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
