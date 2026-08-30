"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import {
  CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY,
  EXCUSE_MONITORING_GAP_MUTATION,
  OPEN_MONITORING_GAPS_QUERY,
  RESOLVE_MONITORING_GAP_MUTATION,
  type ClinicProgrammeDashboardOverview,
  type MonitoringGap,
} from "@/lib/programmes/graphql";
import { Icons } from "@/components/ui/icons";

type OverviewData = {
  clinicProgrammeDashboardOverview: ClinicProgrammeDashboardOverview;
};

type GapsData = {
  openMonitoringGaps: {
    items: MonitoringGap[];
    total: number;
  };
};

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The monitoring gap could not be updated.";
}

function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "0%";
  return `${Math.round(value)}%`;
}

function GapRow({ gap, onChanged }: { gap: MonitoringGap; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [excuse, excuseState] = useMutation(EXCUSE_MONITORING_GAP_MUTATION);
  const [resolve, resolveState] = useMutation(RESOLVE_MONITORING_GAP_MUTATION);
  const saving = excuseState.loading || resolveState.loading;

  async function run(action: "excuse" | "resolve") {
    setError(null);
    try {
      await (action === "excuse" ? excuse : resolve)({
        variables: {
          gapId: gap.id,
          reason: action === "excuse" ? "Clinician excused from frontend work queue." : "Follow-up completed from frontend work queue.",
        },
      });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <div className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text">{titleCase(gap.observationContext ?? gap.observationType)}</p>
            <Badge variant="warning">{titleCase(gap.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            Due {formatDateTime(gap.dueAt)} · detected {formatDateTime(gap.detectedAt)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {gap.consecutiveMissCount} consecutive misses · {gap.reminderAttemptCount} reminders
          </p>
          {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void run("excuse")}>
            Excuse
          </Button>
          <Button type="button" size="sm" disabled={saving} onClick={() => void run("resolve")}>
            Resolve
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProgrammeMonitoringOperationsView() {
  const overviewQuery = useQuery<OverviewData>(CLINIC_PROGRAMME_DASHBOARD_OVERVIEW_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const gapsQuery = useQuery<GapsData>(OPEN_MONITORING_GAPS_QUERY, {
    variables: { limit: 25 },
    fetchPolicy: "cache-and-network",
  });

  const overview = overviewQuery.data?.clinicProgrammeDashboardOverview;
  const gaps = gapsQuery.data?.openMonitoringGaps.items ?? [];

  if (overviewQuery.loading && !overview) {
    return <div className="h-96 animate-pulse rounded-lg bg-border/40" />;
  }

  if (overviewQuery.error || !overview) {
    return (
      <Panel>
        <PanelBody className="flex items-center gap-3 text-warning">
          <AlertTriangle className="size-5" />
          <p className="text-sm">Unable to load programme monitoring operations.</p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Adherence"
          value={formatPercent(overview.monitoringAdherence.adherenceRate)}
          sublabel={`${overview.monitoringAdherence.satisfiedWindows} satisfied windows`}
          icon={BarChart3}
          tone="primary"
        />
        <StatTile
          label="Missed Windows"
          value={overview.monitoringAdherence.missedWindows}
          sublabel={`${overview.monitoringAdherence.openMonitoringGaps} open gaps`}
          icon={Icons.warning}
          tone={overview.monitoringAdherence.missedWindows > 0 ? "warning" : "success"}
        />
        <StatTile
          label="Consecutive Misses"
          value={overview.monitoringAdherence.patientsWithConsecutiveMissedExpectations}
          sublabel="patients at risk"
          icon={Icons.monitoring}
          tone={overview.monitoringAdherence.patientsWithConsecutiveMissedExpectations > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label="Alerts From Gaps"
          value={overview.clinicalAlerts.monitoringGapWorkItems}
          sublabel="work queue items"
          icon={Icons.alerts}
          tone={overview.clinicalAlerts.monitoringGapWorkItems > 0 ? "warning" : "neutral"}
        />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={AlertTriangle} count={gapsQuery.data?.openMonitoringGaps.total ?? gaps.length} countTone="warning">
            Open Monitoring Gaps
          </PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void gapsQuery.refetch()}>
            Refresh
          </Button>
        </PanelHeader>
        {gaps.length === 0 ? (
          <PanelEmpty>
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <p className="mt-3 font-medium text-text">No open gaps</p>
            <p className="mt-1 text-xs text-muted">Missed glucose or vitals windows will appear here.</p>
          </PanelEmpty>
        ) : (
          <PanelList>
            {gaps.map((gap) => (
              <GapRow
                key={gap.id}
                gap={gap}
                onChanged={() => {
                  void gapsQuery.refetch();
                  void overviewQuery.refetch();
                }}
              />
            ))}
          </PanelList>
        )}
      </Panel>
    </div>
  );
}
