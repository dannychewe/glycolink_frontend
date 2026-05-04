import { GraphqlConsultantMonitoringView } from "@/components/consultant/monitoring/GraphqlConsultantMonitoringView";
import { Container } from "@/components/ui/container";

export default function ConsultantMonitoringPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Patient monitoring
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Monitoring</h1>
        <p className="text-sm text-muted">
          Review patient alerts, acknowledge critical readings, and configure glucose thresholds.
        </p>
      </header>

      <GraphqlConsultantMonitoringView />
    </Container>
  );
}
