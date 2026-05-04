import { PaymentStatusBadge } from "@/components/patient/payments/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { getPayments } from "@/lib/patient/mock-payments";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function PaymentsPage() {
  const payments = getPayments();

  return (
    <Container className="space-y-6 py-2">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl">Payments</h1>
        <p>Review your consultation payments and current status.</p>
      </header>

      <div className="grid gap-4">
        {payments.map((payment) => (
          <Card key={payment.id}>
            <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <p className="text-lg font-semibold text-text">{payment.providerName}</p>
                <p className="text-sm text-muted">{formatDate(payment.createdAt)}</p>
              </div>
              <PaymentStatusBadge status={payment.status} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-muted">Amount</p>
                <p className="text-lg font-semibold text-text">${payment.amount}</p>
              </div>
              <Button href={`/patient/payments/${payment.id}`} variant="secondary">
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}
