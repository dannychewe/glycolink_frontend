import { Badge } from "@/components/ui/badge";
import { getPaymentStatusVariant } from "@/lib/patient/mock-payments";
import type { PaymentStatus } from "@/types";

type PaymentStatusBadgeProps = Readonly<{
  status: PaymentStatus;
}>;

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return <Badge variant={getPaymentStatusVariant(status)}>{status}</Badge>;
}
