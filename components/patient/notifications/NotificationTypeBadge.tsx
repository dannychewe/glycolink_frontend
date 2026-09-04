import { Badge } from "@/components/ui/badge";
import { titleCase } from "@/lib/utils/format";
import type { NotificationType } from "@/types";

type NotificationTypeBadgeProps = Readonly<{
  type: NotificationType;
}>;

type Variant = "primary" | "success" | "warning" | "danger" | "secondary";

// Every notification `type` string the backend actually creates today (see
// create_notification / _notify call sites across programmes, communications,
// payments, providers, monitoring), mapped to a plain label — never show the
// raw backend constant. Unknown/future types fall back to a humanized version
// of the string rather than the literal constant.
const NOTIFICATION_TYPES: Record<string, { label: string; variant: Variant }> = {
  APPOINTMENT: { label: "Appointment", variant: "primary" },
  PAYMENT: { label: "Payment", variant: "warning" },
  LAB: { label: "Lab", variant: "success" },
  SYSTEM: { label: "System", variant: "secondary" },
  MESSAGE: { label: "Message", variant: "primary" },
  CARE_JOURNEY_STAGE_REACHED: { label: "Care journey", variant: "success" },
  PROGRAMME_BASELINE_APPROVED: { label: "Baseline approved", variant: "success" },
  PROGRAMME_BASELINE_RETURNED: { label: "Baseline returned", variant: "warning" },
  PROGRAMME_CARE_PLAN_ACTIVATED: { label: "Care plan activated", variant: "success" },
  PROGRAMME_MONITORING_REQUIREMENTS_CHANGED: { label: "Monitoring updated", variant: "primary" },
  PROGRAMME_ENROLLED: { label: "Programme enrolled", variant: "success" },
  PROGRAMME_CARE_TEAM_ASSIGNED: { label: "Care team assigned", variant: "primary" },
  PROGRAMME_ENROLMENT_ACTIVATED: { label: "Programme activated", variant: "success" },
  PROGRAMME_ENROLMENT_PAUSED: { label: "Programme paused", variant: "warning" },
  PROGRAMME_ENROLMENT_COMPLETED: { label: "Programme completed", variant: "secondary" },
  PROGRAMME_ENROLMENT_WITHDRAWN: { label: "Programme withdrawn", variant: "secondary" },
  PROVIDER_UNAVAILABLE: { label: "Appointment cancelled", variant: "danger" },
  MONITORING_ALERT: { label: "Monitoring alert", variant: "danger" },
};

export function NotificationTypeBadge({ type }: NotificationTypeBadgeProps) {
  const normalized = type.trim().toUpperCase();
  const known = NOTIFICATION_TYPES[normalized];
  return (
    <Badge variant={known?.variant ?? "primary"}>{known?.label ?? titleCase(type)}</Badge>
  );
}
