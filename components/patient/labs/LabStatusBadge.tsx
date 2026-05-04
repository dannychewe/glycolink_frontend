import { Badge } from "@/components/ui/badge";
import type { LabOrderStatus } from "@/types";

type LabStatusBadgeProps = Readonly<{
  status: LabOrderStatus;
}>;

function getStatusVariant(status: LabOrderStatus) {
  if (status === "REVIEWED") {
    return "success";
  }

  if (status === "SAMPLE_COLLECTED") {
    return "warning";
  }

  if (status === "RESULT_READY") {
    return "primary";
  }

  return "secondary";
}

export function LabStatusBadge({ status }: LabStatusBadgeProps) {
  return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
}
