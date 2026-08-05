import { Container } from "@/components/ui/container";
import { OrganizationDetailPageView } from "@/components/consultant/organization/OrganizationManager";

type ConsultantOrganizationDetailPageProps = Readonly<{
  params: Promise<{
    organizationId: string;
  }>;
}>;

export default async function ConsultantOrganizationDetailPage({
  params,
}: ConsultantOrganizationDetailPageProps) {
  const { organizationId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <OrganizationDetailPageView organizationId={organizationId} />
    </Container>
  );
}
