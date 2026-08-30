"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle2, Clock, ReceiptText } from "lucide-react";
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
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import {
  MY_CURRENT_PROGRAMME_ENROLMENT_QUERY,
  MY_MONITORING_SCHEDULE_QUERY,
  MY_NEXT_EXPECTED_READINGS_QUERY,
  MY_PROGRAMME_ENTITLEMENTS_QUERY,
  MY_PROGRAMME_INVOICES_QUERY,
  PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  type ExpectedMonitoringWindow,
  type ProgrammeBaselineAssessment,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeEntitlement,
  type ProgrammeInvoicePage,
} from "@/lib/programmes/graphql";
import { Icons } from "@/components/ui/icons";

type EnrolmentData = {
  myCurrentProgrammeEnrolment: ProgrammeEnrolment | null;
};

type BaselineData = {
  programmeCurrentBaseline: ProgrammeBaselineAssessment | null;
};

type CarePlanData = {
  programmeCurrentCarePlan: ProgrammeCarePlan | null;
};

type NextReadingsData = {
  myNextExpectedReadings: ExpectedMonitoringWindow[];
};

type ScheduleData = {
  myMonitoringSchedule: {
    enrolmentId: string;
    programmeName: string;
    requirements: {
      id: string;
      observationType: string;
      observationContext?: string | null;
      cadenceType: string;
      intervalDays?: number | null;
      timeOfDay?: string | null;
      gracePeriodDays?: number | null;
      source: string;
    }[];
  }[];
};

type InvoicesData = {
  myProgrammeInvoices: ProgrammeInvoicePage;
};

type EntitlementsData = {
  myProgrammeEntitlements: ProgrammeEntitlement[];
};

type AdherenceData = {
  patientMonitoringAdherenceSummary: {
    counts: string;
    openGapCount: number;
    consecutiveMissedCount: number;
  };
};

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "APPROVED" || normalized === "SATISFIED" || normalized === "PAID") {
    return "success" as const;
  }
  if (normalized === "MISSED" || normalized === "OVERDUE" || normalized === "COMMERCIALLY_SUSPENDED") {
    return "danger" as const;
  }
  if (normalized === "DUE" || normalized === "ISSUED" || normalized === "PARTIALLY_PAID" || normalized === "IN_GRACE") {
    return "warning" as const;
  }
  return "secondary" as const;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function money(amount: string, currency: string) {
  const value = Number(amount);
  if (Number.isNaN(value)) return `${currency} ${amount}`;
  try {
    return new Intl.NumberFormat("en-ZM", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function isTodayOrOverdue(value: string) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return due <= endOfToday;
}

function TodayReadingsPanel({
  readings,
  onLogged,
}: {
  readings: ExpectedMonitoringWindow[];
  onLogged: () => void;
}) {
  const [mode, setMode] = useState<"glucose" | "vitals">("glucose");
  const actionableReadings = readings.filter(
    (reading) => reading.status !== "SATISFIED" && isTodayOrOverdue(reading.dueAt),
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.monitoring} count={actionableReadings.length} countTone="warning">
          Today&apos;s Monitoring
        </PanelTitle>
        <Button href="/patient/monitoring" size="sm" variant="secondary">Full log</Button>
      </PanelHeader>
      <PanelBody className="space-y-5">
        {actionableReadings.length === 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            No readings are due before the end of today.
          </div>
        ) : (
          <div className="space-y-2">
            {actionableReadings.slice(0, 4).map((reading) => (
              <div key={reading.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {titleCase(reading.observationContext ?? reading.observationType)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Due {formatDateTime(reading.dueAt)}</p>
                </div>
                <Badge variant={statusVariant(reading.status)}>{titleCase(reading.status)}</Badge>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-b border-border pb-3">
          <button
            type="button"
            onClick={() => setMode("glucose")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "glucose" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
            }`}
          >
            Glucose
          </button>
          <button
            type="button"
            onClick={() => setMode("vitals")}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === "vitals" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
            }`}
          >
            Vitals
          </button>
        </div>

        {mode === "glucose" ? <GlucoseLogForm onSuccess={onLogged} /> : <VitalsLogForm onSuccess={onLogged} />}
      </PanelBody>
    </Panel>
  );
}

function CarePlanPanel({ carePlan }: { carePlan: ProgrammeCarePlan | null }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.records}>Care Plan</PanelTitle>
        <Badge variant={statusVariant(carePlan?.status)}>{titleCase(carePlan?.status)}</Badge>
      </PanelHeader>
      {!carePlan ? (
        <PanelEmpty>Your clinic has not activated a programme care plan yet.</PanelEmpty>
      ) : (
        <PanelBody className="space-y-3">
          <p className="text-sm font-semibold text-text">{carePlan.title}</p>
          {carePlan.summary ? <p className="text-sm leading-6 text-muted">{carePlan.summary}</p> : null}
          {carePlan.patientInstructions ? (
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-muted">
              {carePlan.patientInstructions}
            </div>
          ) : null}
          {carePlan.expectedReviewAt ? (
            <p className="text-xs text-muted">Next review: {formatDateTime(carePlan.expectedReviewAt)}</p>
          ) : null}
        </PanelBody>
      )}
    </Panel>
  );
}

function ProgrammeTasksPanel({
  enrolment,
  baseline,
  carePlan,
  openInvoiceCount,
}: {
  enrolment: ProgrammeEnrolment;
  baseline: ProgrammeBaselineAssessment | null;
  carePlan: ProgrammeCarePlan | null;
  openInvoiceCount: number;
}) {
  const tasks = [
    {
      id: "baseline",
      label: "Complete diabetes baseline",
      done: baseline?.status === "APPROVED",
      href: "/patient/pcq/baseline",
    },
    {
      id: "care-plan",
      label: "Review care plan",
      done: carePlan?.status === "ACTIVE",
      href: "/patient/dashboard",
    },
    {
      id: "billing",
      label: "Settle programme invoice",
      done: openInvoiceCount === 0,
      href: "/patient/payments",
    },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.actionRequired}>Care Tasks</PanelTitle>
        <Badge variant={statusVariant(enrolment.status)}>{titleCase(enrolment.status)}</Badge>
      </PanelHeader>
      <PanelList>
        {tasks.map((task) => (
          <Link key={task.id} href={task.href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-background">
            <div className="flex min-w-0 items-center gap-3">
              {task.done ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <Clock className="size-5 shrink-0 text-warning" />}
              <p className="truncate text-sm font-medium text-text">{task.label}</p>
            </div>
            <Badge variant={task.done ? "success" : "warning"}>{task.done ? "Done" : "Due"}</Badge>
          </Link>
        ))}
      </PanelList>
    </Panel>
  );
}

function SchedulePanel({ schedule }: { schedule: ScheduleData["myMonitoringSchedule"] }) {
  const requirements = schedule.flatMap((item) =>
    item.requirements.map((requirement) => ({
      ...requirement,
      programmeName: item.programmeName,
    })),
  );

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.time} count={requirements.length}>Schedule</PanelTitle>
      </PanelHeader>
      {requirements.length === 0 ? (
        <PanelEmpty>No programme monitoring schedule has been configured yet.</PanelEmpty>
      ) : (
        <PanelList>
          {requirements.slice(0, 6).map((requirement) => (
            <div key={requirement.id} className="px-5 py-4">
              <p className="text-sm font-semibold text-text">
                {titleCase(requirement.observationContext ?? requirement.observationType)}
              </p>
              <p className="mt-1 text-xs text-muted">
                {requirement.programmeName} · {titleCase(requirement.cadenceType)}
                {requirement.timeOfDay ? ` · ${requirement.timeOfDay}` : ""}
              </p>
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function BillingPanel({
  invoices,
  entitlements,
}: {
  invoices: ProgrammeInvoicePage | undefined;
  entitlements: ProgrammeEntitlement[];
}) {
  const openInvoices = invoices?.items.filter((invoice) => Number(invoice.balance) > 0) ?? [];
  const openTotal = openInvoices.reduce((sum, invoice) => sum + (Number(invoice.balance) || 0), 0);
  const currency = openInvoices[0]?.currency ?? invoices?.items[0]?.currency ?? "ZMW";
  const activeEntitlement = entitlements.find((entitlement) => entitlement.status === "ACTIVE");

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={ReceiptText}>Billing And Access</PanelTitle>
        <Button href="/patient/payments" size="sm" variant="secondary">Open billing</Button>
      </PanelHeader>
      <PanelBody className="space-y-4">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Programme entitlement</p>
            <p className="mt-1 text-xs text-muted">
              {activeEntitlement ? "Your programme access is active." : "No active entitlement is currently recorded."}
            </p>
          </div>
          <Badge variant={statusVariant(activeEntitlement?.status)}>{titleCase(activeEntitlement?.status)}</Badge>
        </div>
        {openInvoices.length > 0 ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <p className="text-sm font-semibold text-warning">{money(openTotal.toFixed(2), currency)} outstanding</p>
            <p className="mt-1 text-xs text-muted">{openInvoices.length} programme invoice{openInvoices.length === 1 ? "" : "s"} need payment.</p>
          </div>
        ) : (
          <p className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            No outstanding programme invoice balance.
          </p>
        )}
      </PanelBody>
    </Panel>
  );
}

export function PatientDiabetesHome() {
  const enrolmentQuery = useQuery<EnrolmentData>(MY_CURRENT_PROGRAMME_ENROLMENT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const enrolment = enrolmentQuery.data?.myCurrentProgrammeEnrolment ?? null;
  const enrolmentId = enrolment?.id;

  const baselineQuery = useQuery<BaselineData>(PROGRAMME_CURRENT_BASELINE_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const carePlanQuery = useQuery<CarePlanData>(PROGRAMME_CURRENT_CARE_PLAN_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const nextReadingsQuery = useQuery<NextReadingsData>(MY_NEXT_EXPECTED_READINGS_QUERY, {
    variables: { limit: 8 },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const scheduleQuery = useQuery<ScheduleData>(MY_MONITORING_SCHEDULE_QUERY, {
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const invoicesQuery = useQuery<InvoicesData>(MY_PROGRAMME_INVOICES_QUERY, {
    variables: { limit: 10 },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const entitlementsQuery = useQuery<EntitlementsData>(MY_PROGRAMME_ENTITLEMENTS_QUERY, {
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const adherenceQuery = useQuery<AdherenceData>(PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });

  const baseline = baselineQuery.data?.programmeCurrentBaseline ?? null;
  const carePlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const nextReadings = useMemo(
    () => nextReadingsQuery.data?.myNextExpectedReadings ?? [],
    [nextReadingsQuery.data?.myNextExpectedReadings],
  );
  const schedule = scheduleQuery.data?.myMonitoringSchedule ?? [];
  const invoices = invoicesQuery.data?.myProgrammeInvoices;
  const entitlements = entitlementsQuery.data?.myProgrammeEntitlements ?? [];
  const openInvoiceCount = invoices?.items.filter((invoice) => Number(invoice.balance) > 0).length ?? 0;
  const actionableReadings = useMemo(
    () => nextReadings.filter((reading) => reading.status !== "SATISFIED" && isTodayOrOverdue(reading.dueAt)),
    [nextReadings],
  );

  function refetchCareData() {
    void nextReadingsQuery.refetch();
    void adherenceQuery.refetch();
  }

  if (enrolmentQuery.loading && !enrolment) {
    return <div className="h-96 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <Panel>
        <PanelBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-text">No diabetes programme enrolment yet</p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Your clinic will enrol you before daily diabetes care tasks appear here.
              </p>
            </div>
          </div>
          <Button href="/patient/monitoring" variant="secondary">Log a reading</Button>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Panel>
        <PanelBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              {enrolment.programme.name}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-text">Your Diabetes Care Today</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Complete due monitoring, review your care plan, and keep programme billing current.
            </p>
          </div>
          <Badge variant={statusVariant(enrolment.status)}>{titleCase(enrolment.status)}</Badge>
        </PanelBody>
      </Panel>

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Due Today"
          value={actionableReadings.length}
          sublabel="monitoring tasks"
          icon={Icons.monitoring}
          tone={actionableReadings.length > 0 ? "warning" : "success"}
        />
        <StatTile
          label="Open Gaps"
          value={adherenceQuery.data?.patientMonitoringAdherenceSummary.openGapCount ?? 0}
          sublabel="missed monitoring"
          icon={Icons.warning}
          tone={(adherenceQuery.data?.patientMonitoringAdherenceSummary.openGapCount ?? 0) > 0 ? "danger" : "neutral"}
        />
        <StatTile
          label="Invoices"
          value={openInvoiceCount}
          sublabel="with balance due"
          icon={ReceiptText}
          tone={openInvoiceCount > 0 ? "warning" : "success"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <TodayReadingsPanel readings={nextReadings} onLogged={refetchCareData} />
        <div className="space-y-6">
          <ProgrammeTasksPanel
            enrolment={enrolment}
            baseline={baseline}
            carePlan={carePlan}
            openInvoiceCount={openInvoiceCount}
          />
          <CarePlanPanel carePlan={carePlan} />
          <SchedulePanel schedule={schedule} />
          <BillingPanel invoices={invoices} entitlements={entitlements} />
        </div>
      </div>
    </div>
  );
}
