import { Container } from "@/components/ui/container";
import { OrganizationManager } from "@/components/consultant/organization/OrganizationManager";

export default function ConsultantOrganizationPage() {
  return (
    <Container className="space-y-6 py-2">
      <OrganizationManager />
    </Container>
  );
}
