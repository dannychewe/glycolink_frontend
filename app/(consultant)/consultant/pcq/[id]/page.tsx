import { Container } from "@/components/ui/container";
import { ConsultantPCQTemplateBuilder } from "@/components/consultant/pcq/ConsultantPCQTemplateBuilder";

type ConsultantPCQTemplatePageProps = Readonly<{
  params: Promise<{ id: string }>;
}>;

export default async function ConsultantPCQTemplatePage({
  params,
}: ConsultantPCQTemplatePageProps) {
  const { id } = await params;

  return (
    <Container className="space-y-6 py-2">
      <ConsultantPCQTemplateBuilder templateId={id} />
    </Container>
  );
}
