import { ProviderAppointmentPayments } from "@/components/consultant/payments/ProviderAppointmentPayments";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";

export default function ConsultantPaymentsPage() {
  return (
    <Container className="space-y-6 py-2">
      <PageHeader
        eyebrow="Finances"
        title="Consultation Payments"
        description="See who has paid, pending amounts, and earnings from your consultations."
      />
      <ProviderAppointmentPayments />
    </Container>
  );
}
