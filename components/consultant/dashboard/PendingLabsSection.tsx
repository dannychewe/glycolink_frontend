"use client";

import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { PENDING_LAB_REVIEWS_QUERY } from "@/lib/consultant/labs-graphql";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelList, PanelEmpty, ViewAllLink } from "@/components/ui/panel";
import { cn } from "@/lib/utils/cn";

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
    { variables: { limit: 4 }, fetchPolicy: "cache-and-network" },
  );

  const items = data?.pendingLabReviews ?? [];
  const hasCritical = items.some((item) =>
    item.results.some((r) => r.result?.criticalFlags && r.result.criticalFlags.length > 0),
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle
          icon={Icons.labs}
          count={items.length}
          countTone={hasCritical ? "danger" : "warning"}
        >
          Pending Lab Reviews
        </PanelTitle>
        <ViewAllLink href="/consultant/labs" />
      </PanelHeader>

      {loading && items.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-8 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <PanelEmpty>No pending lab reviews.</PanelEmpty>
      ) : (
        <PanelList>
          {items.map((item) => {
            const critical = item.results.some(
              (r) => r.result?.criticalFlags && r.result.criticalFlags.length > 0,
            );
            const testNames = item.results.map((r) => r.testName).join(", ");
            return (
              <div
                key={item.labOrder.id}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-background"
              >
                <span className={cn("h-9 w-1 shrink-0 rounded-full", critical ? "bg-danger" : "bg-warning")} />
                <div className="min-w-0 flex-1">
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
        </PanelList>
      )}
    </Panel>
  );
}
