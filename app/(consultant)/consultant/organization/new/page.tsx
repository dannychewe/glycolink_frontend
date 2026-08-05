import { Container } from "@/components/ui/container";
import { OrganizationCreatePageView } from "@/components/consultant/organization/OrganizationManager";

export default function ConsultantOrganizationCreatePage() {
  return (
    <Container className="space-y-6 py-2">
      <OrganizationCreatePageView />
    </Container>
  );
}
