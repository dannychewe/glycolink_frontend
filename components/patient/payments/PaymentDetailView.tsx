"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PaymentsComingSoonNotice } from "@/components/patient/payments/PaymentsComingSoonNotice";

type PaymentDetailViewProps = Readonly<{
  paymentId: string;
}>;

export function PaymentDetailView(_props: PaymentDetailViewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Payment Details</h1>
        </CardHeader>
        <CardContent className="space-y-5">
          <PaymentsComingSoonNotice />
          <Button href="/patient/payments" variant="secondary">
            Back to Payments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
