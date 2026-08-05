import { SetThresholdForm } from "@/components/consultant/monitoring/SetThresholdForm";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringThresholdsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient monitoring"
        title="Glucose thresholds"
        description="Set patient-specific glucose ranges used for monitoring alerts."
        breadcrumbs={[
          { label: "Monitoring", href: "/consultant/monitoring" },
          { label: "Thresholds" },
        ]}
      />
      <SetThresholdForm />
    </Container>
  );
}
