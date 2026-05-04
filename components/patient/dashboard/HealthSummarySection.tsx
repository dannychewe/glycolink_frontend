"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Activity } from "lucide-react";
import { PATIENT_GLUCOSE_SUMMARY_QUERY } from "@/lib/monitoring/graphql";
import { cn } from "@/lib/utils/cn";

type Bucket = {
  label: string;
  date: string;
  average: number | null;
  status: string | null;
  readingCount: number;
};

type GlucoseSummaryData = {
  glucoseSummary: {
    range: string;
    unit: string;
    overallStatus: string;
    stats: {
      average: number | null;
      highest: number | null;
      lowest: number | null;
      inRangeCount: number;
      totalCount: number;
      inRangePercent: number | null;
    };
    buckets: Bucket[];
  };
};

type Range = "week" | "month" | "3months";

const RANGES: { value: Range; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "3months", label: "3 Months" },
];

function statusLabel(s: string) {
  const upper = s.toUpperCase();
  if (upper === "LOW") return "Low";
  if (upper === "ELEVATED" || upper === "HIGH") return "Elevated";
  return "Stable";
}

function bucketBarColor(status: string | null) {
  const s = status?.toLowerCase();
  if (s === "low") return "bg-danger/70";
  if (s === "high") return "bg-warning/80";
  return "bg-white/35";
}

export function HealthSummarySection() {
  const [range, setRange] = useState<Range>("week");

  const { data, loading } = useQuery<GlucoseSummaryData>(PATIENT_GLUCOSE_SUMMARY_QUERY, {
    variables: { range },
    fetchPolicy: "cache-and-network",
  });

  const summary = data?.glucoseSummary;

  if (loading && !summary) {
    return (
      <section className="space-y-4">
        <h2 className="text-2xl">Health Summary</h2>
        <div className="h-48 animate-pulse rounded-2xl bg-border/40" />
      </section>
    );
  }

  if (!summary || summary.stats.totalCount === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl">Health Summary</h2>
          <RangeSelector range={range} onChange={setRange} />
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm text-muted">No glucose readings for this period. Log your first reading in Monitoring.</p>
        </div>
      </section>
    );
  }

  const { stats, buckets, unit, overallStatus } = summary;
  const maxAvg = Math.max(...buckets.map((b) => b.average ?? 0), 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl">Health Summary</h2>
        <RangeSelector range={range} onChange={setRange} />
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-primary to-blue-500 p-5 text-white shadow-soft sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Activity className="size-4" />
            Glucose · {unit}
          </div>
          <div className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs text-white/90">
            {statusLabel(overallStatus)}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-1.5">
          <p className="text-4xl font-semibold">
            {stats.average != null ? Number(stats.average).toFixed(1) : "—"}
          </p>
          <p className="text-sm text-white/70">avg {unit}</p>
        </div>

        {/* Bucket bar chart */}
        {buckets.length > 0 ? (
          <div className="mt-5 flex items-end gap-1.5">
            {buckets.map((bucket, i) => (
              <div key={i} className="group relative flex flex-1 flex-col items-center gap-1">
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-2.5 hidden -translate-x-1/2 flex-col items-center group-hover:flex z-10">
                  <div className="min-w-[110px] rounded-xl bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur-sm">
                    <p className="text-center text-[11px] font-medium text-slate-500">{bucket.label}</p>
                    <p className="mt-0.5 text-center text-lg font-bold leading-none text-slate-800">
                      {bucket.average != null ? Number(bucket.average).toFixed(1) : "—"}
                      <span className="ml-1 text-[10px] font-normal text-slate-400">{unit}</span>
                    </p>
                    <div className="mt-1.5 flex items-center justify-center gap-1.5">
                      <span className={cn(
                        "inline-block size-1.5 rounded-full",
                        bucket.status?.toLowerCase() === "low" ? "bg-red-400" :
                        bucket.status?.toLowerCase() === "high" ? "bg-amber-400" :
                        "bg-emerald-400",
                      )} />
                      <span className={cn(
                        "text-[10px] font-medium capitalize",
                        bucket.status?.toLowerCase() === "low" ? "text-red-500" :
                        bucket.status?.toLowerCase() === "high" ? "text-amber-500" :
                        "text-emerald-600",
                      )}>
                        {bucket.status ?? "normal"}
                      </span>
                    </div>
                    <p className="mt-1 text-center text-[10px] text-slate-400">
                      {bucket.readingCount} reading{bucket.readingCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {/* Arrow */}
                  <div className="size-2 rotate-45 bg-white/95" style={{ marginTop: "-4px" }} />
                </div>

                <div
                  className={cn(
                    "w-full cursor-default rounded-sm transition-all group-hover:opacity-100",
                    bucketBarColor(bucket.status),
                    bucket.readingCount === 0 ? "opacity-20" : "opacity-80 group-hover:opacity-100",
                  )}
                  style={{
                    height: `${Math.max(4, Math.round(((bucket.average ?? 0) / maxAvg) * 52))}px`,
                  }}
                />
                <p className="w-full truncate text-center text-[9px] text-white/50">{bucket.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-4 text-xs text-white/60">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-danger/70" />
            Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-white/35" />
            In range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-warning/80" />
            High
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Highest</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">
            {stats.highest != null ? Number(stats.highest).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted">{unit}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Lowest</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">
            {stats.lowest != null ? Number(stats.lowest).toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted">{unit}</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">In range</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">
            {stats.inRangeCount}/{stats.totalCount}
          </p>
          <p className="text-xs text-muted">readings</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">In range %</p>
          <p className="mt-1.5 text-2xl font-semibold text-text">
            {stats.inRangePercent != null ? `${Math.round(stats.inRangePercent)}%` : "—"}
          </p>
          <p className="text-xs text-muted">of readings</p>
        </div>
      </div>
    </section>
  );
}

function RangeSelector({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-lg px-3 py-1 text-xs font-medium transition",
            range === r.value
              ? "bg-primary text-white"
              : "text-muted hover:text-text",
          )}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
