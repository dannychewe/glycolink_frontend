import { Badge } from "@/components/ui/badge";
import type { AppointmentPaymentStatus } from "@/types";

type AppointmentPaymentBadgeProps = Readonly<{
  status: AppointmentPaymentStatus;
}>;

export function AppointmentPaymentBadge({
  status,
}: AppointmentPaymentBadgeProps) {
  return (
    <Badge variant={status === "PAID" ? "success" : "warning"}>
      {status === "PAID" ? "Paid" : "Awaiting Payment"}
    </Badge>
  );
}
