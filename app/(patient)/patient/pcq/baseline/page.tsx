import { BaselinePCQ } from "@/components/patient/pcq/BaselinePCQ";
import { Container } from "@/components/ui/container";

export default function BaselinePCQPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Baseline Questionnaire</h1>
        <p className="text-muted">
          Complete this once so your care team has your diabetes history before your first consultation.
        </p>
      </header>

      <BaselinePCQ />
    </Container>
  );
}
