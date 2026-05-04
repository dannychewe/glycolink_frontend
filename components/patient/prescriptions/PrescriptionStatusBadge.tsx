import { Badge } from "@/components/ui/badge";
import type { PrescriptionStatus } from "@/types";

type PrescriptionStatusBadgeProps = Readonly<{
  status: PrescriptionStatus;
}>;

function getStatusVariant(status: PrescriptionStatus) {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "REVOKED") {
    return "danger";
  }

  return "secondary";
}

export function PrescriptionStatusBadge({
  status,
}: PrescriptionStatusBadgeProps) {
  return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
}
