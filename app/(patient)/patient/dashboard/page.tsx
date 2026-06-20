import { OnboardingBanner } from "@/components/patient/dashboard/OnboardingBanner";
import { ConsultantInvitesSection } from "@/components/patient/dashboard/ConsultantInvitesSection";
import { GraphqlBookingOverview } from "@/components/patient/dashboard/GraphqlBookingOverview";
import { HealthSummarySection } from "@/components/patient/dashboard/HealthSummarySection";
import { LabSummarySection } from "@/components/patient/dashboard/LabSummarySection";
import { NotificationsSection } from "@/components/patient/dashboard/NotificationsSection";
import { PrescriptionSummarySection } from "@/components/patient/dashboard/PrescriptionSummarySection";
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
            Patient Portal
          </p>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Dashboard</h1>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </header>

      <OnboardingBanner />

      <ConsultantInvitesSection />

      <GraphqlBookingOverview />
      <HealthSummarySection />

      <div className="grid gap-6 xl:grid-cols-2">
        <PrescriptionSummarySection />
        <LabSummarySection />
      </div>

      <NotificationsSection />
    </Container>
  );
}
