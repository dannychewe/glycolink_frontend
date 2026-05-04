import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantPatientPrescription } from "@/types";

type PatientPrescriptionsSectionProps = Readonly<{
  prescriptions: ConsultantPatientPrescription[];
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function PatientPrescriptionsSection({
  prescriptions,
}: PatientPrescriptionsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Prescriptions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {prescriptions.map((prescription) => (
          <div
            key={`${prescription.medicationName}-${prescription.dateIssued}`}
            className="rounded-xl border border-border bg-background px-4 py-4"
          >
            <p className="text-sm font-semibold text-text">
              {prescription.medicationName}
            </p>
            <p className="mt-1 text-sm text-muted">{prescription.dosage}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-muted">
              Issued {formatDate(prescription.dateIssued)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
