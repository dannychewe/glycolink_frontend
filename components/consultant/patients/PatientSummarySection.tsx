import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantPatientContext } from "@/types";

type PatientSummarySectionProps = Readonly<{
  patient: ConsultantPatientContext;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function PatientSummarySection({
  patient,
}: PatientSummarySectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Patient Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Diabetes Type
          </p>
          <p className="text-sm text-text">{patient.diabetesType}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Diagnosis Date
          </p>
          <p className="text-sm text-text">{formatDate(patient.diagnosisDate)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Allergies
          </p>
          <p className="text-sm leading-6 text-text">{patient.allergies}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Medications
          </p>
          <p className="text-sm leading-6 text-text">{patient.medications}</p>
        </div>
      </CardContent>
    </Card>
  );
}
