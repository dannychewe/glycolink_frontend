import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { GraphqlConsultantAppointmentsWorklist } from "@/components/consultant/appointments/GraphqlConsultantAppointmentsWorklist";

export default function ConsultantAppointmentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Clinical Worklist"
        title="Appointments"
        description="Manage today's schedule, reschedule or cancel appointments, and track upcoming sessions."
      />

      <GraphqlConsultantAppointmentsWorklist />
    </Container>
  );
}
