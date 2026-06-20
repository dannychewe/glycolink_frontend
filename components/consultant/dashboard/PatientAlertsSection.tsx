"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { Icons } from "@/components/ui/icons";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelHeader, PanelTitle, PanelList, PanelEmpty, ViewAllLink } from "@/components/ui/panel";
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

function severityAccent(severity: string) {
  const s = severity.toUpperCase();
  if (s === "CRITICAL" || s === "HIGH") return "bg-danger";
  if (s === "MEDIUM") return "bg-warning";
  return "bg-border";
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
      fetchPolicy: "cache-and-network",
    },
  );

  const alerts = data?.providerPatientAlerts ?? [];
  const activeAlerts = alerts.filter((a) => !a.alert.acknowledgedAt);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.alerts} count={activeAlerts.length} countTone="danger">
          Patient Alerts
        </PanelTitle>
        <ViewAllLink href="/consultant/monitoring" />
      </PanelHeader>

      {error ? (
        <PanelEmpty className="text-warning">Unable to load patient alerts right now.</PanelEmpty>
      ) : loading && activeAlerts.length === 0 ? (
        <div className="divide-y divide-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="px-5 py-4">
              <div className="h-9 animate-pulse rounded bg-border/50" />
            </div>
          ))}
        </div>
      ) : activeAlerts.length === 0 ? (
        <PanelEmpty>
          <p className="font-medium text-text">No active alerts</p>
          <p className="mt-0.5 text-xs text-muted">All patient readings are within range.</p>
        </PanelEmpty>
      ) : (
        <PanelList>
          {activeAlerts.map((item) => (
            <div key={item.alert.id} className="flex gap-3 px-5 py-3.5 transition-colors hover:bg-background">
              <span className={cn("mt-0.5 w-1 shrink-0 rounded-full", severityAccent(item.alert.severity))} />
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-text">
                    {item.patientName ?? "Unknown Patient"}
                  </p>
                  <Badge variant={severityVariant(item.alert.severity)}>{item.alert.severity}</Badge>
                </div>
                <p className="text-sm leading-5 text-muted">{item.alert.message}</p>
                <p className="text-xs text-muted/70">{formatTime(item.alert.createdAt)}</p>
              </div>
              <Link
                href="/consultant/monitoring"
                className="shrink-0 self-start text-xs font-medium text-primary hover:underline"
              >
                Review
              </Link>
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}
