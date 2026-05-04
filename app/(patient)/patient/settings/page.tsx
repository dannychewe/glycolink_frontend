import { PatientSettingsPageView } from "@/components/patient/settings/PatientSettingsPageView";
import { Container } from "@/components/ui/container";
import { getMockPatientSettings } from "@/lib/patient/mock-settings";

export default function PatientSettingsPage() {
  const settings = getMockPatientSettings();

  return (
    <Container className="space-y-6 py-2">
      <PatientSettingsPageView initialSettings={settings} />
    </Container>
  );
}
