import { PCQResponseForm } from "@/components/patient/pcq/PCQResponseForm";
import { Container } from "@/components/ui/container";

type PCQResponsePageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function PCQResponsePage({ params }: PCQResponsePageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Pre-Consult Questionnaire</h1>
      </header>

      <PCQResponseForm responseId={id} />
    </Container>
  );
}
