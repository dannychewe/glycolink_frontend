import { ProgrammeBaselineWorkflow } from "@/components/patient/programmes/ProgrammeBaselineWorkflow";
import { Container } from "@/components/ui/container";

export default function BaselinePCQPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Diabetes Baseline</h1>
        <p className="text-muted">
          Complete your programme baseline so your clinic can prepare and activate your diabetes care plan.
        </p>
      </header>

      <ProgrammeBaselineWorkflow />
    </Container>
  );
}
