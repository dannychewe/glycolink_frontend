"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { CreditCard } from "lucide-react";
import { Panel, PanelEmpty, PanelHeader, PanelList, PanelTitle } from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { titleCase } from "@/lib/utils/format";
import { MY_APPOINTMENT_PAYMENTS_QUERY } from "@/lib/payments/graphql";

type AppointmentPayment = {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  appointment: {
    id: string;
    startsAt: string;
    consultationType: string | null;
    providerName: string | null;
  } | null;
};

type Data = { myAppointmentPayments: AppointmentPayment[] };

function money(amount: string, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Read-only for now — payments can't be initiated from here yet since the ad
 * hoc payment flow is still dormant pending PAYMENTS_ENABLED. Once that's live,
 * this becomes the natural place to add a "Pay now" action per row.
 */
export function AppointmentPaymentsPanel() {
  const { data, loading, error } = useQuery<Data>(MY_APPOINTMENT_PAYMENTS_QUERY, {
    variables: { limit: 25 },
    fetchPolicy: "cache-and-network",
  });

  const payments = data?.myAppointmentPayments ?? [];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CreditCard} count={payments.length}>
          Appointment Payments
        </PanelTitle>
      </PanelHeader>
      {loading && payments.length === 0 ? (
        <PanelEmpty>Loading your appointment payments…</PanelEmpty>
      ) : error ? (
        <PanelEmpty className="text-warning">Unable to load appointment payments.</PanelEmpty>
      ) : payments.length === 0 ? (
        <PanelEmpty>No appointment payments yet.</PanelEmpty>
      ) : (
        <PanelList>
          {payments.map((payment) => (
            <Link
              key={payment.id}
              href={payment.appointment ? `/patient/bookings/${payment.appointment.id}` : "/patient/bookings"}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-background"
            >
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-text">
                  {payment.appointment?.providerName ?? "Consultation"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {formatDateTime(payment.appointment?.startsAt)}
                  {payment.appointment?.consultationType ? ` · ${titleCase(payment.appointment.consultationType)}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-base font-semibold text-text">{money(payment.amount, payment.currency)}</p>
                <StatusBadge className="mt-2" tone={toneForLifecycleStatus(payment.status)} label={titleCase(payment.status)} size="sm" />
              </div>
            </Link>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}
