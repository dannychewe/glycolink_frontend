import { Badge } from "@/components/ui/badge";
import type { PrescriptionStatus } from "@/types";

type ConsultantPrescriptionStatusBadgeProps = Readonly<{
  status: PrescriptionStatus;
}>;

function getVariant(status: PrescriptionStatus) {
  if (status === "ACTIVE") {
    return "success";
  }

  if (status === "REVOKED") {
    return "danger";
  }

  return "secondary";
}

function getLabel(status: PrescriptionStatus) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function ConsultantPrescriptionStatusBadge({
  status,
}: ConsultantPrescriptionStatusBadgeProps) {
  return <Badge variant={getVariant(status)}>{getLabel(status)}</Badge>;
}
