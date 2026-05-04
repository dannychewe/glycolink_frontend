import { ConsultantSettingsPageView } from "@/components/consultant/settings/ConsultantSettingsPageView";
import { getMockConsultantSettings } from "@/lib/consultant/mock-settings";

export default function ConsultantSettingsPage() {
  const settings = getMockConsultantSettings();

  return <ConsultantSettingsPageView initialSettings={settings} />;
}
