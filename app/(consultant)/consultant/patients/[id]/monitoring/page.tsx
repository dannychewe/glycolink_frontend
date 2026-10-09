import { ConsultantPatientMonitoringPanel } from "@/components/consultant/monitoring/ConsultantPatientMonitoringPanel";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type ConsultantPatientMonitoringPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function ConsultantPatientMonitoringPage({
  params,
}: ConsultantPatientMonitoringPageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <Button
        href={`/consultant/patients/${id}`}
        size="sm"
        variant="ghost"
        className="h-auto p-0 text-xs text-muted"
      >
        <ArrowLeft className="size-3.5" />
        Back to patient
      </Button>
      <ConsultantPatientMonitoringPanel patientId={id} limit={50} standalone />
    </Container>
  );
}
