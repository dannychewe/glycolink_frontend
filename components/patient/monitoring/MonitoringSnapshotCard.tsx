"use client";

import { useQuery } from "@apollo/client";
import { Activity, TrendingUp } from "lucide-react";
import { MONITORING_SNAPSHOT_QUERY } from "@/lib/monitoring/graphql";

type SnapshotData = {
  monitoringSnapshot: {
    latestGlucose: {
      id: string;
      readingType: string;
      recordedAt: string;
      value: number;
      context: string | null;
      source: string;
      unit: string | null;
    } | null;
    trend: {
      readingType: string;
      average7Days: number | null;
      average30Days: number | null;
      latestValue: number | null;
    } | null;
  };
};

function formatRecordedAt(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatContext(ctx: string | null) {
  if (!ctx) return null;
  return ctx.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function MonitoringSnapshotCard() {
  const { data, loading, error } = useQuery<SnapshotData>(MONITORING_SNAPSHOT_QUERY, {
    variables: { includeTrend: true },
    fetchPolicy: "network-only",
  });

  if (loading) {
    return <div className="h-52 animate-pulse rounded-2xl bg-border/40" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load monitoring data right now.
      </div>
    );
  }

  const latest = data?.monitoringSnapshot?.latestGlucose;
  const trend = data?.monitoringSnapshot?.trend;
  const unit = latest?.unit ?? "mmol/L";

  if (!latest) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-6 py-8 text-center">
        <p className="text-base font-medium text-text">No glucose readings yet</p>
        <p className="mt-1 text-sm text-muted">Use the Log Reading tab to add your first reading.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-5 text-white shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Activity className="size-4" />
            Latest glucose reading
          </div>
          {trend?.average7Days != null ? (
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
              <TrendingUp className="size-3" />
              {Number(trend.average7Days).toFixed(1)} {unit} avg (7d)
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex items-baseline gap-2">
          <p className="text-5xl font-semibold">{Number(latest.value).toFixed(1)}</p>
          <p className="text-sm text-white/70">{unit}</p>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/70">
          <span>{formatRecordedAt(latest.recordedAt)}</span>
          {latest.context ? (
            <span className="rounded-full bg-white/15 px-2 py-0.5">
              {formatContext(latest.context)}
            </span>
          ) : null}
        </div>
      </div>

      {trend ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Latest</p>
            <p className="mt-1.5 text-2xl font-semibold text-text">
              {trend.latestValue != null ? Number(trend.latestValue).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted">{unit}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">7-day avg</p>
            <p className="mt-1.5 text-2xl font-semibold text-text">
              {trend.average7Days != null ? Number(trend.average7Days).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted">{unit}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">30-day avg</p>
            <p className="mt-1.5 text-2xl font-semibold text-text">
              {trend.average30Days != null ? Number(trend.average30Days).toFixed(1) : "—"}
            </p>
            <p className="text-xs text-muted">{unit}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
