import { GraphqlConsultantMonitoringView } from "@/components/consultant/monitoring/GraphqlConsultantMonitoringView";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantMonitoringPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Patient monitoring"
        title="Monitoring"
        description="Review patient alerts, acknowledge critical readings, and configure glucose thresholds."
      />

      <GraphqlConsultantMonitoringView />
    </Container>
  );
}
