import { GraphqlPaymentsListView } from "@/components/patient/payments/GraphqlPaymentsListView";
import { Container } from "@/components/ui/container";

export default function PaymentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <GraphqlPaymentsListView />
    </Container>
  );
}
