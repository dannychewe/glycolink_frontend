import { Container } from "@/components/ui/container";
import { PatientInbox } from "@/components/patient/messages/PatientInbox";

type Props = Readonly<{
  params: Promise<{ conversation_id: string }>;
}>;

export default async function PatientMessageThreadPage({ params }: Props) {
  const { conversation_id } = await params;

  return (
    <Container className="flex h-[calc(100dvh-12rem)] flex-col py-0 md:h-[calc(100dvh-8rem)]">
      <PatientInbox initialConversationId={conversation_id} />
    </Container>
  );
}
