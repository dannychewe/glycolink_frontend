import { Badge } from "@/components/ui/badge";
import type { ConsultantLabReview } from "@/types";

type ConsultantLabInterpretationBadgeProps = Readonly<{
  interpretation: ConsultantLabReview["interpretation"];
}>;

function getVariant(interpretation: ConsultantLabReview["interpretation"]) {
  if (interpretation === "NORMAL") {
    return "success";
  }

  if (interpretation === "HIGH") {
    return "warning";
  }

  return "danger";
}

function getLabel(interpretation: ConsultantLabReview["interpretation"]) {
  if (interpretation === "NORMAL") {
    return "Normal";
  }

  if (interpretation === "HIGH") {
    return "High";
  }

  return "Critical";
}

export function ConsultantLabInterpretationBadge({
  interpretation,
}: ConsultantLabInterpretationBadgeProps) {
  return <Badge variant={getVariant(interpretation)}>{getLabel(interpretation)}</Badge>;
}
