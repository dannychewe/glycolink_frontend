import { Badge } from "@/components/ui/badge";
import type { ConsultantLabReview } from "@/types";

type ConsultantLabStatusBadgeProps = Readonly<{
  status: ConsultantLabReview["status"];
}>;

export function ConsultantLabStatusBadge({
  status,
}: ConsultantLabStatusBadgeProps) {
  return (
    <Badge variant={status === "REVIEWED" ? "success" : "primary"}>
      {status === "REVIEWED" ? "Reviewed" : "Result Ready"}
    </Badge>
  );
}
