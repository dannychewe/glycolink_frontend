import { Container } from "@/components/ui/container";
import { ProviderDirectoryDiscovery } from "@/components/patient/providers/ProviderDirectoryDiscovery";

export default function PatientProvidersPage() {
  return (
    <Container className="space-y-6 py-2">
      <ProviderDirectoryDiscovery />
    </Container>
  );
}

