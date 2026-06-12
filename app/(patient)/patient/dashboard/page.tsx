import { OnboardingBanner } from "@/components/patient/dashboard/OnboardingBanner";
import { ConsultantInvitesSection } from "@/components/patient/dashboard/ConsultantInvitesSection";
import { GraphqlBookingOverview } from "@/components/patient/dashboard/GraphqlBookingOverview";
import { HealthSummarySection } from "@/components/patient/dashboard/HealthSummarySection";
import { LabSummarySection } from "@/components/patient/dashboard/LabSummarySection";
import { NotificationsSection } from "@/components/patient/dashboard/NotificationsSection";
import { PrescriptionSummarySection } from "@/components/patient/dashboard/PrescriptionSummarySection";
import { Container } from "@/components/ui/container";

export default function PatientDashboardPage() {
  return (
    <Container className="space-y-8 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Dashboard</h1>
        <p>Welcome back</p>
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
