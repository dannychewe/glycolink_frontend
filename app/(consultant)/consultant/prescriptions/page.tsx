import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlPrescriptionsPage } from "@/components/consultant/prescriptions/GraphqlPrescriptionsPage";

export default function ConsultantPrescriptionsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Prescriptions"
        description="Active medications issued to your patients. Issue new prescriptions from within a finalized consultation."
      />

      <GraphqlPrescriptionsPage />
    </Container>
  );
}
