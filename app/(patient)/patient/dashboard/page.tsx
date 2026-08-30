import { OnboardingBanner } from "@/components/patient/dashboard/OnboardingBanner";
import { ConsultantInvitesSection } from "@/components/patient/dashboard/ConsultantInvitesSection";
import { PatientDiabetesHome } from "@/components/patient/programmes/PatientDiabetesHome";
import { Container } from "@/components/ui/container";

export default function PatientDashboardPage() {
  const today = new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Container className="space-y-6 py-2">
      <header className="flex flex-col gap-1 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Diabetes Programme
          </p>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Today&apos;s Care</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Your readings, care plan, and programme billing in one place.
          </p>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </header>

      <OnboardingBanner />

      <ConsultantInvitesSection />

      <PatientDiabetesHome />
    </Container>
  );
}
