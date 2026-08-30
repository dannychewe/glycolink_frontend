"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client";
import { CreditCard, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/ui/page-header";
import {
  MY_PROGRAMME_ENTITLEMENTS_QUERY,
  MY_PROGRAMME_INVOICES_QUERY,
  type ProgrammeEntitlement,
  type ProgrammeInvoicePage,
} from "@/lib/programmes/graphql";

type InvoicesData = {
  myProgrammeInvoices: ProgrammeInvoicePage;
};

type EntitlementsData = {
  myProgrammeEntitlements: ProgrammeEntitlement[];
};

function money(amount: string, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(status: string | null | undefined) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PAID" || normalized === "ACTIVE") return "success" as const;
  if (normalized === "OVERDUE" || normalized === "COMMERCIALLY_SUSPENDED") return "danger" as const;
  if (normalized === "ISSUED" || normalized === "PARTIALLY_PAID" || normalized === "IN_GRACE") return "warning" as const;
  return "secondary" as const;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not issued";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

export function GraphqlPaymentsListView() {
  const invoicesQuery = useQuery<InvoicesData>(MY_PROGRAMME_INVOICES_QUERY, {
    variables: { limit: 25 },
    fetchPolicy: "cache-and-network",
  });
  const entitlementsQuery = useQuery<EntitlementsData>(MY_PROGRAMME_ENTITLEMENTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const invoices = invoicesQuery.data?.myProgrammeInvoices.items ?? [];
  const entitlements = entitlementsQuery.data?.myProgrammeEntitlements ?? [];
  const openInvoices = invoices.filter((invoice) => Number(invoice.balance) > 0);
  const totalOpen = openInvoices.reduce((sum, invoice) => sum + (Number(invoice.balance) || 0), 0);
  const primaryCurrency = openInvoices[0]?.currency ?? invoices[0]?.currency ?? "ZMW";
  const activeEntitlements = entitlements.filter((entitlement) => entitlement.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diabetes programme"
        title="Programme billing"
        description="Review diabetes care invoices, payment status, and programme entitlement."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Open Balance"
          value={money(totalOpen.toFixed(2), primaryCurrency)}
          sublabel={`${openInvoices.length} payable invoice${openInvoices.length === 1 ? "" : "s"}`}
          icon={CreditCard}
          tone={totalOpen > 0 ? "warning" : "success"}
        />
        <StatTile
          label="Entitlements"
          value={activeEntitlements}
          sublabel={`${entitlements.length} programme entitlement records`}
          icon={ReceiptText}
          tone={activeEntitlements > 0 ? "success" : "neutral"}
        />
        <StatTile
          label="Invoices"
          value={invoicesQuery.data?.myProgrammeInvoices.total ?? invoices.length}
          sublabel="programme billing records"
          icon={ReceiptText}
          tone="neutral"
        />
      </div>

      {entitlements.length > 0 ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={ReceiptText}>Programme Entitlement</PanelTitle>
          </PanelHeader>
          <PanelList>
            {entitlements.map((entitlement) => (
              <div key={entitlement.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">Programme access</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(entitlement.entitledPeriodStart)} to {formatDate(entitlement.entitledPeriodEnd)}
                  </p>
                </div>
                <Badge variant={statusVariant(entitlement.status)}>{titleCase(entitlement.status)}</Badge>
              </div>
            ))}
          </PanelList>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader>
          <PanelTitle icon={ReceiptText} count={invoices.length}>Programme Invoices</PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void invoicesQuery.refetch()}>
            Refresh
          </Button>
        </PanelHeader>
        {invoicesQuery.loading && invoices.length === 0 ? (
          <PanelBody>
            <div className="h-32 animate-pulse rounded-lg bg-border/40" />
          </PanelBody>
        ) : invoicesQuery.error ? (
          <PanelEmpty className="text-warning">Unable to load programme invoices.</PanelEmpty>
        ) : invoices.length === 0 ? (
          <PanelEmpty>No programme invoices have been issued yet.</PanelEmpty>
        ) : (
          <PanelList>
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/patient/payments/${invoice.id}`}
                className="block px-5 py-4 transition-colors hover:bg-background"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-text">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(invoice.billingPeriodStart)} to {formatDate(invoice.billingPeriodEnd)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-text">{money(invoice.balance, invoice.currency)}</p>
                    <Badge className="mt-2" variant={statusVariant(invoice.status)}>
                      {titleCase(invoice.status)}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </PanelList>
        )}
      </Panel>
    </div>
  );
}
