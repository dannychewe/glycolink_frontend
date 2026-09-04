import { Container } from "@/components/ui/container";
import { PatientInbox } from "@/components/patient/messages/PatientInbox";

type PatientMessagesPageProps = Readonly<{
  searchParams: Promise<{ provider?: string }>;
}>;

export default async function PatientMessagesPage({ searchParams }: PatientMessagesPageProps) {
  const { provider } = await searchParams;

  return (
    <Container className="flex h-[calc(100dvh-12rem)] flex-col py-0 md:h-[calc(100dvh-8rem)]">
      <PatientInbox initialProviderId={provider} />
    </Container>
  );
}
