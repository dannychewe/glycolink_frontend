import { GraphqlEncountersListView } from "@/components/patient/records/GraphqlEncountersListView";
import { Container } from "@/components/ui/container";

export default function PatientRecordsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlEncountersListView />
    </Container>
  );
}
