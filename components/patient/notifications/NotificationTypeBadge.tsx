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

  return "primary";
}

export function NotificationTypeBadge({
  type,
}: NotificationTypeBadgeProps) {
  return <Badge variant={getNotificationTypeVariant(type)}>{type}</Badge>;
}
