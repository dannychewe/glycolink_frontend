import { PaymentDetailView } from "@/components/patient/payments/PaymentDetailView";
import { Container } from "@/components/ui/container";

type PaymentDetailPageProps = Readonly<{
  params: Promise<{
    id: string;
  }>;
}>;

export default async function PaymentDetailPage({
  params,
}: PaymentDetailPageProps) {
  const { id } = await params;

  return (
    <Container className="py-2">
      <PaymentDetailView paymentId={id} />
    </Container>
  );
}
