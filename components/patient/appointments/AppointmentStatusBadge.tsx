import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus } from "@/types";

type AppointmentStatusBadgeProps = Readonly<{
  status: AppointmentStatus;
}>;

function getAppointmentStatusVariant(status: AppointmentStatus) {
  if (status === "PENDING") {
    return "warning";
  }

  if (status === "REQUESTED") {
    return "secondary";
  }

  if (status === "CONFIRMED") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "primary";
  }

  if (status === "CHECKED_IN") {
    return "primary";
  }

  if (status === "AWAITING_PAYMENT") {
    return "warning";
  }

  if (status === "CANCELLED") {
    return "danger";
  }

  if (status === "COMPLETED" || status === "NO_SHOW" || status === "RESCHEDULED") {
    return "secondary";
  }

  return "primary";
}

function formatAppointmentStatus(status: AppointmentStatus) {
  if (status === "AWAITING_PAYMENT") {
    return "Awaiting Payment";
  }

  if (status === "IN_PROGRESS") {
    return "In Progress";
  }

  if (status === "CHECKED_IN") {
    return "Checked In";
  }

  if (status === "NO_SHOW") {
    return "No Show";
  }

  if (status === "RESCHEDULED") {
    return "Rescheduled";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function AppointmentStatusBadge({
  status,
}: AppointmentStatusBadgeProps) {
  return <Badge variant={getAppointmentStatusVariant(status)}>{formatAppointmentStatus(status)}</Badge>;
}
