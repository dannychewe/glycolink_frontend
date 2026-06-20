import { GraphqlMonitoringView } from "@/components/patient/monitoring/GraphqlMonitoringView";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function PatientMonitoringPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Health monitoring"
        title="Monitoring"
        description="Log glucose and vital readings, review your history, and track alerts."
      />

      <GraphqlMonitoringView />
    </Container>
  );
}
