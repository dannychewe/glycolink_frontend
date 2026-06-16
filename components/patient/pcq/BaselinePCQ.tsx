"use client";

import { useQuery } from "@apollo/client";
import { PATIENT_BASELINE_PCQ_QUERY } from "@/lib/patient/pcq-graphql";
import { PCQResponseForm } from "@/components/patient/pcq/PCQResponseForm";

type BaselineResponse = { id: string } | null;

export function BaselinePCQ() {
  const { data, loading, error } = useQuery<{ baselinePcq: BaselineResponse }>(
    PATIENT_BASELINE_PCQ_QUERY,
    { fetchPolicy: "network-only" },
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-border/40" />
        <div className="h-64 animate-pulse rounded-xl bg-border/40" />
      </div>
    );
  }

  if (error || !data?.baselinePcq) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load your baseline questionnaire. Please try again or contact support.
      </div>
    );
  }

  return <PCQResponseForm responseId={data.baselinePcq.id} />;
}
