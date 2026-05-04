import { AdminPCQTemplateDetailView } from "@/components/admin/pcq/AdminPCQTemplateDetailView";

type AdminPCQTemplateDetailPageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function AdminPCQTemplateDetailPage({
  params,
}: AdminPCQTemplateDetailPageProps) {
  const { id } = await params;

  return <AdminPCQTemplateDetailView templateId={id} />;
}
