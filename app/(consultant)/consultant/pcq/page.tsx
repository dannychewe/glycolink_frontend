import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { PCQTemplateManager } from "@/components/consultant/pcq/PCQTemplateManager";

export default function ConsultantPCQPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="PCQ Templates"
        description="Manage pre-consult questionnaire templates that patients complete before appointments."
      />

      <PCQTemplateManager />
    </Container>
  );
}
