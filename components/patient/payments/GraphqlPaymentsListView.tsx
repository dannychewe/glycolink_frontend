"use client";

import { useQuery } from "@apollo/client";
import { CreditCard, Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MY_PAYMENTS_QUERY } from "@/lib/patient/payments-graphql";

type Payment = {
  id: string;
  appointmentId: string | null;
  amount: number | null;
  currency: string | null;
  status: string;
  method: string | null;
  paidAt: string | null;
  createdAt: string;
  appointment: {
    id: string;
    startsAt: string | null;
    provider: { id: string; displayName: string } | null;
  } | null;
};

type MyPaymentsData = {
  myPayments: Payment[];
};

function getStatusVariant(status: string): "success" | "warning" | "danger" | "secondary" | "primary" {
  const s = status.trim().toUpperCase();
  if (s === "SUCCESS" || s === "PAID") return "success";
  if (s === "FAILED") return "danger";
  if (s === "PENDING") return "warning";
  if (s === "PROCESSING") return "primary";
  return "secondary";
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-ZM", { month: "long", day: "numeric", year: "numeric" });
}

function formatAmount(amount: number | null, currency: string | null) {
  if (amount === null || amount === undefined) return "—";
  const code = currency ?? "USD";
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount}`;
  }
}

export function GraphqlPaymentsListView() {
  const { data, loading, error } = useQuery<MyPaymentsData>(MY_PAYMENTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "network-only",
  });

  const payments = data?.myPayments ?? [];

  return (
    <div className="space-y-7">
      <header className="relative overflow-hidden rounded-[1.75rem] border border-border/80 bg-gradient-to-br from-primary/10 via-surface to-surface px-6 py-7 shadow-soft sm:px-8">
        <div className="absolute -right-12 -top-12 size-40 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Billing
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Payments</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Review your consultation payments and current status.
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Unable to load payments right now.
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-32 animate-pulse bg-border/40" />
          ))}
        </div>
      ) : null}

      {!loading && payments.length > 0 ? (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="border-border/80">
              <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard className="size-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-text">
                      {payment.appointment?.provider?.displayName ?? "Consultation"}
                    </p>
                    <p className="text-sm text-muted">{formatDate(payment.createdAt)}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(payment.status)}>
                  {payment.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs text-muted">Amount</p>
                  <p className="text-lg font-semibold text-text">
                    {formatAmount(payment.amount, payment.currency)}
                  </p>
                </div>
                <Button href={`/patient/payments/${payment.id}`} variant="secondary">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!loading && payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <Receipt className="mx-auto mb-3 size-8 text-muted/50" />
          <p className="text-base font-medium text-text">No payments yet</p>
          <p className="mt-1 text-sm text-muted">Payment records appear here after consultations.</p>
        </div>
      ) : null}
    </div>
  );
}
