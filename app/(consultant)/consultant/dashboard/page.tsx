import { ClinicProgrammeAttentionDashboard } from "@/components/consultant/dashboard/ClinicProgrammeAttentionDashboard";

export default function ConsultantDashboardPage() {
  const today = new Date().toLocaleDateString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-border pb-5">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">{today}</p>
        </div>
      </header>

      <ClinicProgrammeAttentionDashboard />
    </div>
  );
}
