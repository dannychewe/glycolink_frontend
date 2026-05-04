import { AdminCorporateDetailView } from "@/components/admin/corporate/AdminCorporateDetailView";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function AdminCorporateDetailPage({ params }: Props) {
  const { id } = await params;
  return <AdminCorporateDetailView corporateId={id} />;
}
