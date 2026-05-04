import { Badge } from "@/components/ui/badge";

type ConsultantNotificationTypeBadgeProps = Readonly<{
  type: string;
}>;

function getVariant(type: string): "success" | "danger" | "secondary" | "primary" | "warning" {
  const t = type.toUpperCase();
  if (t === "LAB") return "success";
  if (t === "ALERT") return "danger";
  if (t === "SYSTEM") return "secondary";
  if (t === "APPOINTMENT") return "primary";
  return "secondary";
}

export function ConsultantNotificationTypeBadge({
  type,
}: ConsultantNotificationTypeBadgeProps) {
  return <Badge variant={getVariant(type)}>{type}</Badge>;
}
