import { Container } from "@/components/ui/container";
import { ProviderLifecycleManager } from "@/components/consultant/profile/ProviderLifecycleManager";

export default function ConsultantProfilePage() {
  return (
    <Container className="space-y-6 py-2">
      <ProviderLifecycleManager />
    </Container>
  );
}
