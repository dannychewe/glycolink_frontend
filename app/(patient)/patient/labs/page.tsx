import { GraphqlLabsListView } from "@/components/patient/labs/GraphqlLabsListView";
import { Container } from "@/components/ui/container";

export default function PatientLabsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlLabsListView />
    </Container>
  );
}
