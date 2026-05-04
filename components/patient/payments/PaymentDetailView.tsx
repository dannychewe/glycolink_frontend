"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getPaymentById } from "@/lib/patient/mock-payments";
import { getStoredPaymentById, upsertStoredPayment } from "@/lib/patient/payment-storage";
import type { PaymentRecord } from "@/types";
import { PaymentStatusBadge } from "@/components/patient/payments/PaymentStatusBadge";

type PaymentDetailViewProps = Readonly<{
  paymentId: string;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function PaymentDetailView({ paymentId }: PaymentDetailViewProps) {
  const [payment, setPayment] = useState<PaymentRecord | null | undefined>(undefined);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  useEffect(() => {
    const storedPayment = getStoredPaymentById(paymentId);
    const mockPayment = getPaymentById(paymentId);
    const nextPayment = storedPayment ?? mockPayment ?? null;

    if (nextPayment) {
      upsertStoredPayment(nextPayment);
    }

    setPayment(nextPayment);
  }, [paymentId]);

  async function handlePayNow() {
    if (!payment) {
      return;
    }

    setIsProcessingAction(true);
    const processingPayment: PaymentRecord = {
      ...payment,
      status: "PROCESSING",
    };
    setPayment(processingPayment);
    upsertStoredPayment(processingPayment);

    await new Promise((resolve) => setTimeout(resolve, 1800));

    const successPayment: PaymentRecord = {
      ...processingPayment,
      status: "SUCCESS",
    };
    setPayment(successPayment);
    upsertStoredPayment(successPayment);
    setIsProcessingAction(false);
  }

  if (payment === undefined) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Loading payment...</p>
        </CardContent>
      </Card>
    );
  }

  if (payment === null) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-semibold text-text">Payment not found</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>This payment record could not be found.</p>
          <Button href="/patient/payments" variant="secondary">
            Back to Payments
          </Button>
        </CardContent>
      </Card>
    );
  }

  const showPayActions = payment.status === "PENDING" || payment.status === "FAILED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-semibold text-text sm:text-3xl">Payment Details</h1>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Provider</p>
            <p className="text-base font-medium text-text">{payment.providerName}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Amount</p>
            <p className="text-base font-medium text-text">${payment.amount}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Appointment Reference</p>
            <p className="text-base font-medium text-text">{payment.appointmentId}</p>
          </div>
          <div>
            <p className="text-sm text-muted">Date</p>
            <p className="text-base font-medium text-text">{formatDate(payment.createdAt)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <h2 className="text-lg font-semibold text-text">Status</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <PaymentStatusBadge status={payment.status} />
          {showPayActions ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="button"
                onClick={handlePayNow}
                disabled={isProcessingAction}
                className="sm:flex-1"
              >
                {isProcessingAction ? "Processing..." : "Pay Now"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handlePayNow}
                disabled={isProcessingAction}
                className="sm:flex-1"
              >
                {isProcessingAction ? "Processing..." : "Retry Payment"}
              </Button>
            </div>
          ) : null}

          {payment.status === "PROCESSING" ? (
            <p className="text-sm font-medium text-text">Waiting for confirmation...</p>
          ) : null}

          {payment.status === "SUCCESS" ? (
            <p className="text-sm font-medium text-success">Payment Completed</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
