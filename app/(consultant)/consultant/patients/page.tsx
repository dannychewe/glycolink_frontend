import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlClientsList } from "@/components/consultant/patients/GraphqlClientsList";

export default function ConsultantPatientsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Clients"
        description="Your connected patients — search, review alerts, and invite new clients."
      />

      <GraphqlClientsList />
    </Container>
  );
}
