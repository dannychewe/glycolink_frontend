import { Container } from "@/components/ui/container";
import { GraphqlConsultationsList } from "@/components/consultant/consultations/GraphqlConsultationsList";

export default function ConsultantConsultationsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Consultations</h1>
        <p className="text-sm text-muted">
          Start encounters from today&apos;s appointments or continue open sessions.
        </p>
      </header>

      <GraphqlConsultationsList />
    </Container>
  );
}
