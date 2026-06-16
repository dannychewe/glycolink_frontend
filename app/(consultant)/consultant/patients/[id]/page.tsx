import { ConsultantPatientWorkspaceView } from "@/components/consultant/patients/ConsultantPatientWorkspaceView";

type ConsultantPatientPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ConsultantPatientPage({
  params,
}: ConsultantPatientPageProps) {
  const { id } = await params;

  return <ConsultantPatientWorkspaceView patientId={id} />;
}
