"use client";

import { FormEvent, useState } from "react";
import { useUrlState } from "@/lib/use-url-state";
import { useMutation, useQuery } from "@apollo/client";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ACKNOWLEDGE_ALERT_MUTATION,
  CONSULTANT_PATIENT_MONITORING_QUERY,
  GLUCOSE_UNIT,
  LOG_GLUCOSE_FOR_PATIENT_MUTATION,
  SET_THRESHOLD_MUTATION,
  type SetThresholdVariables,
  type ConsultantPatientMonitoring,
} from "@/lib/monitoring/graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";

const CHART_COLORS = {
  primary: "#127C86",
  primaryFill: "rgba(18, 124, 134, 0.12)",
  danger: "#EF4444",
  warning: "#F59E0B",
  border: "#E2E7E7",
  muted: "#6B7575",
  surface: "#ffffff",
} as const;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleString("en-ZM", {
    timeZone: "Africa/Lusaka",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function titleCase(value: string | null | undefined) {
  return value
    ? value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not classified";
}

function num(value: number | string | null | undefined, digits = 1) {
  if (value == null || value === "") return "--";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(digits) : "--";
}

function tone(
  value: string | null | undefined,
): "success" | "warning" | "danger" | "secondary" {
  const status = (value ?? "").toLowerCase();
  if (["critical", "high"].includes(status)) return "danger";
  if (["low", "warning", "abnormal", "elevated"].includes(status))
    return "warning";
  if (["normal", "in_range", "good"].includes(status)) return "success";
  return "secondary";
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string | null;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="break-words text-xl font-semibold tabular-nums text-ink">
        {value}
        {unit && value !== "--" ? (
          <span className="ml-1.5 text-xs font-normal text-muted">{unit}</span>
        ) : null}
      </dd>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number | null; payload: { readingCount: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="border border-border bg-surface px-3 py-2 text-xs">
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-1 text-muted">
        Avg:{" "}
        <span className="font-semibold tabular-nums text-ink">
          {entry.value != null ? entry.value.toFixed(1) : "--"}
        </span>{" "}
        mmol/L
      </p>
      <p className="text-muted">
        {entry.payload.readingCount}{" "}
        {entry.payload.readingCount === 1 ? "reading" : "readings"}
      </p>
    </div>
  );
}

function GlucoseTrendChart({
  buckets,
  thresholdLow,
  thresholdHigh,
}: {
  buckets: ConsultantPatientMonitoring["glucoseSummary"] extends infer S
    ? S extends { buckets: infer B }
      ? B
      : never
    : never;
  thresholdLow: number | null;
  thresholdHigh: number | null;
}) {
  const data = buckets.map((bucket) => ({
    label: bucket.label,
    average:
      bucket.readingCount > 0 && bucket.average != null
        ? Number(bucket.average)
        : null,
    readingCount: bucket.readingCount,
  }));

  const hasData = data.some((d) => d.average != null);

  if (!hasData) {
    return (
      <div className="flex h-48 items-center justify-center border border-border bg-background/50 text-sm text-muted">
        No readings in this period
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={CHART_COLORS.border}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
            tickLine={false}
            axisLine={{ stroke: CHART_COLORS.border }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: CHART_COLORS.muted }}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 1", "dataMax + 1"]}
          />
          <Tooltip content={<ChartTooltip />} />
          {thresholdLow != null ? (
            <ReferenceLine
              y={thresholdLow}
              stroke={CHART_COLORS.warning}
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `Low ${thresholdLow}`,
                position: "insideBottomLeft",
                fontSize: 10,
                fill: CHART_COLORS.warning,
              }}
            />
          ) : null}
          {thresholdHigh != null ? (
            <ReferenceLine
              y={thresholdHigh}
              stroke={CHART_COLORS.danger}
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `High ${thresholdHigh}`,
                position: "insideTopLeft",
                fontSize: 10,
                fill: CHART_COLORS.danger,
              }}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey="average"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            fill={CHART_COLORS.primaryFill}
            dot={{
              r: 3.5,
              fill: CHART_COLORS.surface,
              stroke: CHART_COLORS.primary,
              strokeWidth: 2,
            }}
            activeDot={{
              r: 5,
              fill: CHART_COLORS.primary,
              stroke: CHART_COLORS.surface,
              strokeWidth: 2,
            }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ThresholdModal({
  patientId,
  threshold,
  onClose,
  onSaved,
}: {
  patientId: string;
  threshold: ConsultantPatientMonitoring["activeThreshold"];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [low, setLow] = useState(threshold?.glucoseLow?.toString() ?? "");
  const [high, setHigh] = useState(threshold?.glucoseHigh?.toString() ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saveThreshold, { loading }] = useMutation<
    unknown,
    SetThresholdVariables
  >(SET_THRESHOLD_MUTATION);
  const lowValue = low.trim() ? Number(low) : null;
  const highValue = high.trim() ? Number(high) : null;
  const invalid =
    (lowValue === null && highValue === null) ||
    (lowValue !== null && (!Number.isFinite(lowValue) || lowValue <= 0)) ||
    (highValue !== null && (!Number.isFinite(highValue) || highValue <= 0)) ||
    (lowValue !== null && highValue !== null && lowValue >= highValue);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (loading || invalid) return;
    setError(null);
    try {
      await saveThreshold({
        variables: {
          patientId,
          data: { type: "glucose", minValue: lowValue, maxValue: highValue },
        },
      });
      onSaved();
      onClose();
    } catch {
      setError("Unable to save the threshold. Please try again.");
    }
  }
  return (
    <DetailModal
      title={threshold ? "Edit glucose threshold" : "Set glucose threshold"}
      className="sm:max-w-lg"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="monitoring-threshold-form"
            size="sm"
            disabled={loading || invalid}
          >
            <Save className="size-4" />
            {loading ? "Saving..." : "Save threshold"}
          </Button>
        </div>
      }
    >
      <form
        id="monitoring-threshold-form"
        onSubmit={(event) => void save(event)}
        className="space-y-4"
      >
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <fieldset disabled={loading} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="threshold-low">Lower threshold (mmol/L)</Label>
            <Input
              id="threshold-low"
              type="number"
              step="any"
              min="0"
              value={low}
              onChange={(event) => setLow(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="threshold-high">Upper threshold (mmol/L)</Label>
            <Input
              id="threshold-high"
              type="number"
              step="any"
              min="0"
              value={high}
              onChange={(event) => setHigh(event.target.value)}
            />
          </div>
        </fieldset>
        {invalid ? (
          <p className="text-xs text-danger">
            Provide at least one positive value. The lower value must be below
            the upper value.
          </p>
        ) : null}
      </form>
    </DetailModal>
  );
}

const GLUCOSE_CONTEXT_OPTIONS = [
  { value: "fasting", label: "Fasting" },
  { value: "pre_meal", label: "Pre-meal" },
  { value: "post_meal", label: "Post-meal" },
  { value: "bedtime", label: "Bedtime" },
  { value: "random", label: "Random" },
] as const;

function ManualGlucoseModal({
  patientId,
  onClose,
  onSaved,
}: {
  patientId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [context, setContext] = useState("random");
  const [error, setError] = useState<string | null>(null);
  const [logGlucose, { loading }] = useMutation(
    LOG_GLUCOSE_FOR_PATIENT_MUTATION,
  );

  const numericValue = value.trim() ? Number(value) : null;
  const invalid =
    numericValue === null ||
    !Number.isFinite(numericValue) ||
    numericValue <= 0;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading || invalid) return;
    setError(null);
    try {
      await logGlucose({
        variables: {
          patientId,
          data: { value: numericValue, context },
        },
      });
      onSaved();
      onClose();
    } catch {
      setError("Unable to log this reading. Please try again.");
    }
  }

  return (
    <DetailModal
      title="Log glucose reading"
      subtitle="Record a manual reading on behalf of the patient"
      className="sm:max-w-md"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="manual-glucose-form"
            size="sm"
            disabled={loading || invalid}
          >
            <Save className="size-4" />
            {loading ? "Saving..." : "Save reading"}
          </Button>
        </div>
      }
    >
      <form
        id="manual-glucose-form"
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-4"
      >
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <fieldset disabled={loading} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="glucose-value">
              Glucose value (mmol/L) <span className="text-danger">*</span>
            </Label>
            <Input
              id="glucose-value"
              type="number"
              step="0.1"
              min="0"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="e.g. 6.5"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="glucose-context">Context</Label>
            <Select
              id="glucose-context"
              value={context}
              onChange={(event) => setContext(event.target.value)}
              options={GLUCOSE_CONTEXT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
        </fieldset>
      </form>
    </DetailModal>
  );
}

function AlertRow({
  alert,
  onAcknowledged,
}: {
  alert: ConsultantPatientMonitoring["alerts"][number];
  onAcknowledged: () => void;
}) {
  const [acknowledge, { loading }] = useMutation(ACKNOWLEDGE_ALERT_MUTATION);
  const [error, setError] = useState<string | null>(null);
  async function handleAcknowledge() {
    if (loading || alert.acknowledgedAt) return;
    setError(null);
    try {
      await acknowledge({ variables: { alertId: alert.id } });
      onAcknowledged();
    } catch {
      setError("Unable to acknowledge this alert. Please try again.");
    }
  }
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 border-b border-border py-4">
      <div className="min-w-0 flex-1 basis-64 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            className="rounded-md tracking-normal"
            variant={tone(alert.severity)}
          >
            {titleCase(alert.severity)}
          </Badge>
          <span className="text-xs text-muted">
            {formatDateTime(alert.createdAt)}
          </span>
          {alert.acknowledgedAt ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <CheckCircle2 className="size-3.5" />
              Acknowledged {formatDateTime(alert.acknowledgedAt)}
            </span>
          ) : null}
        </div>
        <p className="break-words text-sm leading-6 text-text">
          {alert.message ?? "Monitoring alert"}
        </p>
        {error ? (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        ) : null}
      </div>
      {!alert.acknowledgedAt ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => void handleAcknowledge()}
        >
          <CheckCircle2 className="size-4" />
          {loading ? "Acknowledging..." : "Acknowledge"}
        </Button>
      ) : null}
    </li>
  );
}

export function ConsultantPatientMonitoringPanel({
  patientId,
  limit = 10,
  standalone = false,
}: Readonly<{ patientId: string; limit?: number; standalone?: boolean }>) {
  const Heading = standalone ? "h1" : "h2";
  const [tab, setTab] = useUrlState("monitoringTab", "overview", [
    "overview",
    "readings",
    "alerts",
  ]);
  const [range, setRange] = useUrlState("monitoringRange", "month", [
    "week",
    "month",
    "3months",
  ]);
  const [alertFilter, setAlertFilter] = useState("open");
  const [editingThreshold, setEditingThreshold] = useState(false);
  const [addingReading, setAddingReading] = useState(false);
  const query = useQuery<{
    consultantPatientMonitoring: ConsultantPatientMonitoring;
  }>(CONSULTANT_PATIENT_MONITORING_QUERY, {
    variables: { patientId, range, limit },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const monitoring = query.data?.consultantPatientMonitoring;

  if (!monitoring)
    return (
      <section className="space-y-4">
        <Heading className="flex items-center gap-2 text-base font-semibold">
          <Activity className="size-4 text-primary" />
          Monitoring
        </Heading>
        {query.loading ? (
          <div aria-label="Loading monitoring data" className="space-y-3">
            {[0, 1, 2].map((row) => (
              <div key={row} className="h-20 animate-pulse bg-border/30" />
            ))}
          </div>
        ) : (
          <div className="space-y-3 border-y border-border py-8 text-center">
            <p role="alert" className="text-sm text-muted">
              Monitoring data is unavailable.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void query.refetch()}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        )}
      </section>
    );

  const {
    latestGlucose,
    trend,
    glucoseSummary,
    activeThreshold,
    recentReadings,
    alerts,
  } = monitoring;
  const stats = glucoseSummary?.stats;
  const buckets = glucoseSummary?.buckets ?? [];
  const hasPeriodData = (stats?.totalCount ?? 0) > 0;
  const unit = glucoseSummary?.unit ?? GLUCOSE_UNIT;
  const openAlerts = alerts.filter((alert) => !alert.acknowledgedAt);
  const visibleAlerts = alerts.filter(
    (alert) =>
      alertFilter === "all" ||
      (alertFilter === "open"
        ? !alert.acknowledgedAt
        : Boolean(alert.acknowledgedAt)),
  );
  const hasAnyData = Boolean(
    latestGlucose ||
      recentReadings.length ||
      activeThreshold ||
      alerts.length ||
      hasPeriodData,
  );
  const thresholdLow =
    activeThreshold?.glucoseLow != null
      ? Number(activeThreshold.glucoseLow)
      : null;
  const thresholdHigh =
    activeThreshold?.glucoseHigh != null
      ? Number(activeThreshold.glucoseHigh)
      : null;

  return (
    <section className="min-w-0 space-y-4" aria-busy={query.loading}>
      {/* ── Header ── */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 basis-48">
          <Heading
            className={`flex items-center gap-2 font-semibold text-ink ${standalone ? "text-xl" : "text-base"}`}
          >
            <Activity className="size-4 text-primary" />
            Glucose monitoring
          </Heading>
          <p className="mt-1 break-words text-xs text-muted">
            {monitoring.patient.fullName ??
              monitoring.patient.email ??
              "Patient"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            className="w-36"
            aria-label="Monitoring summary period"
            value={range}
            onChange={(event) => setRange(event.target.value)}
            options={[
              { value: "week", label: "Last 7 days" },
              { value: "month", label: "Last 30 days" },
              { value: "3months", label: "Last 90 days" },
            ]}
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setAddingReading(true)}
          >
            <Plus className="size-4" />
            Log reading
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Refresh monitoring"
            aria-label="Refresh monitoring"
            disabled={query.loading}
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </header>

      {query.error ? (
        <p role="alert" className="text-sm text-danger">
          Unable to refresh monitoring. Previously loaded data is shown.
        </p>
      ) : null}

      {/* ── Hero metrics (always visible) ── */}
      <dl className="grid gap-4 border border-border p-4 sm:grid-cols-3">
        <div className="min-w-0 space-y-1">
          <dt className="text-xs text-muted">Latest glucose</dt>
          <dd className="flex flex-wrap items-baseline gap-2 text-2xl font-semibold tabular-nums text-ink">
            {num(latestGlucose?.value)}
            <span className="text-xs font-normal text-muted">
              {latestGlucose?.unit ?? GLUCOSE_UNIT}
            </span>
            {latestGlucose?.flag ? (
              <Badge
                className="rounded-md tracking-normal"
                variant={tone(latestGlucose.flag)}
              >
                {titleCase(latestGlucose.flag)}
              </Badge>
            ) : null}
          </dd>
          <p className="text-xs text-muted">
            {latestGlucose
              ? formatDateTime(latestGlucose.recordedAt)
              : "No reading shared"}
          </p>
        </div>
        <Metric
          label="7-day average"
          value={num(trend?.average7Days)}
          unit={unit}
        />
        <Metric
          label="30-day average"
          value={num(trend?.average30Days)}
          unit={unit}
        />
      </dl>

      {/* ── Alert banner (always visible when there are open alerts) ── */}
      {openAlerts.length > 0 ? (
        <button
          type="button"
          className="flex w-full items-center gap-3 border border-warning/40 bg-warning/5 px-4 py-3 text-left text-sm text-warning transition-colors hover:bg-warning/10"
          onClick={() => {
            setTab("alerts");
            setAlertFilter("open");
          }}
        >
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1 font-medium">
            {openAlerts.length} unacknowledged{" "}
            {openAlerts.length === 1 ? "alert" : "alerts"}
          </span>
          <span className="text-xs text-warning/80">Review</span>
        </button>
      ) : null}

      {/* ── Tabs ── */}
      <WorkspaceTabs
        id="patient-glucose"
        label="Glucose monitoring"
        value={tab}
        onChange={setTab}
        tabs={[
          { key: "overview", label: "Overview" },
          { key: "readings", label: "Readings", count: recentReadings.length },
          { key: "alerts", label: "Alerts", count: openAlerts.length },
        ]}
      />

      {!hasAnyData ? (
        <p className="border-b border-border py-8 text-center text-sm text-muted">
          No monitoring data is available. Patient sharing preferences may
          restrict access.
        </p>
      ) : null}

      {/* ── Overview tab ── */}
      <div
        role="tabpanel"
        id="patient-glucose-panel-overview"
        aria-labelledby="patient-glucose-tab-overview"
        hidden={tab !== "overview"}
        className="space-y-5"
      >
        {/* Glucose trend chart */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">
              Glucose trend{" "}
              {unit ? (
                <span className="font-normal text-muted">({unit})</span>
              ) : null}
            </h3>
            <span className="text-xs tabular-nums text-muted">
              {stats?.totalCount ?? 0} readings in period
            </span>
          </div>
          <GlucoseTrendChart
            buckets={buckets}
            thresholdLow={thresholdLow}
            thresholdHigh={thresholdHigh}
          />
        </div>

        {/* Period stats */}
        <div className="space-y-3 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">Period summary</h3>
            <Badge
              className="rounded-md tracking-normal"
              variant={
                hasPeriodData
                  ? tone(glucoseSummary?.overallStatus)
                  : "secondary"
              }
            >
              {hasPeriodData
                ? titleCase(glucoseSummary?.overallStatus)
                : "No data"}
            </Badge>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Metric
              label="Average"
              value={hasPeriodData ? num(stats?.average) : "--"}
              unit={hasPeriodData ? unit : undefined}
            />
            <Metric
              label="Lowest"
              value={hasPeriodData ? num(stats?.lowest) : "--"}
              unit={hasPeriodData ? unit : undefined}
            />
            <Metric
              label="Highest"
              value={hasPeriodData ? num(stats?.highest) : "--"}
              unit={hasPeriodData ? unit : undefined}
            />
            <Metric
              label="In range"
              value={
                hasPeriodData && stats?.inRangePercent != null
                  ? `${num(stats.inRangePercent, 0)}%`
                  : "--"
              }
            />
          </dl>
        </div>

        {/* Threshold */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <h3 className="text-sm font-semibold text-ink">Alert threshold</h3>
            <p className="mt-1 text-sm tabular-nums text-muted">
              {activeThreshold
                ? `${num(activeThreshold.glucoseLow)} – ${num(activeThreshold.glucoseHigh)} ${unit ?? ""}`
                : "Not configured"}
            </p>
          </div>
          {hasAnyData ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEditingThreshold(true)}
            >
              <SlidersHorizontal className="size-4" />
              {activeThreshold ? "Edit threshold" : "Set threshold"}
            </Button>
          ) : null}
        </div>
      </div>

      {/* ── Readings tab ── */}
      <div
        role="tabpanel"
        id="patient-glucose-panel-readings"
        aria-labelledby="patient-glucose-tab-readings"
        hidden={tab !== "readings"}
      >
        {recentReadings.length ? (
          <div className="overflow-x-auto border border-border">
            <table className="w-full min-w-[560px] table-fixed text-left text-sm">
              <caption className="sr-only">Recent glucose readings</caption>
              <colgroup>
                <col />
                <col className="w-28" />
                <col className="w-24" />
                <col className="w-28" />
              </colgroup>
              <thead className="bg-background text-xs text-muted">
                <tr>
                  {["Recorded", "Glucose", "Unit", "Status"].map((label) => (
                    <th
                      key={label}
                      scope="col"
                      className="px-4 py-3 font-semibold"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentReadings.map((reading) => (
                  <tr
                    key={reading.id}
                    className="even:bg-background/30 hover:bg-primary/5"
                  >
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {formatDateTime(reading.recordedAt)}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">
                      {num(reading.value)}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted">
                      {reading.unit ?? GLUCOSE_UNIT}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge
                        className="rounded-md tracking-normal"
                        variant={tone(reading.flag)}
                      >
                        {titleCase(reading.flag)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            No recent readings shared.
          </p>
        )}
      </div>

      {/* ── Alerts tab ── */}
      <div
        role="tabpanel"
        id="patient-glucose-panel-alerts"
        aria-labelledby="patient-glucose-tab-alerts"
        hidden={tab !== "alerts"}
        className="space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted">
            {visibleAlerts.length}{" "}
            {visibleAlerts.length === 1 ? "alert" : "alerts"}
          </p>
          <Select
            aria-label="Filter monitoring alerts"
            className="w-48"
            value={alertFilter}
            onChange={(event) => setAlertFilter(event.target.value)}
            options={[
              { value: "open", label: "Unacknowledged" },
              { value: "all", label: "All alerts" },
              { value: "acknowledged", label: "Acknowledged" },
            ]}
          />
        </div>
        {visibleAlerts.length ? (
          <ul>
            {visibleAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                onAcknowledged={() => void query.refetch()}
              />
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            No alerts match this filter.
          </p>
        )}
      </div>

      {editingThreshold ? (
        <ThresholdModal
          patientId={patientId}
          threshold={activeThreshold}
          onClose={() => setEditingThreshold(false)}
          onSaved={() => void query.refetch()}
        />
      ) : null}

      {addingReading ? (
        <ManualGlucoseModal
          patientId={patientId}
          onClose={() => setAddingReading(false)}
          onSaved={() => void query.refetch()}
        />
      ) : null}
    </section>
  );
}
