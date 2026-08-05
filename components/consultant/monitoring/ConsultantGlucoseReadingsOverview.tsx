"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Activity, ShieldOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelEmpty, PanelHeader, PanelList, PanelTitle, ViewAllLink } from "@/components/ui/panel";
import {
  CONSULTANT_MONITORING_OVERVIEW_QUERY,
  type ConsultantMonitoringOverviewItem,
} from "@/lib/monitoring/graphql";
import { cn } from "@/lib/utils/cn";

type OverviewData = {
  consultantMonitoringOverview: ConsultantMonitoringOverviewItem[];
};

type Props = {
  limit?: number;
  compact?: boolean;
  showViewAll?: boolean;
};

function formatReading(value: number | string | null | undefined, unit: string | null | undefined) {
  if (value === null || value === undefined) return "No reading";
  const numeric = Number(value);
  const formatted = Number.isFinite(numeric) ? numeric.toFixed(1) : String(value);
  return `${formatted}${unit ? ` ${unit}` : ""}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "No readings yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function flagVariant(flag: string | null | undefined) {
  const normalized = flag?.toUpperCase();
  if (normalized === "HIGH" || normalized === "LOW") return "danger" as const;
  if (normalized === "NORMAL") return "success" as const;
  return "secondary" as const;
}

function flagAccent(flag: string | null | undefined, allowed: boolean) {
  if (!allowed) return "bg-muted";
  const normalized = flag?.toUpperCase();
  if (normalized === "HIGH" || normalized === "LOW") return "bg-danger";
  if (normalized === "NORMAL") return "bg-success";
  return "bg-border";
}

function patientName(item: ConsultantMonitoringOverviewItem) {
  return item.patient.fullName || item.patient.email || "Unknown patient";
}

export function ConsultantGlucoseReadingsOverview({ limit = 6, compact = false, showViewAll = true }: Props) {
  const { data, loading, error } = useQuery<OverviewData>(CONSULTANT_MONITORING_OVERVIEW_QUERY, {
    variables: { limit },
    fetchPolicy: "cache-and-network",
  });

  const items = data?.consultantMonitoringOverview ?? [];
  const activeAlerts = items.reduce((total, item) => total + item.activeAlertCount, 0);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Activity} count={items.length} countTone={activeAlerts > 0 ? "danger" : "neutral"}>
          Glucose Readings
        </PanelTitle>
        {showViewAll ? <ViewAllLink href="/consultant/monitoring/readings" /> : null}
      </PanelHeader>

      {error ? (
        <PanelEmpty className="text-warning">Unable to load patient readings right now.</PanelEmpty>
      ) : loading && items.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: compact ? 3 : 5 }).map((_, index) => (
            <div key={index} className="px-5 py-4">
              <div className="h-11 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">No patient readings</p>
          <p className="mt-0.5 text-xs text-muted">Accepted patients with glucose logs will appear here.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {items.map((item) => {
            const latest = item.latestGlucose;
            const trendValue = item.trend?.average7Days ?? item.trend?.average30Days ?? null;
            return (
              <Link
                key={item.patient.id}
                href={`/consultant/patients/${item.patient.id}/monitoring`}
                className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-background"
              >
                <span className={cn("mt-1 h-10 w-1 shrink-0 rounded-full", flagAccent(latest?.flag, item.monitoringAllowed))} />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-text">{patientName(item)}</p>
                    {!item.monitoringAllowed ? (
                      <Badge variant="secondary">
                        <ShieldOff className="mr-1 size-3" />
                        Private
                      </Badge>
                    ) : latest?.flag ? (
                      <Badge variant={flagVariant(latest.flag)}>{latest.flag}</Badge>
                    ) : null}
                    {item.activeAlertCount > 0 ? (
                      <Badge variant="danger">{item.activeAlertCount} alert{item.activeAlertCount === 1 ? "" : "s"}</Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span className="font-medium text-text">{formatReading(latest?.value, latest?.unit)}</span>
                    <span>{formatDate(item.lastRecordedAt ?? latest?.recordedAt)}</span>
                    {trendValue !== null && trendValue !== undefined ? (
                      <span>Avg {Number(trendValue).toFixed(1)}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            );
          })}
        </PanelList>
      )}
    </Panel>
  );
}
