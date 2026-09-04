"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { titleCase } from "@/lib/utils/format";
import {
  INITIATE_PROGRAMME_PAYMENT_MUTATION,
  PROGRAMME_INVOICE_QUERY,
  type PaymentAttempt,
  type ProgrammeInvoice,
} from "@/lib/programmes/graphql";

type PaymentDetailViewProps = Readonly<{
  paymentId: string;
}>;

type InvoiceData = {
  programmeInvoice: ProgrammeInvoice;
};

type InitiateData = {
  initiateProgrammePayment: {
    attempt: PaymentAttempt;
  };
};

const POLL_INTERVAL_MS = 4000;

function money(amount: string, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value}`;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("260")) return digits;
  if (digits.startsWith("0")) return `260${digits.slice(1)}`;
  if (digits.length === 9) return `260${digits}`;
  return digits;
}

function isValidPhone(raw: string) {
  return /^260\d{9}$/.test(normalizePhone(raw));
}

function mapError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Unable to process the programme payment.";
}

export function PaymentDetailView({ paymentId }: PaymentDetailViewProps) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error" | "info"; text: string } | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const invoiceQuery = useQuery<InvoiceData>(PROGRAMME_INVOICE_QUERY, {
    variables: { invoiceId: paymentId },
    fetchPolicy: "cache-and-network",
  });
  const [initiatePayment, initiateState] = useMutation<InitiateData>(INITIATE_PROGRAMME_PAYMENT_MUTATION);

  const invoice = invoiceQuery.data?.programmeInvoice;
  const payable = invoice ? Number(invoice.balance) > 0 && ["ISSUED", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status) : false;

  useEffect(() => {
    if (!isPolling) return;
    pollRef.current = setInterval(() => {
      void invoiceQuery.refetch();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [invoiceQuery, isPolling]);

  useEffect(() => {
    if (!isPolling || !invoice) return;
    if (invoice.status === "PAID" || Number(invoice.balance) <= 0) {
      setIsPolling(false);
      setMessage({ tone: "success", text: "Programme payment confirmed." });
    }
  }, [invoice, isPolling]);

  async function handlePay() {
    if (!invoice || !isValidPhone(phone)) {
      setMessage({ tone: "error", text: "Enter a valid Zambian mobile money number." });
      return;
    }
    setMessage(null);
    try {
      const result = await initiatePayment({
        variables: {
          invoiceId: invoice.id,
          phone: normalizePhone(phone),
        },
      });
      const status = result.data?.initiateProgrammePayment.attempt.status ?? "PENDING";
      setMessage({ tone: "info", text: `Mobile money prompt sent. Attempt status: ${titleCase(status)}.` });
      setIsPolling(true);
    } catch (error) {
      setMessage({ tone: "error", text: mapError(error) });
    }
  }

  if (invoiceQuery.loading && !invoice) {
    return <div className="h-80 animate-pulse rounded-lg bg-border/40" />;
  }

  if (invoiceQuery.error || !invoice) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Billing" title="Programme invoice" />
        <Card>
          <CardContent className="space-y-4">
            <p className="text-base text-warning">This invoice could not be loaded or you do not have access to it.</p>
            <Button href="/patient/payments" variant="secondary">Back to payments</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Billing"
        title={invoice.invoiceNumber}
        description="Programme invoice"
        actions={<StatusBadge tone={toneForLifecycleStatus(invoice.status)} label={titleCase(invoice.status)} />}
      />
      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Total</p>
              <p className="mt-1 text-lg font-semibold text-text">{money(invoice.total, invoice.currency)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Paid</p>
              <p className="mt-1 text-lg font-semibold text-text">{money(invoice.amountPaid, invoice.currency)}</p>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Balance</p>
              <p className="mt-1 text-lg font-semibold text-warning">{money(invoice.balance, invoice.currency)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-background px-4 py-3 text-base text-muted">
            Billing period: {formatDate(invoice.billingPeriodStart)} to {formatDate(invoice.billingPeriodEnd)}
            <br />
            Due date: {formatDate(invoice.dueDate)}
          </div>

          {invoice.lineItems.length > 0 ? (
            <div className="rounded-lg border border-border">
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 last:border-b-0">
                  <div>
                    <p className="text-base font-medium text-text">{item.description}</p>
                    <p className="mt-1 text-sm text-muted">Qty {item.quantity}</p>
                  </div>
                  <p className="text-base font-semibold text-text">{money(item.lineTotal, invoice.currency)}</p>
                </div>
              ))}
            </div>
          ) : null}

          {message ? (
            <p
              className={`rounded-lg border px-3 py-2 text-base ${
                message.tone === "success"
                  ? "border-success/30 bg-success/5 text-success"
                  : message.tone === "error"
                    ? "border-danger/30 bg-danger/5 text-danger"
                    : "border-primary/30 bg-primary/5 text-primary"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          {payable ? (
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="space-y-1.5">
                <Label htmlFor="programme-payment-phone">Mobile money number</Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <Input
                    id="programme-payment-phone"
                    type="tel"
                    inputMode="numeric"
                    placeholder="097 000 0000"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" disabled={initiateState.loading || isPolling} onClick={() => void handlePay()}>
                  {initiateState.loading ? "Sending..." : "Pay programme invoice"}
                </Button>
                {isPolling ? (
                  <span className="inline-flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin" />
                    Waiting for confirmation
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button href="/patient/payments" variant="secondary">
            Back to payments
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
