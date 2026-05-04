import { AdminCorporateEnrollView } from "@/components/admin/corporate/AdminCorporateEnrollView";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function AdminCorporateEnrollPage({ params }: Props) {
  const { id } = await params;
  return <AdminCorporateEnrollView corporateId={id} />;
}
