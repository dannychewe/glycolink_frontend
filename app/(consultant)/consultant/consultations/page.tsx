import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlConsultationsList } from "@/components/consultant/consultations/GraphqlConsultationsList";

export default function ConsultantConsultationsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Consultations"
        description="Start encounters from today's appointments or continue open sessions."
      />

      <GraphqlConsultationsList />
    </Container>
  );
}
