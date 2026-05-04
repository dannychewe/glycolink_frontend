import { Container } from "@/components/ui/container";
import { GraphqlClientsList } from "@/components/consultant/patients/GraphqlClientsList";

export default function ConsultantPatientsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Clients</h1>
        <p className="text-sm text-muted">
          Your connected patients — search, review alerts, and invite new clients.
        </p>
      </header>

      <GraphqlClientsList />
    </Container>
  );
}
