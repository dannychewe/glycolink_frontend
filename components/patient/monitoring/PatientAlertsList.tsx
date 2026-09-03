"use client";

import { useQuery } from "@apollo/client";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { MY_ALERTS_QUERY } from "@/lib/monitoring/graphql";
import { StatusBadge, type StatusTone } from "@/components/design-system";
import { cn } from "@/lib/utils/cn";

type Alert = {
  id: string;
  type: string;
  severity: string;
  message: string;
  createdAt: string;
  acknowledgedAt: string | null;
};

type AlertsData = {
  myAlerts: Alert[];
};

function severityTone(severity: string): StatusTone {
  if (severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "neutral";
}

function severityBorder(severity: string) {
  if (severity === "HIGH") return "border-l-danger/60";
  if (severity === "MEDIUM") return "border-l-warning/60";
  return "border-l-border";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PatientAlertsList() {
  const { data, loading, error } = useQuery<AlertsData>(MY_ALERTS_QUERY, {
    fetchPolicy: "network-only",
  });

  const alerts = data?.myAlerts ?? [];
  const unacknowledged = alerts.filter((a) => !a.acknowledgedAt);
  const acknowledged = alerts.filter((a) => a.acknowledgedAt);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load alerts right now.
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 text-base font-medium text-text">No active alerts</p>
        <p className="mt-1 text-sm text-muted">Your monitoring is on track.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {unacknowledged.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" />
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-warning">
              Active alerts ({unacknowledged.length})
            </p>
          </div>
          {unacknowledged.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-xl border-l-4 bg-surface px-4 py-4",
                severityBorder(alert.severity),
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-text">{alert.message}</p>
                <StatusBadge tone={severityTone(alert.severity)} label={alert.severity} size="sm" className="shrink-0" />
              </div>
              <p className="mt-1.5 text-xs text-muted">{formatDate(alert.createdAt)}</p>
            </div>
          ))}
        </div>
      ) : null}

      {acknowledged.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
            Acknowledged ({acknowledged.length})
          </p>
          {acknowledged.map((alert) => (
            <div
              key={alert.id}
              className="rounded-xl border border-border bg-surface px-4 py-4 opacity-60"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-text">{alert.message}</p>
                <StatusBadge tone="neutral" label="Resolved" size="sm" className="shrink-0" />
              </div>
              <p className="mt-1.5 text-xs text-muted">{formatDate(alert.createdAt)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
