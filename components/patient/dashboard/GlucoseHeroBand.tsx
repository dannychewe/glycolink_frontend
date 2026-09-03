"use client";

import { useQuery } from "@apollo/client";
import { Activity } from "lucide-react";
import { GlucoseHeroCard, glucoseStatusKey } from "@/components/design-system";
import { PATIENT_GLUCOSE_SUMMARY_QUERY } from "@/lib/monitoring/graphql";

type GlucoseSummaryData = {
  glucoseSummary: {
    unit: string;
    overallStatus: string;
    stats: {
      average: number | null;
      inRangeCount: number;
      totalCount: number;
      inRangePercent: number | null;
    };
    buckets: { label: string; average: number | null; status: string | null; readingCount: number }[];
  };
};

/**
 * The dashboard's #1 job per the UX audit (docs/02 §1) — "answer 'am I okay?' in
 * <5s" — which the previous dashboard didn't answer at all: glucose status was
 * completely absent from this screen. One bold, unmissable band, above everything.
 */
export function GlucoseHeroBand() {
  const { data, loading } = useQuery<GlucoseSummaryData>(PATIENT_GLUCOSE_SUMMARY_QUERY, {
    variables: { range: "week" },
    fetchPolicy: "cache-and-network",
  });

  const summary = data?.glucoseSummary;

  if (!loading && (!summary || summary.stats.totalCount === 0)) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-5">
        <div className="flex items-center gap-3">
          <Activity className="size-5 text-muted" />
          <div>
            <p className="text-sm font-semibold text-text">No glucose readings this week</p>
            <p className="text-sm text-muted">Log your first reading to see your status here.</p>
          </div>
        </div>
        <a href="/patient/monitoring" className="text-sm font-semibold text-primary hover:text-primary/80">
          Log a reading &rarr;
        </a>
      </div>
    );
  }

  if (loading || !summary) {
    return <div className="h-40 animate-pulse rounded-lg border border-border bg-border/30" />;
  }

  const { stats, buckets, unit, overallStatus } = summary;

  return (
    <GlucoseHeroCard
      eyebrow={`Glucose · ${unit} · 7-day average`}
      value={stats.average}
      valueCaption={`${unit} avg`}
      status={glucoseStatusKey(overallStatus)}
      secondaryStat={{
        value: stats.inRangePercent != null ? `${Math.round(stats.inRangePercent)}%` : "—",
        label: "Time in Range",
      }}
      bars={buckets}
      footer={
        <>
          {stats.inRangeCount} of {stats.totalCount} readings in range this week &middot;{" "}
          <a href="/patient/monitoring" className="font-semibold text-white/80 hover:text-white">
            View full trend &rarr;
          </a>
        </>
      }
    />
  );
}
