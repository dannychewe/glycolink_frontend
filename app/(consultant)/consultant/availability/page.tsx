import { Container } from "@/components/ui/container";
import { ConsultantAvailabilityLifecycleManager } from "@/components/consultant/availability/ConsultantAvailabilityLifecycleManager";

export default function ConsultantAvailabilityPage() {
  return (
    <Container className="space-y-6 py-2">
      <ConsultantAvailabilityLifecycleManager />
    </Container>
  );
}
