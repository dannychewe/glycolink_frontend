"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Activity, TrendingUp } from "lucide-react";
import { GlucoseAlertBadge } from "@/components/patient/monitoring/GlucoseAlertBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils/cn";
import type { GlucoseReading } from "@/types";

type MonitoringPageViewProps = Readonly<{
  initialReadings: GlucoseReading[];
}>;

type ReadingFormValues = {
  value: number;
  timestamp: string;
};

function getCurrentDateTimeInputValue() {
  const now = new Date();
  const timezoneOffset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function formatTimestamp(timestamp: string) {
  const parsedDate = new Date(timestamp);
  if (Number.isNaN(parsedDate.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
}

export function MonitoringPageView({ initialReadings }: MonitoringPageViewProps) {
  const [readings, setReadings] = useState<GlucoseReading[]>(initialReadings);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReadingFormValues>({
    defaultValues: {
      value: 110,
      timestamp: getCurrentDateTimeInputValue(),
    },
  });

  const onSubmit = handleSubmit((values) => {
    const nextReading: GlucoseReading = {
      id: `reading-${Date.now().toString(36)}`,
      value: Number(values.value),
      unit: "mg/dL",
      timestamp: values.timestamp,
    };

    setReadings((currentReadings) =>
      [nextReading, ...currentReadings].sort(
        (left, right) =>
          new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
      ),
    );

    reset({ value: 110, timestamp: getCurrentDateTimeInputValue() });
  });

  const values = readings.map((r) => r.value);
  const avg = values.length
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : 0;
  const highest = values.length ? Math.max(...values) : 0;
  const inRange = values.filter((v) => v >= 70 && v <= 180).length;
  const inRangePercent = values.length ? Math.round((inRange / values.length) * 100) : 0;
  const chartReadings = [...readings.slice(0, 8)].reverse();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitoring"
        title="Glucose Monitoring"
        description="Log your readings and track how your glucose trends against your target range."
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border bg-border">
        <div className="bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Avg glucose</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">{avg || "—"}</p>
          <p className="text-xs text-muted">mg/dL</p>
        </div>
        <div className="bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">Highest</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-ink">{highest || "—"}</p>
          <p className="text-xs text-muted">mg/dL</p>
        </div>
        <div className="bg-surface px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted">In range</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums text-secondary">{inRangePercent}%</p>
          <p className="text-xs text-muted">
            {inRange} of {values.length} readings
          </p>
        </div>
      </div>

      {/* Trend chart */}
      {chartReadings.length > 0 ? (
        <div className="rounded-lg border border-ink/20 bg-ink p-5 text-white sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Activity className="size-4" />
              Glucose trend
            </div>
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/90 ring-1 ring-inset ring-white/15">
              <TrendingUp className="size-3" />
              {inRangePercent}% in range
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-1.5">
            <p className="text-3xl font-semibold tabular-nums">{avg}</p>
            <p className="text-sm text-white/70">avg mg/dL</p>
          </div>

          <div className="mt-5 flex items-end gap-2">
            {chartReadings.map((reading) => (
              <div key={reading.id} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "w-full rounded-sm",
                    reading.value < 70
                      ? "bg-danger/70"
                      : reading.value > 180
                        ? "bg-warning/80"
                        : "bg-white/35",
                  )}
                  style={{ height: `${Math.max(6, Math.round((reading.value / 220) * 56))}px` }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-4 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-danger/70" />
              Low (&lt;70)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-white/35" />
              In range
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-sm bg-warning/80" />
              High (&gt;180)
            </span>
          </div>
        </div>
      ) : null}

      {/* Log form */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold text-text">Log New Reading</h2>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="value">Glucose Value</Label>
              <Input
                id="value"
                type="number"
                min="1"
                step="1"
                {...register("value", {
                  valueAsNumber: true,
                  required: "Glucose value is required.",
                  min: { value: 1, message: "Glucose value must be greater than 0." },
                })}
              />
              {errors.value?.message ? (
                <p className="text-sm text-danger">{errors.value.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="timestamp">Date and Time</Label>
              <Input
                id="timestamp"
                type="datetime-local"
                {...register("timestamp", { required: "Date and time are required." })}
              />
              {errors.timestamp?.message ? (
                <p className="text-sm text-danger">{errors.timestamp.message}</p>
              ) : null}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Add Reading</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Readings list */}
      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold text-text">All Readings</h2>
        </CardHeader>
        <CardContent className="space-y-2">
          {readings.map((reading) => {
            const isLow = reading.value < 70;
            const isHigh = reading.value > 180;
            return (
              <div
                key={reading.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border-l-4 bg-background px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                  isLow
                    ? "border-l-danger/50"
                    : isHigh
                      ? "border-l-warning/60"
                      : "border-l-success/50",
                )}
              >
                <div className="space-y-0.5">
                  <p className="text-base font-semibold text-text">
                    {reading.value}{" "}
                    <span className="text-sm font-normal text-muted">{reading.unit}</span>
                  </p>
                  <p className="text-sm text-muted">{formatTimestamp(reading.timestamp)}</p>
                </div>
                <GlucoseAlertBadge value={reading.value} />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
