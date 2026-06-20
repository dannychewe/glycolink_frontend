import { VideoConsultationCall } from "@/components/VideoConsultationCall";
import { Container } from "@/components/ui/container";

type PatientVideoConsultationPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function PatientVideoConsultationPage({
  params,
}: PatientVideoConsultationPageProps) {
  const { id } = await params;

  return (
    <Container className="max-w-none py-2">
      <VideoConsultationCall
        appointmentId={id}
        backHref={`/patient/bookings/${id}`}
        backLabel="Back to appointment"
        pcqHref={`/patient/pcq/${id}`}
      />
    </Container>
  );
}
