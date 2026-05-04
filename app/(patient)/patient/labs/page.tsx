import { LabsListView } from "@/components/patient/labs/LabsListView";
import { Container } from "@/components/ui/container";
import { getLabOrders } from "@/lib/patient/mock-labs";

export default function PatientLabsPage() {
  const labOrders = getLabOrders();

  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Lab Tests</h1>
      </header>

      <LabsListView labOrders={labOrders} />
    </Container>
  );
}
