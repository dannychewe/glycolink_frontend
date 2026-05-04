import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantPatientLab } from "@/types";

type PatientLabsSectionProps = Readonly<{
  labs: ConsultantPatientLab[];
}>;

function getLabBadgeVariant(status: ConsultantPatientLab["status"]) {
  if (status === "REVIEWED") {
    return "success";
  }

  if (status === "RESULT_READY") {
    return "primary";
  }

  if (status === "SAMPLE_COLLECTED") {
    return "warning";
  }

  return "secondary";
}

function getLabBadgeLabel(status: ConsultantPatientLab["status"]) {
  if (status === "RESULT_READY") {
    return "Result Ready";
  }

  if (status === "SAMPLE_COLLECTED") {
    return "Sample Collected";
  }

  return status.charAt(0) + status.slice(1).toLowerCase();
}

export function PatientLabsSection({ labs }: PatientLabsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Labs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {labs.map((lab) => (
          <div
            key={`${lab.testName}-${lab.status}`}
            className="rounded-xl border border-border bg-background px-4 py-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text">{lab.testName}</p>
                <p className="text-sm leading-6 text-muted">{lab.resultSummary}</p>
              </div>
              <Badge variant={getLabBadgeVariant(lab.status)}>
                {getLabBadgeLabel(lab.status)}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
