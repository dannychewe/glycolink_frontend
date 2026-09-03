"use client";

import { useQuery } from "@apollo/client";
import { useMemo } from "react";
import { Activity } from "lucide-react";
import { MONITORING_SNAPSHOT_QUERY } from "@/lib/monitoring/graphql";
import { GlucoseHeroCard, glucoseStatusKey } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/panel";

type SnapshotData = {
  monitoringSnapshot: {
    latestGlucose: {
      id: string;
      readingType: string;
      value: number;
      unit: string | null;
      flag: string | null;
      recordedAt: string;
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

export function MonitoringSnapshotCard({ onLogReading }: { onLogReading?: () => void }) {
  const { data, loading, error } = useQuery<SnapshotData>(MONITORING_SNAPSHOT_QUERY, {
    variables: { includeTrend: true },
    fetchPolicy: "network-only",
  });

  const latest = data?.monitoringSnapshot?.latestGlucose;
  const trend = data?.monitoringSnapshot?.trend;
  const unit = useMemo(() => latest?.unit ?? "mmol/L", [latest?.unit]);

  if (loading) {
    return <div className="h-52 animate-pulse rounded-lg bg-border/40" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load monitoring data right now.
      </div>
    );
  }

  if (!latest) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-8">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-muted" />
          <div>
            <p className="text-base font-medium text-text">No glucose readings yet</p>
            <p className="text-sm text-muted">Log your first reading to see your status here.</p>
          </div>
        </div>
        {onLogReading ? <Button type="button" onClick={onLogReading}>Log reading</Button> : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlucoseHeroCard
        eyebrow="Latest glucose reading"
        value={latest.value}
        valueCaption={unit}
        status={glucoseStatusKey(latest.flag)}
        action={
          onLogReading ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/10 text-white ring-white/25 hover:bg-white/20"
              onClick={onLogReading}
            >
              Log reading
            </Button>
          ) : undefined
        }
        footer={formatRecordedAt(latest.recordedAt)}
      />

      {trend ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="7-day avg" value={trend.average7Days != null ? Number(trend.average7Days).toFixed(1) : "—"} sublabel={unit} />
          <StatTile label="30-day avg" value={trend.average30Days != null ? Number(trend.average30Days).toFixed(1) : "—"} sublabel={unit} />
        </div>
      ) : null}
    </div>
  );
}
