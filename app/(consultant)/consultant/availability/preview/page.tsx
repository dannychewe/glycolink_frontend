import { ConsultantAvailabilityPreviewPageView } from "@/components/consultant/availability/ConsultantAvailabilityLifecycleManager";
import { Container } from "@/components/ui/container";

export default function ConsultantAvailabilityPreviewPage() {
  return (
    <Container className="space-y-6 py-2">
      <ConsultantAvailabilityPreviewPageView />
    </Container>
  );
}
