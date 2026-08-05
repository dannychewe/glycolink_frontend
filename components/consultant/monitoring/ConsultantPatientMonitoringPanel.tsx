"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Activity, AlertTriangle, CheckCircle2, Gauge, LineChart, Sliders } from "lucide-react";
import {
  ACKNOWLEDGE_ALERT_MUTATION,
  CONSULTANT_PATIENT_MONITORING_QUERY,
  SET_THRESHOLD_MUTATION,
  type ConsultantPatientMonitoring,
} from "@/lib/monitoring/graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

// ─── Helpers ──────────────────────────────────────────────

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function titleCase(value: string | null | undefined) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function num(value: number | null | undefined, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(digits);
}

function flagVariant(flag: string | null | undefined): "success" | "warning" | "danger" | "secondary" {
  const f = (flag ?? "").toLowerCase();
  if (f.includes("critical") || f.includes("high")) return "danger";
  if (f.includes("low") || f.includes("abnormal")) return "warning";
  if (f.includes("normal")) return "success";
  return "secondary";
}

function statusVariant(status: string | null | undefined): "success" | "warning" | "danger" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (s.includes("critical") || s.includes("high")) return "danger";
  if (s.includes("low") || s.includes("elevated") || s.includes("warning")) return "warning";
  if (s.includes("in_range") || s.includes("normal") || s.includes("good")) return "success";
  return "secondary";
}

function bucketBarColor(status: string | null | undefined) {
  const v = statusVariant(status);
  if (v === "danger") return "bg-danger";
  if (v === "warning") return "bg-warning";
  if (v === "success") return "bg-success";
  return "bg-primary/60";
}

// ─── Stat tile ────────────────────────────────────────────

function StatTile({ label, value, unit }: { label: string; value: string; unit?: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text">
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}

// ─── Inline threshold editor ──────────────────────────────

function ThresholdEditor({
  patientId,
  threshold,
  onSaved,
}: {
  patientId: string;
  threshold: ConsultantPatientMonitoring["activeThreshold"];
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [low, setLow] = useState(() => (threshold?.glucoseLow ?? 3.9).toString());
  const [high, setHigh] = useState(() => (threshold?.glucoseHigh ?? 10.0).toString());
  const [setThreshold, { loading, error }] = useMutation(SET_THRESHOLD_MUTATION);

  // Keep inputs in sync if the active threshold changes underneath us.
  useEffect(() => {
    setLow((threshold?.glucoseLow ?? 3.9).toString());
    setHigh((threshold?.glucoseHigh ?? 10.0).toString());
  }, [threshold?.glucoseLow, threshold?.glucoseHigh]);

  const lowNum = Number(low);
  const highNum = Number(high);
  const invalid = Number.isNaN(lowNum) || Number.isNaN(highNum) || lowNum < 0.5 || highNum <= lowNum;

  async function save() {
    if (invalid) return;
    await setThreshold({
      variables: { patientId, data: { glucoseLow: lowNum, glucoseHigh: highNum } },
    });
    setOpen(false);
    onSaved();
  }

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-text">
          <Sliders className="size-4 text-primary" />
          {threshold ? (
            <span>
              Active threshold: <span className="font-semibold">{num(threshold.glucoseLow)}</span> –{" "}
              <span className="font-semibold">{num(threshold.glucoseHigh)}</span> mmol/L
              {threshold.active === false ? <Badge variant="secondary" className="ml-2">Inactive</Badge> : null}
            </span>
          ) : (
            <span className="text-warning">No active glucose threshold set.</span>
          )}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Cancel" : threshold ? "Edit" : "Set threshold"}
        </Button>
      </div>

      {open ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="threshold-low">Low (mmol/L)</Label>
              <Input
                id="threshold-low"
                type="number"
                step="0.1"
                min="0.5"
                value={low}
                onChange={(e) => setLow(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold-high">High (mmol/L)</Label>
              <Input
                id="threshold-high"
                type="number"
                step="0.1"
                min="0.5"
                value={high}
                onChange={(e) => setHigh(e.target.value)}
              />
            </div>
          </div>
          {invalid ? (
            <p className="text-xs text-danger">Low must be ≥ 0.5 and below the high threshold.</p>
          ) : null}
          {error ? <p className="text-xs text-danger">Couldn&apos;t save threshold. Please try again.</p> : null}
          <Button type="button" size="sm" disabled={loading || invalid} onClick={save}>
            {loading ? "Saving…" : "Save threshold"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// ─── Alert row ────────────────────────────────────────────

function AlertRow({
  alert,
  onAcknowledged,
}: {
  alert: ConsultantPatientMonitoring["alerts"][number];
  onAcknowledged: () => void;
}) {
  const [acknowledge, { loading }] = useMutation(ACKNOWLEDGE_ALERT_MUTATION, {
    variables: { alertId: alert.id },
    onCompleted: onAcknowledged,
  });
  const acked = !!alert.acknowledgedAt;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border-l-4 bg-background px-4 py-3 sm:flex-row sm:items-start sm:justify-between",
        acked ? "border-l-border opacity-60" : "border-l-danger/60",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <AlertTriangle className={cn("size-4", acked ? "text-muted" : "text-danger")} />
          <Badge variant={flagVariant(alert.severity)}>{titleCase(alert.severity)}</Badge>
          {acked ? <Badge variant="secondary">Acknowledged</Badge> : null}
        </div>
        <p className="text-sm text-text">{alert.message ?? "Monitoring alert"}</p>
        <p className="text-xs text-muted">{formatDateTime(alert.createdAt)}</p>
      </div>
      {!acked ? (
        <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={() => acknowledge()} className="shrink-0">
          {loading ? "Acknowledging…" : "Acknowledge"}
        </Button>
      ) : null}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────

export function ConsultantPatientMonitoringPanel({
  patientId,
  limit = 10,
}: Readonly<{ patientId: string; limit?: number }>) {
  const { data, loading, error, refetch } = useQuery<{ consultantPatientMonitoring: ConsultantPatientMonitoring }>(
    CONSULTANT_PATIENT_MONITORING_QUERY,
    { variables: { patientId, range: "30d", limit }, fetchPolicy: "cache-and-network" },
  );

  const monitoring = data?.consultantPatientMonitoring;

  if (loading && !monitoring) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" /> Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-20 animate-pulse rounded-xl bg-border/40" />
          <div className="h-24 animate-pulse rounded-xl bg-border/40" />
        </CardContent>
      </Card>
    );
  }

  if (error || !monitoring) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-5 text-primary" /> Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-center text-sm text-muted">
            Monitoring data is unavailable right now.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { latestGlucose, trend, glucoseSummary, activeThreshold, recentReadings, alerts } = monitoring;
  const stats = glucoseSummary?.stats;
  const buckets = glucoseSummary?.buckets ?? [];
  const maxBucket = buckets.reduce((m, b) => Math.max(m, b.average ?? 0), 0) || 1;
  const unacked = alerts.filter((a) => !a.acknowledgedAt);

  // Privacy preferences can suppress the whole payload: empty readings, no
  // threshold, no alerts, and a zero-count summary.
  const suppressed =
    !latestGlucose &&
    recentReadings.length === 0 &&
    !activeThreshold &&
    alerts.length === 0 &&
    (stats == null || (stats.average == null && glucoseSummary?.overallStatus == null));

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Activity className="size-5 text-primary" /> Monitoring
          </span>
          {unacked.length > 0 ? <Badge variant="danger">{unacked.length} active</Badge> : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {suppressed ? (
          <p className="rounded-xl border border-dashed border-border bg-background px-4 py-5 text-center text-sm text-muted">
            This patient hasn&apos;t shared their monitoring data, or device sharing is disabled.
          </p>
        ) : (
          <>
            {/* Latest + trend */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-background px-4 py-3 sm:col-span-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Latest glucose</p>
                {latestGlucose ? (
                  <>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-lg font-semibold text-text">
                      {num(latestGlucose.value)} {latestGlucose.unit ?? "mmol/L"}
                      {latestGlucose.flag ? <Badge variant={flagVariant(latestGlucose.flag)}>{titleCase(latestGlucose.flag)}</Badge> : null}
                    </p>
                    <p className="text-xs text-muted">{formatDateTime(latestGlucose.recordedAt)}</p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted">No readings yet.</p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-background px-4 py-3 sm:col-span-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  <LineChart className="size-3.5" /> Trend
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-sm font-semibold text-text">{num(trend?.average7Days)}</p>
                    <p className="text-[11px] text-muted">7-day avg</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{num(trend?.average30Days)}</p>
                    <p className="text-[11px] text-muted">30-day avg</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text">{num(trend?.latestValue)}</p>
                    <p className="text-[11px] text-muted">Latest</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary stats */}
            {glucoseSummary ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Gauge className="size-4 text-primary" />
                  <p className="text-sm font-medium text-text">
                    {titleCase(glucoseSummary.overallStatus) || "Summary"}
                  </p>
                  {glucoseSummary.range ? <Badge variant="secondary">{glucoseSummary.range}</Badge> : null}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <StatTile label="Average" value={num(stats?.average)} unit="mmol/L" />
                  <StatTile label="Highest" value={num(stats?.highest)} unit="mmol/L" />
                  <StatTile label="Lowest" value={num(stats?.lowest)} unit="mmol/L" />
                  <StatTile label="In range" value={stats?.inRangePercent != null ? `${num(stats.inRangePercent, 0)}%` : "—"} />
                </div>

                {/* Buckets */}
                {buckets.length > 0 ? (
                  <div className="space-y-2">
                    {buckets.map((b) => (
                      <div key={b.label} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 truncate text-xs text-muted">{b.label}</span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-border/50">
                          <div
                            className={cn("h-full rounded-full", bucketBarColor(b.status))}
                            style={{ width: `${Math.max(4, Math.round(((b.average ?? 0) / maxBucket) * 100))}%` }}
                          />
                        </div>
                        <span className="w-24 shrink-0 text-right text-xs text-muted">
                          {num(b.average)} · {b.readingCount}×
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Threshold */}
            <ThresholdEditor patientId={patientId} threshold={activeThreshold} onSaved={() => void refetch()} />

            {/* Recent readings */}
            {recentReadings.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Recent readings</p>
                <div className="space-y-1.5">
                  {recentReadings.map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-text">
                        <span className="font-semibold">{num(r.value)}</span>
                        <span className="text-muted">{r.unit ?? "mmol/L"}</span>
                        {r.flag ? <Badge variant={flagVariant(r.flag)}>{titleCase(r.flag)}</Badge> : null}
                      </span>
                      <span className="text-xs text-muted">{formatDateTime(r.recordedAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Alerts */}
            {alerts.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Alerts</p>
                <div className="space-y-2">
                  {alerts.map((a) => (
                    <AlertRow key={a.id} alert={a} onAcknowledged={() => void refetch()} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted">
                <CheckCircle2 className="size-4 text-success" /> No monitoring alerts.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
