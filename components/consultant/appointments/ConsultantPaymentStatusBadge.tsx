import { Badge } from "@/components/ui/badge";
import type { ConsultantPaymentStatus } from "@/types";

type ConsultantPaymentStatusBadgeProps = Readonly<{
  status: ConsultantPaymentStatus;
}>;

export function ConsultantPaymentStatusBadge({
  status,
}: ConsultantPaymentStatusBadgeProps) {
  return (
    <Badge variant={status === "PAID" ? "success" : "warning"}>
      {status === "PAID" ? "Paid" : "Awaiting Payment"}
    </Badge>
  );
}
