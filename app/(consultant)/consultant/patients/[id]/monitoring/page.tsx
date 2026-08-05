import { ConsultantPatientMonitoringPanel } from "@/components/consultant/monitoring/ConsultantPatientMonitoringPanel";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

type ConsultantPatientMonitoringPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ConsultantPatientMonitoringPage({
  params,
}: ConsultantPatientMonitoringPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient workspace"
        title="Glucose readings"
        description="Review this patient's glucose log, trend, thresholds, and monitoring alerts."
        breadcrumbs={[
          { label: "Patients", href: "/consultant/patients" },
          { label: "Patient", href: `/consultant/patients/${id}` },
          { label: "Monitoring" },
        ]}
      />
      <ConsultantPatientMonitoringPanel patientId={id} limit={50} />
    </Container>
  );
}
