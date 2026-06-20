"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { MY_READINGS_QUERY } from "@/lib/monitoring/graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Reading = {
  id: string;
  readingType: string;
  vitalType: string | null;
  value: string;
  unit: string | null;
  flag: string | null;
  recordedAt: string;
};

type ReadingsData = {
  myReadings: Reading[];
};

const typeFilters = [
  { value: "", label: "All" },
  { value: "glucose", label: "Glucose" },
  { value: "vitals", label: "Vitals" },
];

function formatRecordedAt(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatVitalType(vt: string | null) {
  if (!vt) return null;
  return vt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function GraphqlReadingsList() {
  const [readingType, setReadingType] = useState("");

  const { data, loading, error, refetch } = useQuery<ReadingsData>(MY_READINGS_QUERY, {
    variables: { readingType: readingType || undefined },
    fetchPolicy: "network-only",
  });

  const readings = data?.myReadings ?? [];

  return (
    <div className="space-y-4">
      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(({ value, label }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={readingType === value ? "primary" : "secondary"}
            onClick={() => setReadingType(value)}
          >
            {label}
          </Button>
        ))}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => refetch()}
          className="ml-auto"
        >
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load readings right now.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && readings.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-6 py-10 text-center">
          <p className="text-base font-medium text-text">No readings found</p>
          <p className="mt-1 text-sm text-muted">Use the Log Reading tab to record your first entry.</p>
        </div>
      ) : null}

      {!loading ? (
        <div className="space-y-2">
          {readings.map((reading) => {
            const isGlucose = reading.readingType.toUpperCase() === "GLUCOSE";
            const flag = reading.flag?.toLowerCase() ?? null;

            return (
              <div
                key={reading.id}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border-l-4 bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
                  isGlucose && flag === "low" ? "border-l-danger/50" :
                  isGlucose && flag === "high" ? "border-l-warning/60" :
                  isGlucose ? "border-l-success/50" :
                  "border-l-primary/40",
                )}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-text">
                      {Number(reading.value).toFixed(isGlucose ? 1 : 0)}
                      {reading.unit ? <span className="ml-1 text-sm font-normal text-muted">{reading.unit}</span> : null}
                    </p>
                    {!isGlucose && reading.vitalType ? (
                      <span className="text-xs text-muted">· {formatVitalType(reading.vitalType)}</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted">{formatRecordedAt(reading.recordedAt)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={isGlucose ? "primary" : "secondary"}>
                    {isGlucose ? "Glucose" : "Vital"}
                  </Badge>
                  {isGlucose && flag === "low" ? (
                    <Badge variant="danger">Low</Badge>
                  ) : isGlucose && flag === "high" ? (
                    <Badge variant="warning">High</Badge>
                  ) : isGlucose ? (
                    <Badge variant="success">Normal</Badge>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
