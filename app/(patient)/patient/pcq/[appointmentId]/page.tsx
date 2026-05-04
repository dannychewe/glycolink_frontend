import { PCQForm } from "@/components/patient/pcq/PCQForm";
import { Container } from "@/components/ui/container";

type PCQPageProps = Readonly<{
  params: Promise<{
    appointmentId: string;
  }>;
}>;

export default async function PCQPage({ params }: PCQPageProps) {
  const { appointmentId } = await params;

  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Pre-Consult Questionnaire</h1>
        <p>Complete before your appointment</p>
      </header>

      <PCQForm appointmentId={appointmentId} />
    </Container>
  );
}
