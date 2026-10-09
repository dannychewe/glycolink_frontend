import { Container } from "@/components/ui/container";
import { GraphqlClientsList } from "@/components/consultant/patients/GraphqlClientsList";

export default function ConsultantPatientsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlClientsList />
    </Container>
  );
}
