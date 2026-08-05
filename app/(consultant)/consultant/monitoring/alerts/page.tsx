import { ProviderPatientAlertsList } from "@/components/consultant/monitoring/ProviderPatientAlertsList";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringAlertsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient monitoring"
        title="Patient alerts"
        description="Review abnormal readings and acknowledge alerts."
        breadcrumbs={[
          { label: "Monitoring", href: "/consultant/monitoring" },
          { label: "Alerts" },
        ]}
      />
      <ProviderPatientAlertsList />
    </Container>
  );
}
