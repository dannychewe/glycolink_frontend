import { PatientSettingsPageView } from "@/components/patient/settings/PatientSettingsPageView";
import { Container } from "@/components/ui/container";

export default function PatientSettingsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PatientSettingsPageView initialSettings={{ emailNotifications: true, smsNotifications: false }} />
    </Container>
  );
}
