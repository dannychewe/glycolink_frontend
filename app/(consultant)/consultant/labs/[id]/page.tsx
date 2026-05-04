import { notFound } from "next/navigation";
import { ConsultantLabDetailView } from "@/components/consultant/labs/ConsultantLabDetailView";
import { getMockConsultantLabById } from "@/lib/consultant/mock-labs";

type ConsultantLabDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ConsultantLabDetailPage({
  params,
}: ConsultantLabDetailPageProps) {
  const { id } = await params;
  const lab = getMockConsultantLabById(id);

  if (!lab) {
    notFound();
  }

  return <ConsultantLabDetailView lab={lab} />;
}
