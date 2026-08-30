import { ClinicProgrammeAttentionDashboard } from "@/components/consultant/dashboard/ClinicProgrammeAttentionDashboard";

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
            Clinic Programme
          </p>
          <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Diabetes Care Today</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted">
            Patients with alerts, missed monitoring, or activation blockers are prioritized first.
          </p>
        </div>
        <p className="text-sm text-muted">{today}</p>
      </header>

      <ClinicProgrammeAttentionDashboard />
    </div>
  );
}
