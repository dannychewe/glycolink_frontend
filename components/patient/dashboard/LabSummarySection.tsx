"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelTitle, PanelBody, PanelEmpty } from "@/components/ui/panel";
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
    return <div className="h-44 animate-pulse rounded-lg border border-border bg-border/30" />;
  }

  const latest = data?.latestLabResult;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.labs}>Labs</PanelTitle>
      </PanelHeader>

      {!latest ? (
        <PanelEmpty>No lab results yet.</PanelEmpty>
      ) : (
        <PanelBody>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                Latest lab
              </p>
              <p className="mt-0.5 font-semibold text-text">{latest.testName}</p>
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
            <Button href="/patient/labs" variant="secondary" size="sm">
              View Results
            </Button>
          </div>
        </PanelBody>
      )}
    </Panel>
  );
}
