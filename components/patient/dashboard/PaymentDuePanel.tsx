"use client";

import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Icons } from "@/components/ui/icons";
import { UPCOMING_APPOINTMENT_QUERY } from "@/lib/bookings/graphql";
import {
  MY_PROGRAMME_INVOICES_QUERY,
  type ProgrammeInvoicePage,
} from "@/lib/programmes/graphql";

type InvoicesData = { myProgrammeInvoices: ProgrammeInvoicePage };

type UpcomingAppointmentData = {
  upcomingAppointment: {
    appointment: { id: string; status: string };
    provider: { displayName?: string | null; consultationFee?: string | null };
  } | null;
};

function money(amount: string | number, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/**
 * Covers both balances a patient can owe: an open programme invoice, or an ad
 * hoc appointment still awaiting payment. Hidden entirely when nothing is due.
 */
export function PaymentDuePanel() {
  const invoicesQuery = useQuery<InvoicesData>(MY_PROGRAMME_INVOICES_QUERY, {
    variables: { limit: 10 },
    fetchPolicy: "cache-and-network",
  });
  const upcomingQuery = useQuery<UpcomingAppointmentData>(UPCOMING_APPOINTMENT_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const openInvoices = (invoicesQuery.data?.myProgrammeInvoices.items ?? []).filter(
    (invoice) => Number(invoice.balance) > 0,
  );
  const openTotal = openInvoices.reduce((sum, invoice) => sum + (Number(invoice.balance) || 0), 0);
  const currency = openInvoices[0]?.currency ?? "ZMW";

  const upcoming = upcomingQuery.data?.upcomingAppointment;
  const appointmentAwaitingPayment = upcoming?.appointment.status === "AWAITING_PAYMENT" ? upcoming : null;

  if (openInvoices.length === 0 && !appointmentAwaitingPayment) return null;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.billing}>Payment Due</PanelTitle>
        <Button href="/patient/payments" size="sm">
          Pay now
        </Button>
      </PanelHeader>
      <PanelBody className="space-y-2">
        {openInvoices.length > 0 ? (
          <p className="text-sm text-warning">
            <span className="text-base font-semibold">{money(openTotal.toFixed(2), currency)}</span>{" "}
            outstanding on {openInvoices.length} programme invoice{openInvoices.length === 1 ? "" : "s"}.
          </p>
        ) : null}
        {appointmentAwaitingPayment ? (
          <p className="text-sm text-warning">
            Payment needed to confirm your appointment with{" "}
            {appointmentAwaitingPayment.provider.displayName ?? "your consultant"}
            {appointmentAwaitingPayment.provider.consultationFee
              ? ` (${money(appointmentAwaitingPayment.provider.consultationFee, currency)})`
              : ""}
            .
          </p>
        ) : null}
      </PanelBody>
    </Panel>
  );
}
