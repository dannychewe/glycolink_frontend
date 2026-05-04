"use client";

import { useQuery } from "@apollo/client";
import { FlaskConical } from "lucide-react";
import { PENDING_LAB_REVIEWS_QUERY } from "@/lib/consultant/labs-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type CriticalFlag = {
  id: string;
  severity: string;
  notifiedProviderAt: string | null;
  acknowledgedAt: string | null;
};

type PendingLabReview = {
  patientName: string | null;
  labOrder: {
    id: string;
    status: string;
    orderedAt: string;
    encounterId: string | null;
    patientId: string;
  };
  results: {
    testId: string;
    testName: string;
    result: {
      id: string;
      flag: string | null;
      criticalFlags: CriticalFlag[];
    } | null;
  }[];
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function PendingLabsSection() {
  const { data, loading } = useQuery<{ pendingLabReviews: PendingLabReview[] }>(
    PENDING_LAB_REVIEWS_QUERY,
    { variables: { limit: 4 }, fetchPolicy: "network-only" },
  );

  const items = data?.pendingLabReviews ?? [];
  const hasCritical = items.some((item) =>
    item.results.some((r) => r.result?.criticalFlags && r.result.criticalFlags.length > 0),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FlaskConical className="size-3.5" />
          </span>
          <h2 className="text-base font-semibold text-text">Pending Lab Reviews</h2>
          {!loading && items.length > 0 ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${hasCritical ? "bg-danger/10 text-danger" : "bg-warning/10 text-warning"}`}>
              {items.length}
            </span>
          ) : null}
        </div>
        <Button href="/consultant/labs" variant="ghost" size="sm">
          View all
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-6 text-center">
          <p className="text-sm text-muted">No pending lab reviews</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const critical = item.results.some(
              (r) => r.result?.criticalFlags && r.result.criticalFlags.length > 0,
            );
            const testNames = item.results.map((r) => r.testName).join(", ");
            return (
              <div
                key={item.labOrder.id}
                className={`flex items-start justify-between gap-3 rounded-xl border-l-4 bg-surface px-4 py-3 shadow-subtle ${critical ? "border-l-danger/60" : "border-l-warning/60"}`}
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-text">
                    {item.patientName ?? `Patient ${item.labOrder.patientId.slice(0, 8)}…`}
                  </p>
                  <p className="truncate text-xs text-muted">{testNames || "Lab order"}</p>
                  <p className="text-xs text-muted">{formatDate(item.labOrder.orderedAt)}</p>
                </div>
                {critical ? <Badge variant="danger">Critical</Badge> : <Badge variant="warning">Review</Badge>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
