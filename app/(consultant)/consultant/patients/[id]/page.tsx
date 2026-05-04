import { notFound } from "next/navigation";
import { PatientLabsSection } from "@/components/consultant/patients/PatientLabsSection";
import { PatientMonitoringSection } from "@/components/consultant/patients/PatientMonitoringSection";
import { PatientPcqSection } from "@/components/consultant/patients/PatientPcqSection";
import { PatientPrescriptionsSection } from "@/components/consultant/patients/PatientPrescriptionsSection";
import { PatientSummarySection } from "@/components/consultant/patients/PatientSummarySection";
import { Button } from "@/components/ui/button";
import { getMockConsultantPatientById } from "@/lib/consultant/mock-patients";

type ConsultantPatientPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ConsultantPatientPage({
  params,
}: ConsultantPatientPageProps) {
  const { id } = await params;
  const patient = getMockConsultantPatientById(id);

  if (!patient) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 rounded-xl border border-border bg-surface px-6 py-6 shadow-subtle lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Patient Context
          </p>
          <h1 className="text-3xl font-semibold text-text">{patient.name}</h1>
          <p className="text-sm text-muted">
            {patient.age} years old • {patient.gender}
          </p>
        </div>

        <Button href="/" className="lg:w-auto" fullWidth>
          Start Consultation
        </Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <PatientSummarySection patient={patient} />
          <PatientPcqSection items={patient.pcq} />
        </div>

        <div className="space-y-6">
          <PatientPrescriptionsSection prescriptions={patient.prescriptions} />
          <PatientLabsSection labs={patient.labs} />
          <PatientMonitoringSection readings={patient.monitoring} />
        </div>
      </div>
    </div>
  );
}
