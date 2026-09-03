"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CalendarCheck2, CalendarRange, CheckCircle2, Clock, ReceiptText, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
  ViewAllLink,
} from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { GlucoseHeroBand } from "@/components/patient/dashboard/GlucoseHeroBand";
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import {
  MY_CURRENT_PROGRAMME_ENROLMENT_QUERY,
  MY_MONITORING_SCHEDULE_QUERY,
  MY_NEXT_EXPECTED_READINGS_QUERY,
  MY_PROGRAMME_SCHEDULE_QUERY,
  MY_PROGRAMME_ENTITLEMENTS_QUERY,
  MY_PROGRAMME_INVOICES_QUERY,
  MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION,
  PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  type ExpectedMonitoringWindow,
  type ProgrammeBaselineAssessment,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeEntitlement,
  type ProgrammeInvoicePage,
  type ProgrammeScheduleItem,
} from "@/lib/programmes/graphql";
import { labelForChoice, PROGRAMME_CARE_TEAM_ROLE_OPTIONS, PROGRAMME_MONITORING_CADENCE_TYPE_OPTIONS } from "@/lib/programmes/choices";
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

type CareJourneyData = {
  myProgrammeSchedule: ProgrammeScheduleItem[];
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

function formatDate(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
  });
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  const startLabel = formatDate(start);
  if (!end || end === start) return startLabel;
  return `${startLabel} - ${formatDate(end)}`;
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

function isDueDate(value: string) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return due <= today;
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
  const [logModalOpen, setLogModalOpen] = useState(false);
  const actionableReadings = readings.filter(
    (reading) => reading.status !== "SATISFIED" && isTodayOrOverdue(reading.dueAt),
  );

  return (
    <Panel>
      <PanelHeader className="flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <PanelTitle icon={Icons.monitoring} count={actionableReadings.length} countTone="warning">
          Today&apos;s Monitoring
        </PanelTitle>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
          <Button type="button" size="sm" className="h-10 rounded-full" onClick={() => setLogModalOpen(true)}>
            Log reading
          </Button>
          <Button href="/patient/monitoring" size="sm" variant="secondary" className="h-10 rounded-full">
            Full log
          </Button>
        </div>
      </PanelHeader>
      <PanelBody className="space-y-5">
        {actionableReadings.length === 0 ? (
          <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            No readings are due before the end of today.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {actionableReadings.slice(0, 4).map((reading) => (
              <div key={reading.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    {titleCase(reading.observationContext ?? reading.observationType)}
                  </p>
                  <p className="mt-1 text-xs text-muted">Due {formatDateTime(reading.dueAt)}</p>
                </div>
                <StatusBadge tone={toneForLifecycleStatus(reading.status)} label={titleCase(reading.status)} size="sm" />
              </div>
            ))}
          </div>
        )}
      </PanelBody>
      {logModalOpen ? (
        <DetailModal
          title="Log reading"
          subtitle="Record today's programme monitoring"
          onClose={() => setLogModalOpen(false)}
          className="sm:max-w-2xl"
          footer={
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogModalOpen(false)}>
                <X className="size-4" />
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
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
            {mode === "glucose" ? (
              <GlucoseLogForm
                onSuccess={() => {
                  onLogged();
                  setLogModalOpen(false);
                }}
              />
            ) : (
              <VitalsLogForm
                onSuccess={() => {
                  onLogged();
                  setLogModalOpen(false);
                }}
              />
            )}
          </div>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

function CarePlanPanel({ carePlan, enrolmentId }: { carePlan: ProgrammeCarePlan | null; enrolmentId: string }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.records}>Care Plan</PanelTitle>
        <div className="flex items-center gap-3">
          <StatusBadge tone={toneForLifecycleStatus(carePlan?.status)} label={titleCase(carePlan?.status)} />
          <ViewAllLink href={`/patient/programmes/${enrolmentId}`}>Full plan</ViewAllLink>
        </div>
      </PanelHeader>
      {!carePlan ? (
        <PanelEmpty>Your clinic has not activated a programme care plan yet.</PanelEmpty>
      ) : (
        <PanelBody className="space-y-3">
          <p className="break-words text-sm font-semibold text-text">{carePlan.title}</p>
          {carePlan.summary ? <p className="break-words text-sm leading-6 text-muted">{carePlan.summary}</p> : null}
          {carePlan.patientInstructions ? (
            <div className="break-words rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-muted">
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
        <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
      </PanelHeader>
      <PanelList>
        {tasks.map((task) => (
          <Link key={task.id} href={task.href} className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-background">
            <div className="flex min-w-0 items-center gap-3">
              {task.done ? <CheckCircle2 className="size-5 shrink-0 text-success" /> : <Clock className="size-5 shrink-0 text-warning" />}
              <p className="break-words text-sm font-medium text-text">{task.label}</p>
            </div>
            <StatusBadge tone={task.done ? "success" : "warning"} label={task.done ? "Done" : "Due"} size="sm" />
          </Link>
        ))}
      </PanelList>
    </Panel>
  );
}

function WhatsNextPanel({
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
  const steps = [
    {
      label: "Create your patient account",
      detail: "Your programme enrolment is connected to this dashboard.",
      done: true,
      href: "/patient/dashboard",
    },
    {
      label: "Confirm your diabetes baseline",
      detail: baseline?.status === "APPROVED" ? "Your baseline has been reviewed." : "Share your current history and readings context.",
      done: baseline?.status === "APPROVED",
      href: "/patient/pcq/baseline",
    },
    {
      label: "Review your care plan",
      detail: carePlan?.status === "ACTIVE" ? "Your active plan is ready." : "Your clinic will publish this after review.",
      done: carePlan?.status === "ACTIVE",
      href: "/patient/dashboard",
    },
    {
      label: "Book your programme consultant",
      detail: enrolment.leadProvider ? `Lead consultant: ${enrolment.leadProvider.displayName ?? "Assigned consultant"}` : "A lead consultant will appear here when assigned.",
      done: Boolean(enrolment.leadProvider),
      href: enrolment.leadProvider ? `/patient/providers/${enrolment.leadProvider.id}/book` : "/patient/consultants",
    },
    {
      label: "Settle programme billing",
      detail: openInvoiceCount > 0 ? `${openInvoiceCount} invoice${openInvoiceCount === 1 ? "" : "s"} need attention.` : "No outstanding programme balance.",
      done: openInvoiceCount === 0,
      href: "/patient/payments",
    },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarCheck2}>What Happens Next</PanelTitle>
        <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
      </PanelHeader>
      <PanelList>
        {steps.map((step) => (
          <Link key={step.label} href={step.href} className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-background">
            {step.done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" /> : <Clock className="mt-0.5 size-5 shrink-0 text-warning" />}
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-text">{step.label}</p>
              <p className="mt-1 break-words text-xs leading-5 text-muted">{step.detail}</p>
            </div>
          </Link>
        ))}
      </PanelList>
    </Panel>
  );
}

function CareTeamPanel({ enrolment }: { enrolment: ProgrammeEnrolment }) {
  const activeAssignments = enrolment.careTeamAssignments.filter((assignment) => assignment.active);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Stethoscope} count={activeAssignments.length + (enrolment.leadProvider ? 1 : 0)}>
          Meet Your Care Team
        </PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-3">
        {enrolment.leadProvider ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-text">{enrolment.leadProvider.displayName ?? "Lead consultant"}</p>
              <p className="mt-1 text-xs text-muted">Lead consultant</p>
            </div>
            <Button href={`/patient/providers/${enrolment.leadProvider.id}/book`} size="sm" variant="secondary">
              Book
            </Button>
          </div>
        ) : (
          <p className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted">
            Your clinic has not assigned a lead consultant yet.
          </p>
        )}
        {activeAssignments.length > 0 ? (
          <div className="divide-y divide-border rounded-lg border border-border bg-background">
            {activeAssignments.map((assignment) => (
              <div key={assignment.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-text">{assignment.provider?.displayName ?? "Care team member"}</p>
                  <p className="mt-1 text-xs text-muted">{labelForChoice(PROGRAMME_CARE_TEAM_ROLE_OPTIONS, assignment.role, titleCase(assignment.role))}</p>
                </div>
                {assignment.provider ? (
                  <Button href={`/patient/providers/${assignment.provider.id}/book`} size="sm" variant="ghost">
                    Book
                  </Button>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </PanelBody>
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
                {requirement.programmeName} | {labelForChoice(PROGRAMME_MONITORING_CADENCE_TYPE_OPTIONS, requirement.cadenceType)}
                {requirement.timeOfDay ? ` · ${requirement.timeOfDay}` : ""}
              </p>
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function CareJourneyPanel({
  items,
  onChanged,
}: {
  items: ProgrammeScheduleItem[];
  onChanged: () => void;
}) {
  const [markDone, markState] = useMutation(MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION);
  const actionable = items.filter((item) => !["DONE", "SKIPPED", "CANCELLED"].includes(item.status));
  const dueNow = actionable.filter((item) => isDueDate(item.scheduledDate));
  const upcoming = actionable.filter((item) => !isDueDate(item.scheduledDate)).slice(0, 5);
  const visible = [...dueNow, ...upcoming].slice(0, 7);
  const completedCount = items.filter((item) => item.status === "DONE").length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  async function complete(itemId: string) {
    await markDone({ variables: { itemId } });
    onChanged();
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={items.length}>Care Journey</PanelTitle>
      </PanelHeader>
      {visible.length === 0 ? (
        <PanelEmpty>Your dated care plan calendar will appear after your consultant activates your care plan.</PanelEmpty>
      ) : (
        <>
          <PanelBody className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatTile label="Due now" value={dueNow.length} tone={dueNow.length ? "warning" : "success"} />
              <StatTile label="Completed" value={completedCount} tone="success" />
              <StatTile label="Progress" value={`${progress}%`} />
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-border">
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
          </PanelBody>
          <PanelList>
            {visible.map((item, index) => (
              <div key={item.id} className="grid grid-cols-[28px_1fr] gap-3 px-5 py-4">
                <div className="flex flex-col items-center">
                  <span className={`mt-1 size-3 rounded-full ${isDueDate(item.scheduledDate) ? "bg-warning" : "bg-primary"}`} />
                  {index < visible.length - 1 ? <span className="mt-2 min-h-16 w-px flex-1 bg-border" /> : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={isDueDate(item.scheduledDate) ? "warning" : toneForLifecycleStatus(item.status)}
                        label={
                          item.dayNumber && item.scheduledEndDate && item.scheduledEndDate !== item.scheduledDate
                            ? `Day ${item.dayNumber}+`
                            : item.dayNumber
                              ? `Day ${item.dayNumber}`
                              : titleCase(item.status)
                        }
                        size="sm"
                      />
                      <p className="text-xs text-muted">{formatDateRange(item.scheduledDate, item.scheduledEndDate)}</p>
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-text">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {titleCase(item.eventType)}
                      {item.provider?.displayName ? ` | ${item.provider.displayName}` : ""}
                    </p>
                    {item.description ? <p className="mt-2 text-xs leading-5 text-muted">{item.description}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.eventType === "MEASUREMENT_TASK" ? (
                      <Button href="/patient/monitoring" size="sm">
                        Log reading
                      </Button>
                    ) : null}
                    {item.eventType === "VIDEO_CONSULTATION" || item.eventType === "CONSULTANT_REVIEW" ? (
                      <Button href={item.provider?.id ? `/patient/providers/${item.provider.id}/book` : "/patient/appointments"} size="sm">
                        Book
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={markState.loading}
                      onClick={() => void complete(item.id)}
                    >
                      <CheckCircle2 className="size-4" />
                      Done
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </PanelList>
        </>
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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <p className="text-sm font-semibold text-text">Programme entitlement</p>
          <StatusBadge
            tone={toneForLifecycleStatus(activeEntitlement?.status)}
            label={titleCase(activeEntitlement?.status)}
          />
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
  const careJourneyQuery = useQuery<CareJourneyData>(MY_PROGRAMME_SCHEDULE_QUERY, {
    variables: { enrolmentId },
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
  const careJourney = careJourneyQuery.data?.myProgrammeSchedule ?? [];
  const invoices = invoicesQuery.data?.myProgrammeInvoices;
  const entitlements = entitlementsQuery.data?.myProgrammeEntitlements ?? [];
  const openInvoiceCount = invoices?.items.filter((invoice) => Number(invoice.balance) > 0).length ?? 0;
  const actionableReadings = useMemo(
    () => nextReadings.filter((reading) => reading.status !== "SATISFIED" && isTodayOrOverdue(reading.dueAt)),
    [nextReadings],
  );

  function refetchCareData() {
    void nextReadingsQuery.refetch();
    void careJourneyQuery.refetch();
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
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
          {enrolment.programme.name}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {enrolment.leadProvider ? (
            <Button href={`/patient/providers/${enrolment.leadProvider.id}/book`} size="sm">
              Book consultant
            </Button>
          ) : null}
          <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
        </div>
      </section>

      <GlucoseHeroBand />

      <div className="grid gap-4 md:grid-cols-3">
        <StatTile
          label="Due Today"
          value={actionableReadings.length}
          sublabel="monitoring tasks"
          icon={Icons.monitoring}
          tone={actionableReadings.length > 0 ? "warning" : "success"}
          tint={actionableReadings.length > 0}
        />
        <StatTile
          label="Open Gaps"
          value={adherenceQuery.data?.patientMonitoringAdherenceSummary.openGapCount ?? 0}
          sublabel="missed monitoring"
          icon={Icons.warning}
          tone={(adherenceQuery.data?.patientMonitoringAdherenceSummary.openGapCount ?? 0) > 0 ? "danger" : "neutral"}
          tint={(adherenceQuery.data?.patientMonitoringAdherenceSummary.openGapCount ?? 0) > 0}
        />
        <StatTile
          label="Invoices"
          value={openInvoiceCount}
          sublabel="with balance due"
          icon={ReceiptText}
          tone={openInvoiceCount > 0 ? "warning" : "success"}
          tint={openInvoiceCount > 0}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <WhatsNextPanel
            enrolment={enrolment}
            baseline={baseline}
            carePlan={carePlan}
            openInvoiceCount={openInvoiceCount}
          />
          <CareJourneyPanel items={careJourney} onChanged={refetchCareData} />
          <TodayReadingsPanel readings={nextReadings} onLogged={refetchCareData} />
        </div>
        <div className="space-y-6">
          <CareTeamPanel enrolment={enrolment} />
          <ProgrammeTasksPanel enrolment={enrolment} baseline={baseline} carePlan={carePlan} openInvoiceCount={openInvoiceCount} />
          <CarePlanPanel carePlan={carePlan} enrolmentId={enrolment.id} />
          <SchedulePanel schedule={schedule} />
          <BillingPanel invoices={invoices} entitlements={entitlements} />
        </div>
      </div>
    </div>
  );
}
