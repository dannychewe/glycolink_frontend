import { GraphqlPrescriptionsListView } from "@/components/patient/prescriptions/GraphqlPrescriptionsListView";
import { Container } from "@/components/ui/container";

export default function PatientPrescriptionsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlPrescriptionsListView />
    </Container>
  );
}
