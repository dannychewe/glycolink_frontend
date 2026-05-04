import { Badge } from "@/components/ui/badge";
import { getGlucoseAlertLevel } from "@/lib/patient/mock-monitoring-data";

type GlucoseAlertBadgeProps = Readonly<{
  value: number;
}>;

function getVariant(value: number) {
  const level = getGlucoseAlertLevel(value);

  if (level === "Low") {
    return "danger";
  }

  if (level === "High") {
    return "warning";
  }

  return "success";
}

export function GlucoseAlertBadge({ value }: GlucoseAlertBadgeProps) {
  return <Badge variant={getVariant(value)}>{getGlucoseAlertLevel(value)}</Badge>;
}
