import { Badge } from "@/components/ui/badge";
import type { ConsultantAppointmentStatus } from "@/types";

type ConsultantAppointmentStatusBadgeProps = Readonly<{
  status: ConsultantAppointmentStatus;
}>;

function getVariant(status: ConsultantAppointmentStatus) {
  if (status === "READY") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "primary";
  }

  if (status === "NO_SHOW") {
    return "danger";
  }

  return "secondary";
}

function getLabel(status: ConsultantAppointmentStatus) {
  if (status === "IN_PROGRESS") {
    return "In Progress";
  }

  if (status === "NO_SHOW") {
    return "No Show";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ConsultantAppointmentStatusBadge({
  status,
}: ConsultantAppointmentStatusBadgeProps) {
  return <Badge variant={getVariant(status)}>{getLabel(status)}</Badge>;
}
