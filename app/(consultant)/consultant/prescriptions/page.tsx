import { Container } from "@/components/ui/container";
import { GraphqlPrescriptionsPage } from "@/components/consultant/prescriptions/GraphqlPrescriptionsPage";

export default function ConsultantPrescriptionsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Prescriptions</h1>
        <p className="text-sm text-muted">
          Active medications issued to your patients. Issue new prescriptions from within a finalized consultation.
        </p>
      </header>

      <GraphqlPrescriptionsPage />
    </Container>
  );
}
