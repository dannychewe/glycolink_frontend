import { NotificationsPageView } from "@/components/patient/notifications/NotificationsPageView";
import { Container } from "@/components/ui/container";

export default function PatientNotificationsPage() {
  return (
    <Container className="space-y-6 py-2">
      <NotificationsPageView />
    </Container>
  );
}
