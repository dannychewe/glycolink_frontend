import { Container } from "@/components/ui/container";
import { GraphqlConsultantAppointmentsWorklist } from "@/components/consultant/appointments/GraphqlConsultantAppointmentsWorklist";

export default function ConsultantAppointmentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Clinical Worklist
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Appointments</h1>
        <p className="text-sm text-muted">
          Manage today&apos;s schedule, reschedule or cancel appointments, and track upcoming sessions.
        </p>
      </header>

      <GraphqlConsultantAppointmentsWorklist />
    </Container>
  );
}
