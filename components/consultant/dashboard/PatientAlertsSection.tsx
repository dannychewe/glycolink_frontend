"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { PROVIDER_PATIENT_ALERTS_QUERY } from "@/lib/monitoring/graphql";

type AlertItem = {
  patientName: string | null;
  alert: {
    id: string;
    type: string;
    severity: string;
    message: string;
    createdAt: string;
    acknowledgedAt: string | null;
  };
};

type AlertsData = {
  providerPatientAlerts: AlertItem[];
};

function severityVariant(severity: string) {
  const s = severity.toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "danger" as const;
  if (s === "MEDIUM") return "warning" as const;
  return "secondary" as const;
}

function severityBorder(severity: string) {
  const s = severity.toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "border-l-danger/60";
  if (s === "MEDIUM") return "border-l-warning/60";
  return "border-l-border";
}

function formatTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function PatientAlertsSection() {
  const { data, loading, error } = useQuery<AlertsData>(
    PROVIDER_PATIENT_ALERTS_QUERY,
    {
      variables: { limit: 5 },
      fetchPolicy: "network-only",
    },
  );

  const alerts = data?.providerPatientAlerts ?? [];
  const activeAlerts = alerts.filter((a) => !a.alert.acknowledgedAt);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-danger/10 text-danger">
            <Bell className="size-3.5" />
          </span>
          <h2 className="text-base font-semibold text-text">Patient Alerts</h2>
          {activeAlerts.length > 0 ? (
            <span className="flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white">
              {activeAlerts.length}
            </span>
          ) : null}
        </div>
        <Button href="/consultant/monitoring" variant="ghost" size="sm">
          View all
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load patient alerts right now.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && activeAlerts.length === 0 && !error ? (
        <div className="rounded-2xl border border-border bg-surface px-5 py-6 text-center">
          <p className="text-sm font-medium text-text">No active alerts</p>
          <p className="mt-0.5 text-xs text-muted">All patient readings are within range.</p>
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-2">
          {activeAlerts.map((item) => (
            <div
              key={item.alert.id}
              className={cn(
                "flex flex-col gap-3 rounded-xl border-l-4 bg-surface px-4 py-3.5 shadow-subtle sm:flex-row sm:items-start sm:justify-between",
                severityBorder(item.alert.severity),
              )}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-text">
                    {item.patientName ?? "Unknown Patient"}
                  </p>
                  <Badge variant={severityVariant(item.alert.severity)}>
                    {item.alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-muted leading-5">{item.alert.message}</p>
                <p className="text-xs text-muted/70">{formatTime(item.alert.createdAt)}</p>
              </div>
              <Link
                href="/consultant/monitoring"
                className="shrink-0 text-xs font-medium text-primary hover:underline"
              >
                Review
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
