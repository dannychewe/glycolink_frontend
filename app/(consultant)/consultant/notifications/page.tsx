import { Container } from "@/components/ui/container";
import { ConsultantNotificationsPageView } from "@/components/consultant/notifications/ConsultantNotificationsPageView";

export default function ConsultantNotificationsPage() {
  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Notifications</h1>
        <p className="text-sm text-muted">Your activity feed and system alerts.</p>
      </header>

      <ConsultantNotificationsPageView />
    </Container>
  );
}
