import { AppointmentDetailView } from "@/components/patient/AppointmentDetailView";
import { Container } from "@/components/ui/container";

type AppointmentDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function AppointmentDetailPage({
  params,
}: AppointmentDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="py-2">
      <AppointmentDetailView appointmentId={id} />
    </Container>
  );
}
