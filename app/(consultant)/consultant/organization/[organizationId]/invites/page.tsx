import { Container } from "@/components/ui/container";
import { OrganizationInvitesPageView } from "@/components/consultant/organization/OrganizationManager";

type ConsultantOrganizationInvitesPageProps = Readonly<{
  params: Promise<{
    organizationId: string;
  }>;
}>;

export default async function ConsultantOrganizationInvitesPage({
  params,
}: ConsultantOrganizationInvitesPageProps) {
  const { organizationId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <OrganizationInvitesPageView organizationId={organizationId} />
    </Container>
  );
}
