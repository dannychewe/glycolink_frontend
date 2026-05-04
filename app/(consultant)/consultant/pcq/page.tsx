import { Container } from "@/components/ui/container";
import { PCQTemplateManager } from "@/components/consultant/pcq/PCQTemplateManager";

export default function ConsultantPCQPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">PCQ Templates</h1>
        <p className="text-sm text-muted">
          Manage pre-consult questionnaire templates that patients complete before appointments.
        </p>
      </header>

      <PCQTemplateManager />
    </Container>
  );
}
