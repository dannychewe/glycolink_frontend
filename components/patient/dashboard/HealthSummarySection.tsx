"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
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
  if (s === "high") return "bg-warning";
  return "bg-white/80";
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
        <SectionHeading />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-border/30" />
      </section>
    );
  }

  if (!summary || summary.stats.totalCount === 0) {
    return (
      <section className="space-y-4">
        <SectionHeading range={range} onChange={setRange} />
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center">
          <p className="text-sm text-muted">No glucose readings for this period. Log your first reading in Monitoring.</p>
        </div>
      </section>
    );
  }

  const { stats, buckets, unit, overallStatus } = summary;
  const maxAvg = Math.max(...buckets.map((b) => b.average ?? 0), 1);

  return (
    <section className="space-y-4">
      <SectionHeading range={range} onChange={setRange} />

      <div className="relative overflow-hidden rounded-lg border border-ink/20 bg-ink p-5 text-white sm:p-6">
        <div className="clinical-grid-light absolute inset-0 opacity-60" />
        <div className="relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Icons.monitoring className="size-4" />
            Glucose · {unit}
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/85 ring-1 ring-inset ring-white/15">
            <span className="size-1.5 rounded-full bg-success" />
            {statusLabel(overallStatus)}
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <p className="font-mono text-4xl font-medium tabular-nums tracking-tight">
            {stats.average != null ? Number(stats.average).toFixed(1) : "—"}
          </p>
          <p className="font-mono text-xs text-white/55">avg {unit}</p>
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
                <p className="w-full truncate text-center font-mono text-[9px] text-white/50">{bucket.label}</p>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-3 flex gap-4 font-mono text-[0.7rem] text-white/55">
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-danger/70" />
            Low
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-white/80" />
            In range
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block size-2 rounded-sm bg-warning" />
            High
          </span>
        </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
        <StatBox
          label="Highest"
          value={stats.highest != null ? Number(stats.highest).toFixed(1) : "—"}
          sub={unit}
        />
        <StatBox
          label="Lowest"
          value={stats.lowest != null ? Number(stats.lowest).toFixed(1) : "—"}
          sub={unit}
        />
        <StatBox
          label="In range"
          value={`${stats.inRangeCount}/${stats.totalCount}`}
          sub="readings"
        />
        <StatBox
          label="In range %"
          value={stats.inRangePercent != null ? `${Math.round(stats.inRangePercent)}%` : "—"}
          sub="of readings"
          accent
        />
      </div>
    </section>
  );
}

function SectionHeading({ range, onChange }: { range?: Range; onChange?: (r: Range) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-lg font-semibold text-ink">Health Summary</h2>
      {range && onChange ? <RangeSelector range={range} onChange={onChange} /> : null}
    </div>
  );
}

function StatBox({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-surface px-5 py-4">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p
        className={cn(
          "mt-1.5 font-mono text-2xl font-medium tabular-nums",
          accent ? "text-secondary" : "text-ink",
        )}
      >
        {value}
      </p>
      <p className="font-mono text-xs text-muted">{sub}</p>
    </div>
  );
}

function RangeSelector({ range, onChange }: { range: Range; onChange: (r: Range) => void }) {
  return (
    <div className="flex gap-1 rounded-lg border border-border bg-surface p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition",
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
