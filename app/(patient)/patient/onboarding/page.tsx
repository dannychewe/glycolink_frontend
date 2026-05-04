import { PatientOnboardingWizard } from "@/components/patient/onboarding/PatientOnboardingWizard";
import { Container } from "@/components/ui/container";

export default function PatientOnboardingPage() {
  return (
    <Container className="max-w-2xl space-y-8 py-6">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Patient Onboarding
        </p>
        <h1 className="text-3xl sm:text-4xl">Complete your profile</h1>
        <p className="text-sm text-muted sm:text-sm">
          Help your care team understand your history before your first consultation. Takes about 3
          minutes.
        </p>
      </div>

      <PatientOnboardingWizard />
    </Container>
  );
}
