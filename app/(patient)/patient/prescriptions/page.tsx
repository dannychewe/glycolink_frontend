import { PrescriptionsListView } from "@/components/patient/prescriptions/PrescriptionsListView";
import { Container } from "@/components/ui/container";
import { getPrescriptions } from "@/lib/patient/mock-prescriptions";

export default function PatientPrescriptionsPage() {
  const prescriptions = getPrescriptions();

  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Prescriptions</h1>
      </header>

      <PrescriptionsListView prescriptions={prescriptions} />
    </Container>
  );
}
