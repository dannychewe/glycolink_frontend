import { NotificationsPageView } from "@/components/patient/notifications/NotificationsPageView";
import { Container } from "@/components/ui/container";
import { getMockNotifications } from "@/lib/patient/mock-notifications";

export default function PatientNotificationsPage() {
  const notifications = getMockNotifications();

  return (
    <Container className="space-y-6 py-2">
      <NotificationsPageView initialNotifications={notifications} />
    </Container>
  );
}
