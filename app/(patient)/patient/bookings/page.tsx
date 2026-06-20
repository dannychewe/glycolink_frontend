import { GraphqlAppointmentsListView } from "@/components/patient/appointments/GraphqlAppointmentsListView";
import { Container } from "@/components/ui/container";

export default function PatientAppointmentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlAppointmentsListView />
    </Container>
  );
}
