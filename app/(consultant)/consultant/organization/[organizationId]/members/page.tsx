import { Container } from "@/components/ui/container";
import { OrganizationMembersPageView } from "@/components/consultant/organization/OrganizationManager";

type ConsultantOrganizationMembersPageProps = Readonly<{
  params: Promise<{
    organizationId: string;
  }>;
}>;

export default async function ConsultantOrganizationMembersPage({
  params,
}: ConsultantOrganizationMembersPageProps) {
  const { organizationId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <OrganizationMembersPageView organizationId={organizationId} />
    </Container>
  );
}
