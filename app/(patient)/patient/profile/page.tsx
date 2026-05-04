import { PatientClinicalProfileManager } from "@/components/patient/profile/PatientClinicalProfileManager";
import { Container } from "@/components/ui/container";

export default function PatientProfilePage() {
  return (
    <Container className="space-y-6 py-2">
      <PatientClinicalProfileManager />
    </Container>
  );
}
