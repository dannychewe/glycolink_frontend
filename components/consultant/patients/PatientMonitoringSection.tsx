import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GlucoseReading } from "@/types";

type PatientMonitoringSectionProps = Readonly<{
  readings: GlucoseReading[];
}>;

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getReadingState(value: number) {
  if (value < 70) {
    return { label: "Low", variant: "danger" as const };
  }

  if (value > 180) {
    return { label: "High", variant: "warning" as const };
  }

  return { label: "Normal", variant: "success" as const };
}

export function PatientMonitoringSection({
  readings,
}: PatientMonitoringSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Monitoring</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {readings.map((reading) => {
          const state = getReadingState(reading.value);

          return (
            <div
              key={reading.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text">
                  {reading.value} {reading.unit}
                </p>
                <p className="text-sm text-muted">{formatTimestamp(reading.timestamp)}</p>
              </div>
              <Badge variant={state.variant}>{state.label}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
