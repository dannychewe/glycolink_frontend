import { Badge } from "@/components/ui/badge";
import type { ConsultantPcqStatus } from "@/types";

type ConsultantPcqStatusBadgeProps = Readonly<{
  status: ConsultantPcqStatus;
}>;

function getVariant(status: ConsultantPcqStatus) {
  if (status === "SUBMITTED") {
    return "success";
  }

  if (status === "IN_PROGRESS") {
    return "warning";
  }

  return "secondary";
}

function getLabel(status: ConsultantPcqStatus) {
  if (status === "NOT_STARTED") {
    return "PCQ Not Started";
  }

  if (status === "IN_PROGRESS") {
    return "PCQ In Progress";
  }

  return "PCQ Submitted";
}

export function ConsultantPcqStatusBadge({
  status,
}: ConsultantPcqStatusBadgeProps) {
  return <Badge variant={getVariant(status)}>{getLabel(status)}</Badge>;
}
