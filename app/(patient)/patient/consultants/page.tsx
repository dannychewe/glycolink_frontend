import { MyConsultantsView } from "@/components/patient/consultants/MyConsultantsView";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function PatientConsultantsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="My care team"
        title="My consultants"
        description="Providers connected to your care, plus any pending invitations."
      />

      <MyConsultantsView />
    </Container>
  );
}
