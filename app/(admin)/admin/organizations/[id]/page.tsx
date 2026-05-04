import { AdminOrganizationDetailView } from "@/components/admin/organizations/AdminOrganizationsManager";

type AdminOrganizationDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function AdminOrganizationDetailPage({
  params,
}: AdminOrganizationDetailPageProps) {
  const { id } = await params;

  return <AdminOrganizationDetailView organizationId={id} />;
}

