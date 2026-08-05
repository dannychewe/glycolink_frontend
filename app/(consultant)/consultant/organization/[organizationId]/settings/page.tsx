import { Container } from "@/components/ui/container";
import { OrganizationSettingsPageView } from "@/components/consultant/organization/OrganizationManager";

type ConsultantOrganizationSettingsPageProps = Readonly<{
  params: Promise<{
    organizationId: string;
  }>;
}>;

export default async function ConsultantOrganizationSettingsPage({
  params,
}: ConsultantOrganizationSettingsPageProps) {
  const { organizationId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <OrganizationSettingsPageView organizationId={organizationId} />
    </Container>
  );
}
