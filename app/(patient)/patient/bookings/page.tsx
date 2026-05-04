import { GraphqlAppointmentsListView } from "@/components/patient/appointments/GraphqlAppointmentsListView";
import { Container } from "@/components/ui/container";

export default function PatientAppointmentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Appointments</h1>
      </header>

      <GraphqlAppointmentsListView />
    </Container>
  );
}
