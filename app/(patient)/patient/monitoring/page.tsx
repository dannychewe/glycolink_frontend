import { GraphqlMonitoringView } from "@/components/patient/monitoring/GraphqlMonitoringView";
import { Container } from "@/components/ui/container";

export default function PatientMonitoringPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Health monitoring
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Monitoring</h1>
        <p className="text-sm text-muted">
          Log glucose and vital readings, review your history, and track alerts.
        </p>
      </header>

      <GraphqlMonitoringView />
    </Container>
  );
}
