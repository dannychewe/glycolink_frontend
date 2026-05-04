import { AdminCorporateNewPlanView } from "@/components/admin/corporate/AdminCorporateNewPlanView";

type Props = Readonly<{ params: Promise<{ id: string }> }>;

export default async function AdminCorporateNewPlanPage({ params }: Props) {
  const { id } = await params;
  return <AdminCorporateNewPlanView corporateId={id} />;
}
