import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { ConsultantNotificationsPageView } from "@/components/consultant/notifications/ConsultantNotificationsPageView";

export default function ConsultantNotificationsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Notifications"
        description="Your activity feed and system alerts."
      />

      <ConsultantNotificationsPageView />
    </Container>
  );
}
