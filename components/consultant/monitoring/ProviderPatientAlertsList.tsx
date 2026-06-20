"use client";

import { useQuery, useMutation } from "@apollo/client";
import { AlertTriangle, CheckCircle2, User } from "lucide-react";
import { PROVIDER_PATIENT_ALERTS_QUERY, ACKNOWLEDGE_ALERT_MUTATION } from "@/lib/monitoring/graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type PatientAlert = {
  patientName: string;
  alert: {
    id: string;
    type: string;
    severity: string;
    sourceEntityType: string;
    sourceEntityId: string;
    message: string;
    createdAt: string;
    acknowledgedAt: string | null;
  };
};

type AlertsData = {
  providerPatientAlerts: PatientAlert[];
};

function severityVariant(severity: string): "danger" | "warning" | "secondary" {
  if (severity === "HIGH") return "danger";
  if (severity === "MEDIUM") return "warning";
  return "secondary";
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

function AlertRow({ item, onAcknowledged }: { item: PatientAlert; onAcknowledged: () => void }) {
  const [acknowledge, { loading }] = useMutation(ACKNOWLEDGE_ALERT_MUTATION, {
    variables: { alertId: item.alert.id },
    onCompleted: onAcknowledged,
  });

  const isAcknowledged = !!item.alert.acknowledgedAt;

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 bg-surface p-5 transition-opacity",
        severityBorder(item.alert.severity),
        isAcknowledged && "opacity-60",
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className="size-3.5 text-muted" />
            <p className="text-sm font-semibold text-text">{item.patientName}</p>
            <Badge variant={severityVariant(item.alert.severity)}>{item.alert.severity}</Badge>
            {isAcknowledged ? <Badge variant="secondary">Acknowledged</Badge> : null}
          </div>
          <p className="text-sm text-text">{item.alert.message}</p>
          <p className="text-xs text-muted">{formatDate(item.alert.createdAt)}</p>
        </div>

        {!isAcknowledged ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={() => acknowledge()}
            className="shrink-0"
          >
            {loading ? "Acknowledging…" : "Acknowledge"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function ProviderPatientAlertsList() {
  const { data, loading, error, refetch } = useQuery<AlertsData>(PROVIDER_PATIENT_ALERTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "network-only",
  });

  const alerts = data?.providerPatientAlerts ?? [];
  const active = alerts.filter((a) => !a.alert.acknowledgedAt);
  const acknowledged = alerts.filter((a) => a.alert.acknowledgedAt);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load patient alerts right now.
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto size-8 text-success" />
        <p className="mt-3 text-base font-medium text-text">No patient alerts</p>
        <p className="mt-1 text-sm text-muted">
          Alerts appear here when patients exceed configured thresholds.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {active.length > 0 ? (
            <AlertTriangle className="size-4 text-warning" />
          ) : null}
          <p className="text-sm text-muted">
            {active.length} active · {acknowledged.length} acknowledged
          </p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      {active.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warning">
            Active
          </p>
          {active.map((item) => (
            <AlertRow key={item.alert.id} item={item} onAcknowledged={() => refetch()} />
          ))}
        </div>
      ) : null}

      {acknowledged.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Acknowledged
          </p>
          {acknowledged.map((item) => (
            <AlertRow key={item.alert.id} item={item} onAcknowledged={() => refetch()} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
