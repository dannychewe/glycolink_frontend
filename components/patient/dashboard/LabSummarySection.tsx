"use client";

import { useQuery } from "@apollo/client";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LATEST_LAB_RESULT_QUERY } from "@/lib/patient/labs-graphql";

type LatestLabResultData = {
  latestLabResult: {
    labOrderId: string;
    testName: string;
    orderedAt: string | null;
    result: {
      id: string;
      valueText: string | null;
      valueNumeric: number | null;
      unit: string | null;
      flag: string | null;
      resultedAt: string | null;
    } | null;
  } | null;
};

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

function formatDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function formatResultValue(result: NonNullable<LatestLabResultData["latestLabResult"]>["result"]) {
  if (!result) return null;
  if (result.valueNumeric !== null && result.valueNumeric !== undefined) {
    return `${result.valueNumeric}${result.unit ? ` ${result.unit}` : ""}`;
  }
  if (result.valueText) return result.valueText;
  return null;
}

export function LabSummarySection() {
  const { data, loading } = useQuery<LatestLabResultData>(LATEST_LAB_RESULT_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl">Labs</h2>
        <div className="h-40 animate-pulse rounded-2xl bg-border/40" />
      </section>
    );
  }

  const latest = data?.latestLabResult;

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Labs</h2>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle">
        {!latest ? (
          <p className="text-sm text-muted">No lab results yet.</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FlaskConical className="size-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                    Latest lab
                  </p>
                  <p className="font-semibold text-text">{latest.testName}</p>
                </div>
              </div>
              <Badge variant={getFlagVariant(latest.result?.flag ?? null)}>
                {formatFlag(latest.result?.flag ?? null)}
              </Badge>
            </div>

            {latest.result ? (
              <p className="mt-4 text-sm leading-6 text-muted">
                Result: <span className="font-medium text-text">{formatResultValue(latest.result)}</span>
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
              {formatDate(latest.orderedAt) ? (
                <span>Ordered {formatDate(latest.orderedAt)}</span>
              ) : null}
              {latest.result?.resultedAt ? (
                <span>· Resulted {formatDate(latest.result.resultedAt)}</span>
              ) : null}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <Button href="/patient/labs" variant="secondary">
                View Results
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
