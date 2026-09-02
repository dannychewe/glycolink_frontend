"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList, LineChart, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Panel, PanelBody, PanelEmpty, PanelHeader, PanelList, PanelTitle, StatTile } from "@/components/ui/panel";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import {
  CLINIC_CARE_PROGRAMMES_QUERY,
  CLINIC_RESPONSE_PERFORMANCE_SUMMARY_QUERY,
  CLINIC_WORK_QUEUE_REPORTING_SUMMARY_QUERY,
  OPERATIONAL_TREND_SERIES_QUERY,
  PROGRAMME_ADHERENCE_REPORTING_SUMMARY_QUERY,
  PROGRAMME_COMPARISON_QUERY,
  type CareProgramme,
  type ClinicResponsePerformanceReporting,
  type ClinicWorkQueueReportingSummary,
  type OperationalTrendSeries,
  type ProgrammeAdherenceReportingSummary,
  type ProgrammeComparison,
} from "@/lib/programmes/graphql";

type ProgrammesData = {
  clinicCareProgrammes: CareProgramme[];
};

type AdherenceData = {
  programmeAdherenceReportingSummary: ProgrammeAdherenceReportingSummary;
};

type WorkQueueData = {
  clinicWorkQueueReportingSummary: ClinicWorkQueueReportingSummary;
};

type ResponseData = {
  clinicResponsePerformanceSummary: ClinicResponsePerformanceReporting;
};

type TrendsData = {
  operationalTrendSeries: OperationalTrendSeries;
};

type ComparisonData = {
  programmeComparison: ProgrammeComparison;
};

function percent(value: number | null | undefined) {
  if (value == null) return "n/a";
  return `${Math.round(value * 10) / 10}%`;
}

function minutes(value: number | null | undefined) {
  if (value == null) return "n/a";
  return `${Math.round(value)} min`;
}

function jsonEntries(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).slice(0, 6);
}

export function ProgrammeReportingDashboard() {
  const [programmeId, setProgrammeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [granularity, setGranularity] = useState("weekly");

  const variables = {
    programmeId: programmeId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    timezoneName: "Africa/Lusaka",
  };
  const programmesQuery = useQuery<ProgrammesData>(CLINIC_CARE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const selectedProgramme = useMemo(
    () => programmesQuery.data?.clinicCareProgrammes.find((programme) => programme.id === programmeId) ?? null,
    [programmeId, programmesQuery.data?.clinicCareProgrammes],
  );
  const adherenceQuery = useQuery<AdherenceData>(PROGRAMME_ADHERENCE_REPORTING_SUMMARY_QUERY, {
    variables,
    skip: !programmeId,
    fetchPolicy: "cache-and-network",
  });
  const workQueueQuery = useQuery<WorkQueueData>(CLINIC_WORK_QUEUE_REPORTING_SUMMARY_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });
  const responseQuery = useQuery<ResponseData>(CLINIC_RESPONSE_PERFORMANCE_SUMMARY_QUERY, {
    variables,
    fetchPolicy: "cache-and-network",
  });
  const trendsQuery = useQuery<TrendsData>(OPERATIONAL_TREND_SERIES_QUERY, {
    variables: { ...variables, granularity },
    fetchPolicy: "cache-and-network",
  });
  const comparisonQuery = useQuery<ComparisonData>(PROGRAMME_COMPARISON_QUERY, {
    variables: { startDate: startDate || undefined, endDate: endDate || undefined, timezoneName: "Africa/Lusaka" },
    fetchPolicy: "cache-and-network",
  });

  const adherence = adherenceQuery.data?.programmeAdherenceReportingSummary.monitoringAdherence;
  const alerts = workQueueQuery.data?.clinicWorkQueueReportingSummary.clinicalAlerts;
  const workload = workQueueQuery.data?.clinicWorkQueueReportingSummary.careTeamWorkload;
  const response = responseQuery.data?.clinicResponsePerformanceSummary.responsePerformance;
  const trends = trendsQuery.data?.operationalTrendSeries.buckets ?? [];
  const comparison = comparisonQuery.data?.programmeComparison.items ?? [];
  const programmeOptions = (programmesQuery.data?.clinicCareProgrammes ?? []).map((programme) => ({
    value: programme.id,
    label: programme.name,
    description: programme.code,
    badge: programme.status,
  }));
  const loading = workQueueQuery.loading || responseQuery.loading || trendsQuery.loading || comparisonQuery.loading;
  const error = workQueueQuery.error || responseQuery.error || trendsQuery.error || comparisonQuery.error || adherenceQuery.error;

  function refresh() {
    void adherenceQuery.refetch();
    void workQueueQuery.refetch();
    void responseQuery.refetch();
    void trendsQuery.refetch();
    void comparisonQuery.refetch();
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader>
          <PanelTitle icon={BarChart3}>Report Filters</PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={refresh}>
            Refresh
          </Button>
        </PanelHeader>
        <PanelBody>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="space-y-1.5">
              <SearchableSelector
                id="report-programme"
                label="Programme"
                value={programmeId}
                options={programmeOptions}
                placeholder="Search programme"
                emptyLabel={programmesQuery.loading ? "Loading programmes..." : "No programmes found"}
                disabled={programmesQuery.loading}
                onChange={setProgrammeId}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-start">Start date</Label>
              <Input id="report-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-end">End date</Label>
              <Input id="report-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-granularity">Trend buckets</Label>
              <Input id="report-granularity" value={granularity} onChange={(event) => setGranularity(event.target.value)} placeholder="daily, weekly, monthly" />
            </div>
          </div>
          {selectedProgramme ? <p className="mt-3 text-xs text-muted">Selected: {selectedProgramme.name}</p> : null}
        </PanelBody>
      </Panel>

      {error ? (
        <Panel>
          <PanelBody className="flex items-center gap-3 text-warning">
            <AlertTriangle className="size-5" />
            <p className="text-sm">Some reporting data could not be loaded. Check role permissions and programme scope.</p>
          </PanelBody>
        </Panel>
      ) : null}

      {loading && !alerts ? <div className="h-48 animate-pulse rounded-lg bg-border/40" /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Adherence" value={percent(adherence?.adherenceRate)} sublabel={`${adherence?.satisfiedWindows ?? 0}/${adherence?.totalExpectedWindows ?? 0} windows satisfied`} icon={LineChart} tone={(adherence?.openMonitoringGaps ?? 0) > 0 ? "warning" : "success"} />
        <StatTile label="Open Alerts" value={alerts?.totalActiveAlerts ?? 0} sublabel={`${alerts?.unassignedActiveAlerts ?? 0} unassigned`} icon={AlertTriangle} tone={(alerts?.overdueActiveAlerts ?? 0) > 0 ? "danger" : "neutral"} />
        <StatTile label="First Review" value={minutes(response?.medianTimeToFirstReviewMinutes)} sublabel={`${response?.alertsWithoutReviewTarget ?? 0} without target`} icon={ClipboardList} tone="primary" />
        <StatTile label="Escalations" value={response?.escalationCount ?? 0} sublabel={`${response?.reopenedAlertCount ?? 0} reopened`} icon={AlertTriangle} tone={(response?.escalationCount ?? 0) > 0 ? "warning" : "neutral"} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users}>Work Queue Performance</PanelTitle>
          </PanelHeader>
          <PanelBody className="grid gap-3 sm:grid-cols-2">
            <StatTile label="Awaiting review" value={alerts?.alertsAwaitingFirstReview ?? 0} sublabel="first clinical touch" icon={ClipboardList} />
            <StatTile label="Overdue active" value={alerts?.overdueActiveAlerts ?? 0} sublabel="outside due target" icon={AlertTriangle} tone={(alerts?.overdueActiveAlerts ?? 0) > 0 ? "danger" : "success"} />
            <StatTile label="Claimed" value={workload?.alertsClaimedDuringPeriod ?? 0} sublabel="during period" icon={Users} />
            <StatTile label="Resolved" value={workload?.alertsResolvedDuringPeriod ?? 0} sublabel="during period" icon={CheckCircle2} tone="success" />
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHeader>
            <PanelTitle icon={LineChart} count={trends.length}>Operational Trends</PanelTitle>
          </PanelHeader>
          {trends.length === 0 ? (
            <PanelEmpty>No trend buckets returned for this date range.</PanelEmpty>
          ) : (
            <PanelList>
              {trends.slice(0, 8).map((bucket) => (
                <div key={`${bucket.label}-${bucket.bucketStart}`} className="px-5 py-3">
                  <p className="text-sm font-semibold text-text">{bucket.label}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {jsonEntries(bucket.metrics).map(([key, value]) => (
                      <div key={key} className="rounded-lg border border-border bg-background px-3 py-2">
                        <p className="truncate text-xs text-muted">{key}</p>
                        <p className="mt-1 text-sm font-semibold text-text">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </PanelList>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={BarChart3} count={comparison.length}>Programme Comparison</PanelTitle>
        </PanelHeader>
        {comparison.length === 0 ? (
          <PanelEmpty>No programmes returned for comparison.</PanelEmpty>
        ) : (
          <PanelList>
            {comparison.map((item) => (
              <div key={item.programmeId} className="px-5 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{item.programmeName}</p>
                    <p className="mt-1 text-xs text-muted">{item.activeEnrolments} active enrolments · {item.readinessBlockers} readiness blockers</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={(item.patientsWithMonitoringGaps ?? 0) > 0 ? "warning" : "success"}>{item.patientsWithMonitoringGaps} gaps</Badge>
                    <Badge variant={(item.activeClinicalAlerts ?? 0) > 0 ? "danger" : "secondary"}>{item.activeClinicalAlerts} alerts</Badge>
                    <Badge variant="primary">{percent(item.adherenceRate)}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </PanelList>
        )}
      </Panel>
    </div>
  );
}
