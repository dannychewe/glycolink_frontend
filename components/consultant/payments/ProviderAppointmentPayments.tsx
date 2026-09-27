"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client";
import { CreditCard, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { titleCase } from "@/lib/utils/format";
import { PROVIDER_APPOINTMENT_PAYMENTS_QUERY } from "@/lib/payments/graphql";

type ProviderPayment = {
  id: string;
  amount: string;
  currency: string;
  method: string;
  status: string;
  confirmedAt: string | null;
  expiresAt: string | null;
  commissionAmount: string | null;
  gatewayFeeAmount: string | null;
  netPayoutAmount: string | null;
  appointment: {
    id: string;
    startsAt: string;
    consultationType: string | null;
    patientName: string | null;
  } | null;
};

type Data = { providerAppointmentPayments: ProviderPayment[] };

type StatusFilter = "" | "CONFIRMED" | "PENDING" | "INITIATED" | "FAILED";

function money(amount: string | number | null, currency: string) {
  if (amount === null || amount === undefined) return `${currency} 0.00`;
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Pending", value: "PENDING" },
  { label: "Initiated", value: "INITIATED" },
  { label: "Failed", value: "FAILED" },
];

export function ProviderAppointmentPayments() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const { data, loading, error, refetch } = useQuery<Data>(
    PROVIDER_APPOINTMENT_PAYMENTS_QUERY,
    {
      variables: { limit: 50, status: statusFilter || undefined },
      fetchPolicy: "cache-and-network",
    },
  );

  const payments = data?.providerAppointmentPayments ?? [];
  const primaryCurrency = payments[0]?.currency ?? "ZMW";

  const confirmed = payments.filter((p) => p.status === "CONFIRMED");
  const pending = payments.filter((p) =>
    ["INITIATED", "PENDING"].includes(p.status),
  );

  const totalConfirmed = confirmed.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const totalPending = pending.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0,
  );
  const totalNet = confirmed.reduce(
    (sum, p) => sum + (Number(p.netPayoutAmount) || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Total Received"
          value={money(totalConfirmed.toFixed(2), primaryCurrency)}
          sublabel={`${confirmed.length} confirmed payment${confirmed.length === 1 ? "" : "s"}`}
          icon={CheckCircle2}
          tone="success"
        />
        <StatTile
          label="Pending"
          value={money(totalPending.toFixed(2), primaryCurrency)}
          sublabel={`${pending.length} awaiting confirmation`}
          icon={Clock}
          tone={pending.length > 0 ? "warning" : "neutral"}
        />
        <StatTile
          label="Net Earnings"
          value={money(totalNet.toFixed(2), primaryCurrency)}
          sublabel="After platform commission"
          icon={DollarSign}
          tone="neutral"
        />
      </div>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={CreditCard} count={payments.length}>
            Consultation Payments
          </PanelTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void refetch()}
            >
              Refresh
            </Button>
          </div>
        </PanelHeader>

        <div className="flex gap-2 border-b border-border px-5 py-3">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              type="button"
              size="sm"
              variant={statusFilter === filter.value ? "primary" : "ghost"}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {loading && payments.length === 0 ? (
          <PanelBody>
            <div className="h-32 animate-pulse rounded-lg bg-border/40" />
          </PanelBody>
        ) : error ? (
          <PanelEmpty className="text-warning">
            Unable to load payments.
          </PanelEmpty>
        ) : payments.length === 0 ? (
          <PanelEmpty>No appointment payments found.</PanelEmpty>
        ) : (
          <PanelList>
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text">
                    {payment.appointment?.patientName ?? "Patient"}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDateTime(payment.appointment?.startsAt)}
                    {payment.appointment?.consultationType
                      ? ` · ${titleCase(payment.appointment.consultationType)}`
                      : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {titleCase(payment.method)} · {titleCase(payment.status)}
                  </p>
                </div>
                <div className="shrink-0 text-left sm:text-right">
                  <p className="text-base font-semibold text-text">
                    {money(payment.amount, payment.currency)}
                  </p>
                  {payment.netPayoutAmount !== null &&
                  payment.status === "CONFIRMED" ? (
                    <p className="mt-0.5 text-xs text-muted">
                      Net: {money(payment.netPayoutAmount, payment.currency)}
                    </p>
                  ) : null}
                  <StatusBadge
                    className="mt-2"
                    tone={toneForLifecycleStatus(payment.status)}
                    label={titleCase(payment.status)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </PanelList>
        )}
      </Panel>
    </div>
  );
}
