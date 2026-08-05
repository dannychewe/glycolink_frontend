import { ConsultantAvailabilitySchedulePageView } from "@/components/consultant/availability/ConsultantAvailabilityLifecycleManager";
import { Container } from "@/components/ui/container";

export default function ConsultantAvailabilitySchedulePage() {
  return (
    <Container className="space-y-6 py-2">
      <ConsultantAvailabilitySchedulePageView />
    </Container>
  );
}
