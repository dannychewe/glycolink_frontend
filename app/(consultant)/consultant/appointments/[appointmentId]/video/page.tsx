import { VideoConsultationCall } from "@/components/VideoConsultationCall";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

type ConsultantVideoConsultationPageProps = Readonly<{
  params: Promise<{
    appointmentId: string;
  }>;
}>;

export default async function ConsultantVideoConsultationPage({
  params,
}: ConsultantVideoConsultationPageProps) {
  const { appointmentId } = await params;

  return (
    <Container className="py-2">
      <VideoConsultationCall
        appointmentId={appointmentId}
        backHref="/consultant/appointments"
        backLabel="Back to appointments"
        pcqHref={`/consultant/consultations/${appointmentId}`}
        companion={
          <Card>
            <CardHeader>
              <CardTitle>Clinical workflow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm leading-6 text-muted">
                Keep prescriptions, labs, SOAP notes, and PCQ review in the consultation workspace.
              </p>
              <Button href={`/consultant/consultations/${appointmentId}`} variant="secondary" fullWidth>
                Open consultation workspace
              </Button>
            </CardContent>
          </Card>
        }
      />
    </Container>
  );
}
