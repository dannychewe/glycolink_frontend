import { Badge } from "@/components/ui/badge";
import type { NotificationType } from "@/types";

type NotificationTypeBadgeProps = Readonly<{
  type: NotificationType;
}>;

function getNotificationTypeVariant(type: NotificationType) {
  if (type === "PAYMENT") {
    return "warning";
  }

  if (type === "LAB") {
    return "success";
  }

  if (type === "SYSTEM") {
    return "secondary";
  }

  if (type === "CARE_JOURNEY_STAGE_REACHED") {
    return "success";
  }

  return "primary";
}

const notificationTypeLabels: Partial<Record<NotificationType, string>> = {
  CARE_JOURNEY_STAGE_REACHED: "Care journey",
};

export function NotificationTypeBadge({
  type,
}: NotificationTypeBadgeProps) {
  return <Badge variant={getNotificationTypeVariant(type)}>{notificationTypeLabels[type] ?? type}</Badge>;
}
