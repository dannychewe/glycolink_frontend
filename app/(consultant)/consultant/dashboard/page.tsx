import { ConsultantStatusBanner } from "@/components/consultant/dashboard/ConsultantStatusBanner";
import { ConsultantStatsRow } from "@/components/consultant/dashboard/ConsultantStatsRow";
import { GraphqlConsultantAppointmentsSection } from "@/components/consultant/dashboard/GraphqlConsultantAppointmentsSection";
import { MessagesSection } from "@/components/consultant/dashboard/MessagesSection";
import { PatientAlertsSection } from "@/components/consultant/dashboard/PatientAlertsSection";
import { PendingLabsSection } from "@/components/consultant/dashboard/PendingLabsSection";

export default function ConsultantDashboardPage() {
  const today = new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Consultant Workspace
          </p>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Dashboard</h1>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </header>

      <ConsultantStatusBanner />

      <ConsultantStatsRow />

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
