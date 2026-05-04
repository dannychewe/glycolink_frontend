import { ConsultantOnboardingWizard } from "@/components/consultant/onboarding/ConsultantOnboardingWizard";
import { Container } from "@/components/ui/container";

export default function ConsultantOnboardingPage() {
  return (
    <Container className="max-w-2xl space-y-8 py-6">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          Provider Onboarding
        </p>
        <h1 className="text-3xl sm:text-4xl">Set up your provider profile</h1>
        <p className="text-sm text-muted sm:text-sm">
          Complete your profile so patients can find and book consultations with you. Takes about 5
          minutes.
        </p>
      </div>

      <ConsultantOnboardingWizard />
    </Container>
  );
}
