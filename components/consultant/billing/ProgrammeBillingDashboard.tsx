"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertTriangle, CreditCard, ReceiptText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { hasProgrammePermission } from "@/lib/programmes/permissions";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import {
  ASSIGN_PROGRAMME_PAYER_MUTATION,
  CANCEL_PROGRAMME_INVOICE_MUTATION,
  CLINIC_CARE_PROGRAMMES_QUERY,
  CLINIC_PROGRAMME_BILLING_SUMMARY_QUERY,
  CLINIC_PROGRAMME_ENROLMENTS_QUERY,
  CREATE_PROGRAMME_PAYER_MUTATION,
  CREATE_PROGRAMME_PRICE_MUTATION,
  DEACTIVATE_PROGRAMME_PRICE_MUTATION,
  GENERATE_PROGRAMME_INVOICE_MUTATION,
  ISSUE_PROGRAMME_INVOICE_MUTATION,
  PROGRAMME_PAYMENT_INTENT_QUERY,
  PROGRAMME_PAYMENT_INTENTS_QUERY,
  PROGRAMME_INVOICES_QUERY,
  PROGRAMME_PAYERS_QUERY,
  PROGRAMME_PRICES_QUERY,
  VOID_PROGRAMME_INVOICE_MUTATION,
  type CareProgramme,
  type ClinicProgrammeBillingSummary,
  type ProgrammeEnrolment,
  type ProgrammeInvoicePage,
  type ProgrammePayer,
  type ProgrammePaymentIntent,
} from "@/lib/programmes/graphql";

type SummaryData = {
  clinicProgrammeBillingSummary: ClinicProgrammeBillingSummary;
};

type InvoicesData = {
  programmeInvoices: ProgrammeInvoicePage;
};

type PricesData = {
  programmePrices: Array<{
    id: string;
    programmeId: string;
    name: string;
    currency: string;
    amount: string;
    billingModel: string;
    billingInterval?: string | null;
    active: boolean;
  }>;
};

type ProgrammesData = {
  clinicCareProgrammes: CareProgramme[];
};

type EnrolmentsData = {
  clinicProgrammeEnrolments: ProgrammeEnrolment[];
};

type PayersData = {
  programmePayers: ProgrammePayer[];
};

type ConsultantClientsData = {
  consultantClients: Array<{
    patientId: string;
    patientName?: string | null;
    email?: string | null;
    phone?: string | null;
  }>;
};

type PaymentIntentData = {
  programmePaymentIntent: ProgrammePaymentIntent;
};

type PaymentIntentsData = {
  programmePaymentIntents: ProgrammePaymentIntent[];
};

type BillingWorkflow = "overview" | "prices" | "payers" | "invoices" | "payments";

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
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

export function ProgrammeBillingDashboard({ workflow = "overview" }: { workflow?: BillingWorkflow }) {
  const { user } = useAuth();
  const canManageBilling = hasProgrammePermission(user, "billing.manage");
  const [programmeId, setProgrammeId] = useState("");
  const [enrolmentId, setEnrolmentId] = useState("");
  const [payerId, setPayerId] = useState("");
  const [priceId, setPriceId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [payerPatientId, setPayerPatientId] = useState("");
  const [priceName, setPriceName] = useState("Diabetes continuity monthly");
  const [amount, setAmount] = useState("250");
  const [currencyInput, setCurrencyInput] = useState("ZMW");
  const [billingModel, setBillingModel] = useState("subscription");
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [payerName, setPayerName] = useState("");
  const [payerType, setPayerType] = useState("patient");
  const [payerPhone, setPayerPhone] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reason, setReason] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [adminError, setAdminError] = useState<string | null>(null);
  const organizationOptions = useMemo(() => {
    const memberships = user?.clinicAccess?.memberships ?? [];
    const seen = new Set<string>();
    return memberships
      .filter((membership) => membership?.organizationId)
      .map((membership) => ({
        value: membership.organizationId as string,
        label: membership.organizationName ?? "Clinic organization",
        description: membership.tenantName ?? undefined,
        badge: titleCase(membership.role),
      }))
      .filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      });
  }, [user?.clinicAccess?.memberships]);

  const programmesQuery = useQuery<ProgrammesData>(CLINIC_CARE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const summaryQuery = useQuery<SummaryData>(CLINIC_PROGRAMME_BILLING_SUMMARY_QUERY, {
    variables: { programmeId: programmeId || undefined },
    fetchPolicy: "cache-and-network",
  });
  const enrolmentsQuery = useQuery<EnrolmentsData>(CLINIC_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { programmeId: programmeId || undefined },
    skip: !programmeId,
    fetchPolicy: "cache-and-network",
  });
  const invoicesQuery = useQuery<InvoicesData>(PROGRAMME_INVOICES_QUERY, {
    variables: { programmeId: programmeId || undefined, enrolmentId: enrolmentId || undefined, payerId: payerId || undefined, limit: 25 },
    fetchPolicy: "cache-and-network",
  });
  const pricesQuery = useQuery<PricesData>(PROGRAMME_PRICES_QUERY, {
    variables: { programmeId: programmeId || undefined },
    fetchPolicy: "cache-and-network",
  });
  const payersQuery = useQuery<PayersData>(PROGRAMME_PAYERS_QUERY, {
    variables: { organizationId: organizationId || undefined, active: true },
    fetchPolicy: "cache-and-network",
  });
  const patientsQuery = useQuery<ConsultantClientsData>(CONSULTANT_CLIENTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const paymentIntentQuery = useQuery<PaymentIntentData>(PROGRAMME_PAYMENT_INTENT_QUERY, {
    variables: { paymentId },
    skip: !paymentId.trim(),
    fetchPolicy: "network-only",
  });
  const paymentIntentsQuery = useQuery<PaymentIntentsData>(PROGRAMME_PAYMENT_INTENTS_QUERY, {
    variables: {
      programmeId: programmeId || undefined,
      enrolmentId: enrolmentId || undefined,
      payerId: payerId || undefined,
      limit: 50,
    },
    fetchPolicy: "cache-and-network",
  });
  const [createPrice, createPriceState] = useMutation(CREATE_PROGRAMME_PRICE_MUTATION);
  const [deactivatePrice, deactivatePriceState] = useMutation(DEACTIVATE_PROGRAMME_PRICE_MUTATION);
  const [createPayer, createPayerState] = useMutation(CREATE_PROGRAMME_PAYER_MUTATION);
  const [assignPayer, assignPayerState] = useMutation(ASSIGN_PROGRAMME_PAYER_MUTATION);
  const [generateInvoice, generateInvoiceState] = useMutation(GENERATE_PROGRAMME_INVOICE_MUTATION);
  const [issueInvoice, issueInvoiceState] = useMutation(ISSUE_PROGRAMME_INVOICE_MUTATION);
  const [cancelInvoice, cancelInvoiceState] = useMutation(CANCEL_PROGRAMME_INVOICE_MUTATION);
  const [voidInvoice, voidInvoiceState] = useMutation(VOID_PROGRAMME_INVOICE_MUTATION);

  const summary = summaryQuery.data?.clinicProgrammeBillingSummary;
  const invoices = invoicesQuery.data?.programmeInvoices.items ?? [];
  const prices = pricesQuery.data?.programmePrices ?? [];
  const programmes = programmesQuery.data?.clinicCareProgrammes ?? [];
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];
  const payers = payersQuery.data?.programmePayers ?? [];
  const paymentIntents = paymentIntentsQuery.data?.programmePaymentIntents ?? [];
  const programmeOptions = programmes.map((programme) => ({
    value: programme.id,
    label: programme.name,
    description: programme.code,
    badge: titleCase(programme.status),
  }));
  const enrolmentOptions = enrolments.map((enrolment) => ({
    value: enrolment.id,
    label: enrolment.patient.fullName ?? enrolment.patient.email ?? "Programme enrolment",
    description: `${enrolment.programme.name} · ${enrolment.leadProvider?.displayName ?? "No lead provider"}`,
    badge: titleCase(enrolment.status),
  }));
  const payerOptions = payers.map((payer) => ({
    value: payer.id,
    label: payer.displayName,
    description: [titleCase(payer.payerType), payer.mobileMoneyPhone, payer.billingContactEmail].filter(Boolean).join(" · "),
    badge: payer.active ? "Active" : "Inactive",
  }));
  const priceOptions = prices.map((price) => ({
    value: price.id,
    label: price.name,
    description: `${money(price.amount, price.currency)} · ${titleCase(price.billingModel)} · ${titleCase(price.billingInterval)}`,
    badge: price.active ? "Active" : "Inactive",
  }));
  const patientOptions = (patientsQuery.data?.consultantClients ?? []).map((patient) => ({
    value: patient.patientId,
    label: patient.patientName || patient.email || "Patient",
    description: [patient.email, patient.phone].filter(Boolean).join(" · "),
  }));
  const paymentIntentOptions = paymentIntents.map((intent) => {
    const invoice = invoices.find((candidate) => candidate.id === intent.programmeInvoiceId);
    return {
      value: intent.id,
      label: invoice?.invoiceNumber ?? `Payment ${intent.id.slice(0, 8)}`,
      description: [
        invoice?.payer.displayName,
        money(intent.amount, intent.currency),
        titleCase(intent.method),
        intent.confirmedAt ? `Confirmed ${formatDate(intent.confirmedAt)}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      badge: titleCase(intent.status),
    };
  });
  const firstCurrency = summary?.amountsByCurrency[0];
  const currency = firstCurrency?.currency ?? invoices[0]?.currency ?? "ZMW";
  const outstanding = firstCurrency?.outstandingBalance ?? "0";
  const collected = firstCurrency?.amountCollected ?? "0";
  const saving =
    createPriceState.loading ||
    deactivatePriceState.loading ||
    createPayerState.loading ||
    assignPayerState.loading ||
    generateInvoiceState.loading ||
    issueInvoiceState.loading ||
    cancelInvoiceState.loading ||
    voidInvoiceState.loading;
  const showAdminPanel = workflow !== "overview";
  const showPriceWorkflow = workflow === "prices";
  const showPayerWorkflow = workflow === "payers";
  const showInvoiceWorkflow = workflow === "invoices";
  const showPaymentWorkflow = workflow === "payments";
  const showPricesList = workflow === "overview" || workflow === "prices";
  const showInvoicesList = workflow === "overview" || workflow === "invoices";

  function mapError(error: unknown) {
    if (error instanceof Error) return error.message;
    return "Billing request failed.";
  }

  async function refetchBilling() {
    await summaryQuery.refetch();
    await invoicesQuery.refetch();
    await pricesQuery.refetch();
    await payersQuery.refetch();
    await paymentIntentsQuery.refetch();
    if (programmeId) await enrolmentsQuery.refetch();
  }

  async function run(action: () => Promise<unknown>) {
    setAdminError(null);
    try {
      await action();
      await refetchBilling();
    } catch (err) {
      setAdminError(mapError(err));
    }
  }

  function handleCreatePrice(event: FormEvent) {
    event.preventDefault();
    if (!programmeId.trim()) return;
    void run(() =>
      createPrice({
        variables: {
          programmeId: programmeId.trim(),
          data: {
            name: priceName,
            currency: currencyInput,
            amount,
            billingModel,
            billingInterval,
            includedServiceSummary: "Diabetes continuity care, monitoring review, care-team follow-up.",
            approved: true,
          },
        },
      }),
    );
  }

  function handleCreatePayer(event: FormEvent) {
    event.preventDefault();
    if (!organizationId.trim()) return;
    void run(() =>
      createPayer({
        variables: {
          data: {
            organizationId: organizationId.trim(),
            payerType,
            displayName: payerName || undefined,
            patientId: payerType.toLowerCase() === "patient" ? payerPatientId || undefined : undefined,
            mobileMoneyPhone: payerPhone || undefined,
            currency: currencyInput,
            active: true,
          },
        },
      }),
    );
  }

  function handleAssignPayer(event: FormEvent) {
    event.preventDefault();
    if (!enrolmentId.trim() || !payerId.trim() || !priceId.trim()) return;
    void run(() =>
      assignPayer({
        variables: {
          enrolmentId: enrolmentId.trim(),
          payerId: payerId.trim(),
          priceId: priceId.trim(),
          data: { billingStartDate: periodStart || undefined, nextBillingDate: periodStart || undefined },
        },
      }),
    );
  }

  function handleGenerateInvoice(event: FormEvent) {
    event.preventDefault();
    if (!enrolmentId.trim()) return;
    void run(() =>
      generateInvoice({
        variables: {
          enrolmentId: enrolmentId.trim(),
          periodStart: periodStart || undefined,
          periodEnd: periodEnd || undefined,
          issue: true,
        },
      }),
    );
  }

  if (summaryQuery.loading && !summary) {
    return <div className="h-96 animate-pulse rounded-lg bg-border/40" />;
  }

  if (summaryQuery.error || !summary) {
    return (
      <Panel>
        <PanelBody className="flex items-center gap-3 text-warning">
          <AlertTriangle className="size-5" />
          <p className="text-sm">Unable to load programme billing summary.</p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Collected"
          value={money(collected, currency)}
          sublabel={`${summary.invoicesPaid} paid invoices`}
          icon={ReceiptText}
          tone="success"
        />
        <StatTile
          label="Outstanding"
          value={money(outstanding, currency)}
          sublabel={`${summary.invoicesOverdue} overdue invoices`}
          icon={ReceiptText}
          tone={summary.invoicesOverdue > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label="Billing Setup"
          value={summary.pendingBillingSetup}
          sublabel={`${summary.activeBillableEnrolments} active billable enrolments`}
          icon={ReceiptText}
          tone={summary.pendingBillingSetup > 0 ? "warning" : "success"}
        />
        <StatTile
          label="Entitlements"
          value={summary.entitlementsActive}
          sublabel={`${summary.entitlementsInGrace} in grace`}
          icon={ReceiptText}
          tone={summary.entitlementsCommerciallySuspended > 0 ? "warning" : "success"}
        />
      </div>

      {workflow === "overview" ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={CreditCard}>Billing workflows</PanelTitle>
            <div className="flex flex-wrap gap-2">
              <Button href="/consultant/billing/prices" size="sm">Manage prices</Button>
              <Button href="/consultant/billing/payers" size="sm" variant="secondary">Set up payers</Button>
              <Button href="/consultant/billing/invoices" size="sm" variant="secondary">Issue invoices</Button>
              <Button href="/consultant/billing/payments" size="sm" variant="secondary">Refresh payments</Button>
            </div>
          </PanelHeader>
        </Panel>
      ) : null}

      {showAdminPanel ? (
      <Panel>
        <PanelHeader>
          <PanelTitle icon={CreditCard}>
            {showPriceWorkflow ? "Programme price setup" : showPayerWorkflow ? "Payer setup" : showInvoiceWorkflow ? "Invoice workflow" : "Payment status refresh"}
          </PanelTitle>
        </PanelHeader>
        <PanelBody className="space-y-5">
          {adminError ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{adminError}</p> : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <SearchableSelector
              id="billing-programme"
              label="Programme"
              value={programmeId}
              options={programmeOptions}
              placeholder="Search programme"
              emptyLabel={programmesQuery.loading ? "Loading programmes..." : "No programmes found"}
              onChange={(nextProgrammeId) => {
                setProgrammeId(nextProgrammeId);
                setEnrolmentId("");
                setPriceId("");
              }}
            />
            <SearchableSelector
              id="billing-enrolment"
              label="Enrolment"
              value={enrolmentId}
              options={enrolmentOptions}
              placeholder="Select patient enrolment"
              emptyLabel={!programmeId ? "Select a programme first" : enrolmentsQuery.loading ? "Loading enrolments..." : "No enrolments found"}
              onChange={setEnrolmentId}
            />
            <SearchableSelector
              id="billing-payer"
              label="Payer"
              value={payerId}
              options={payerOptions}
              placeholder="Search payer"
              emptyLabel={payersQuery.loading ? "Loading payers..." : "No payers found"}
              onChange={setPayerId}
            />
            <SearchableSelector
              id="billing-price-id"
              label="Price"
              value={priceId}
              options={priceOptions}
              placeholder="Select programme price"
              emptyLabel={!programmeId ? "Select a programme first" : pricesQuery.loading ? "Loading prices..." : "No prices found"}
              onChange={setPriceId}
            />
          </div>

          {showPriceWorkflow ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <form onSubmit={handleCreatePrice} className="space-y-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Monthly programme price</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={priceName} onChange={(event) => setPriceName(event.target.value)} placeholder="Price name" />
                <Input value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Amount" />
                <Input value={currencyInput} onChange={(event) => setCurrencyInput(event.target.value)} placeholder="Currency" />
                <Input value={billingModel} onChange={(event) => setBillingModel(event.target.value)} placeholder="subscription, package" />
                <Input value={billingInterval} onChange={(event) => setBillingInterval(event.target.value)} placeholder="monthly, once" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={!canManageBilling || saving || !programmeId.trim() || !priceName.trim() || !amount.trim()}>
                  Create price
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={!canManageBilling || saving || !priceId.trim()} onClick={() => void run(() => deactivatePrice({ variables: { priceId: priceId.trim() } }))}>
                  Deactivate price
                </Button>
              </div>
            </form>
          </div>
          ) : null}

          {showPayerWorkflow ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <form onSubmit={handleCreatePayer} className="space-y-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Who pays for this care</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <SearchableSelector
                  id="payer-organization"
                  label="Clinic organization"
                  value={organizationId}
                  options={organizationOptions}
                  placeholder="Select clinic"
                  emptyLabel="No clinic organizations found in your session"
                  disabled={!canManageBilling}
                  onChange={setOrganizationId}
                />
                <SearchableSelector
                  id="payer-patient"
                  label="Patient payer"
                  value={payerPatientId}
                  options={patientOptions}
                  placeholder="Search patient"
                  emptyLabel={patientsQuery.loading ? "Loading patients..." : "No patients found"}
                  disabled={!canManageBilling || payerType.toLowerCase() !== "patient"}
                  onChange={setPayerPatientId}
                />
                <Input value={payerType} onChange={(event) => setPayerType(event.target.value)} placeholder="patient, sponsor, employer" />
                <Input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="Display name" />
                <Input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} placeholder="Mobile money phone" />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={!canManageBilling || saving || !organizationId.trim() || (payerType.toLowerCase() === "patient" && !payerPatientId)}>
                Create payer
              </Button>
            </form>
          </div>
          ) : null}

          {showInvoiceWorkflow ? (
          <div className="grid gap-5 xl:grid-cols-2">
            <form onSubmit={handleAssignPayer} className="space-y-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Attach payment setup to patient</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input type="date" value={periodStart} onChange={(event) => setPeriodStart(event.target.value)} />
                <Input type="date" value={periodEnd} onChange={(event) => setPeriodEnd(event.target.value)} />
              </div>
              <Button type="submit" size="sm" disabled={!canManageBilling || saving || !enrolmentId.trim() || !payerId.trim() || !priceId.trim()}>
                Assign payer
              </Button>
            </form>

            <form onSubmit={handleGenerateInvoice} className="space-y-3 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Request payment</p>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason used if an invoice is later cancelled or voided" className="min-h-16" />
              <Button type="submit" size="sm" disabled={!canManageBilling || saving || !enrolmentId.trim()}>
                Create payment request
              </Button>
            </form>
          </div>
          ) : null}

          {showPaymentWorkflow ? (
          <div className="rounded-lg border border-border bg-background p-3">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Payment status</p>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <SearchableSelector
                id="payment-intent"
                label="Payment intent"
                value={paymentId}
                options={paymentIntentOptions}
                placeholder="Search payment intent"
                emptyLabel={paymentIntentsQuery.loading ? "Loading payment intents..." : "No payment intents found"}
                onChange={setPaymentId}
              />
              <Button type="button" size="sm" variant="secondary" disabled={!paymentId.trim()} onClick={() => void paymentIntentQuery.refetch()}>
                Refresh status
              </Button>
            </div>
            {paymentIntentQuery.data?.programmePaymentIntent ? (
              <p className="mt-3 text-sm text-muted">
                {paymentIntentQuery.data.programmePaymentIntent.status} · {money(paymentIntentQuery.data.programmePaymentIntent.amount, paymentIntentQuery.data.programmePaymentIntent.currency)} · {titleCase(paymentIntentQuery.data.programmePaymentIntent.method)}
              </p>
            ) : null}
          </div>
          ) : null}
        </PanelBody>
      </Panel>
      ) : null}

      {showPricesList ? (
      <Panel>
        <PanelHeader>
          <PanelTitle icon={ReceiptText} count={prices.length}>Programme Prices</PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void pricesQuery.refetch()}>
            Refresh
          </Button>
        </PanelHeader>
        {prices.length === 0 ? (
          <PanelEmpty>No programme prices found for the current filter.</PanelEmpty>
        ) : (
          <PanelList>
            {prices.map((price) => (
              <button key={price.id} type="button" onClick={() => setPriceId(price.id)} className="block w-full px-5 py-4 text-left transition-colors hover:bg-background">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-words text-sm font-semibold text-text">{price.name}</p>
                  <Badge variant={price.active ? "success" : "secondary"}>{price.active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{money(price.amount, price.currency)} · {titleCase(price.billingModel)} · {titleCase(price.billingInterval)}</p>
              </button>
            ))}
          </PanelList>
        )}
      </Panel>
      ) : null}

      {showInvoicesList ? (
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
          <PanelEmpty>No programme invoices have been generated yet.</PanelEmpty>
        ) : (
          <PanelList>
            {invoices.map((invoice) => (
              <div key={invoice.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="break-all text-sm font-semibold text-text">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(invoice.billingPeriodStart)} to {formatDate(invoice.billingPeriodEnd)}
                    </p>
                    <p className="mt-1 break-words text-xs text-muted">{invoice.payer.displayName}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-text">{money(invoice.balance, invoice.currency)}</p>
                    <Badge className="mt-2" variant={statusVariant(invoice.status)}>
                      {titleCase(invoice.status)}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" disabled={!canManageBilling || saving || invoice.status !== "DRAFT"} onClick={() => void run(() => issueInvoice({ variables: { invoiceId: invoice.id } }))}>
                    Issue
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={!canManageBilling || saving || !reason.trim() || !["DRAFT", "ISSUED"].includes(invoice.status)} onClick={() => void run(() => cancelInvoice({ variables: { invoiceId: invoice.id, reason } }))}>
                    Cancel
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={!canManageBilling || saving || !reason.trim() || invoice.status === "VOID"} onClick={() => void run(() => voidInvoice({ variables: { invoiceId: invoice.id, reason } }))}>
                    Void
                  </Button>
                </div>
              </div>
            ))}
          </PanelList>
        )}
      </Panel>
      ) : null}
    </div>
  );
}
