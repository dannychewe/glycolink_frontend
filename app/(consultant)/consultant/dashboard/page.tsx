import { ConsultantStatusBanner } from "@/components/consultant/dashboard/ConsultantStatusBanner";
import { GraphqlConsultantAppointmentsSection } from "@/components/consultant/dashboard/GraphqlConsultantAppointmentsSection";
import { MessagesSection } from "@/components/consultant/dashboard/MessagesSection";
import { PatientAlertsSection } from "@/components/consultant/dashboard/PatientAlertsSection";
import { PendingLabsSection } from "@/components/consultant/dashboard/PendingLabsSection";

export default function ConsultantDashboardPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Dashboard</h1>
        <p className="text-sm text-muted">
          Your clinical overview for today — appointments, alerts, and pending actions.
        </p>
      </header>

      <ConsultantStatusBanner />

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          <GraphqlConsultantAppointmentsSection />
          <PendingLabsSection />
        </div>

        <div className="space-y-6">
          <PatientAlertsSection />
          <MessagesSection />
        </div>
      </div>
    </div>
  );
}
