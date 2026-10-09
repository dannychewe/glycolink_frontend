"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  CheckCircle2,
  Clock,
  Dumbbell,
  History,
  LockKeyhole,
  RefreshCw,
  Stethoscope,
  Target,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
} from "@/components/ui/panel";
import {
  StatusBadge,
  toneForLifecycleStatus,
} from "@/components/design-system";
import { Icons } from "@/components/ui/icons";
import { titleCase, formatDate } from "@/lib/utils/format";
import {
  labelForChoice,
  PROGRAMME_CARE_TEAM_ROLE_OPTIONS,
  PROGRAMME_MONITORING_CADENCE_TYPE_OPTIONS,
} from "@/lib/programmes/choices";
import {
  PROGRAMME_ENROLMENT_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  PROGRAMME_CARE_PLAN_HISTORY_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  PROGRAMME_ENROLMENT_READINESS_QUERY,
  PROGRAMME_SCHEDULE_QUERY,
  EFFECTIVE_MONITORING_REQUIREMENTS_QUERY,
  CARE_PLAN_PROGRAMMES_QUERY,
  MY_PROGRAMME_INVOICES_QUERY,
  ENSURE_PATIENT_PAYABLE_PROGRAMME_INVOICE_MUTATION,
  type CarePlanProgramme,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeBaselineAssessment,
  type ProgrammeScheduleItem,
  type ProgrammeMonitoringRequirement,
  type ProgrammeInvoicePage,
  type ProgrammeProviderSummary,
} from "@/lib/programmes/graphql";

function ConsultantBookingAction({ provider, label = "Book consultant" }: {
  provider: ProgrammeProviderSummary;
  label?: string;
}) {
  if (provider.bookingAvailable) {
    return <Button href={`/patient/providers/${provider.id}/book`} size="sm"><CalendarRange className="size-4" />{label}</Button>;
  }

  return (
    <div className="flex max-w-sm flex-col items-start gap-1.5">
      <Button disabled variant="secondary" size="sm"><CalendarRange className="size-4" />Booking unavailable</Button>
      <p className="text-sm text-muted">{provider.bookingUnavailableReason ?? "This consultant is currently unavailable for booking. Please contact your clinic."}</p>
    </div>
  );
}

type EnrolmentData = { programmeEnrolment: ProgrammeEnrolment | null };
type CarePlanData = { programmeCurrentCarePlan: ProgrammeCarePlan | null };
type HistoryData = { programmeCarePlanHistory: ProgrammeCarePlan[] };
type BaselineData = {
  programmeCurrentBaseline: ProgrammeBaselineAssessment | null;
};
type ScheduleData = { programmeSchedule: ProgrammeScheduleItem[] };
type MonitoringData = {
  effectiveMonitoringRequirements: ProgrammeMonitoringRequirement[];
};
type CarePlanProgrammesData = { carePlanProgrammes: CarePlanProgramme[] };
type InvoicesData = { myProgrammeInvoices: ProgrammeInvoicePage };
type EnsureInvoiceData = {
  ensurePatientPayableProgrammeInvoice: {
    invoice: ProgrammeInvoicePage["items"][number];
  };
};

const PAYABLE_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);

type EnrolmentReadiness = {
  ready: boolean;
  blockers: string[];
  baselineApproved: boolean;
  leadProviderAssigned: boolean;
  carePlanActive: boolean;
  hasMonitoringRequirements: boolean;
  programmeActive: boolean;
};
type ReadinessData = { programmeEnrolmentReadiness: EnrolmentReadiness | null };

/** Renders a JSON blob defensively — shape isn't locked down on the backend. */
function jsonToItems(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number")
          return String(item);
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const label =
            record.label ??
            record.title ??
            record.name ??
            record.description ??
            record.text;
          if (typeof label === "string") return label;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== "")
      .map(
        ([key, v]) =>
          `${titleCase(key)}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`,
      );
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function JsonSection({
  title,
  icon: Icon,
  value,
}: {
  title: string;
  icon: typeof Target;
  value: unknown;
}) {
  const items = jsonToItems(value);
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          {title}
        </p>
      </div>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-base leading-6 text-text">
            <span
              className="mt-2.5 size-1 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CarePlanDetail({ carePlan }: { carePlan: ProgrammeCarePlan }) {
  return (
    <div className="space-y-5">
      {carePlan.summary ? (
        <p className="text-base leading-6 text-text">{carePlan.summary}</p>
      ) : null}
      {carePlan.patientInstructions ? (
        <div className="rounded-lg border border-border bg-background px-4 py-3 text-base leading-6 text-text">
          {carePlan.patientInstructions}
        </div>
      ) : null}
      <JsonSection title="Goals" icon={Target} value={carePlan.goalsJson} />
      <JsonSection
        title="Follow-up schedule"
        icon={CalendarRange}
        value={carePlan.followUpScheduleJson}
      />
      <JsonSection
        title="Laboratory follow-up"
        icon={Icons.labs}
        value={carePlan.laboratoryFollowUpJson}
      />
      <JsonSection
        title="Medication review"
        icon={Icons.prescriptions}
        value={carePlan.medicationReviewJson}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-sm text-muted">
        {carePlan.startsAt ? (
          <span>Starts {formatDate(carePlan.startsAt)}</span>
        ) : null}
        {carePlan.expectedReviewAt ? (
          <span>Next review {formatDate(carePlan.expectedReviewAt)}</span>
        ) : null}
        {carePlan.endsAt ? (
          <span>Ends {formatDate(carePlan.endsAt)}</span>
        ) : null}
        {carePlan.approvedByProvider ? (
          <span>
            Approved by{" "}
            {carePlan.approvedByProvider.displayName ?? "your care team"}
            {carePlan.approvedAt ? ` · ${formatDate(carePlan.approvedAt)}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// Plain-language explanation for each readiness blocker code — never show the
// raw code, and never a step the patient has no way to act on without saying so.
const BLOCKER_COPY: Record<
  string,
  { label: string; action?: { label: string; href: string } }
> = {
  BASELINE_NOT_APPROVED: {
    label: "Your baseline questionnaire hasn't been approved yet.",
  },
  LEAD_PROVIDER_MISSING: {
    label: "Your clinic hasn't assigned a lead consultant yet.",
  },
  ACTIVE_CARE_PLAN_MISSING: {
    label: "Your clinic hasn't activated a care plan yet.",
  },
  MONITORING_REQUIREMENTS_MISSING: {
    label: "Your monitoring schedule hasn't been set up yet.",
  },
  PROGRAMME_NOT_ACTIVE: {
    label: "This programme is currently paused by your clinic.",
  },
  ENROLMENT_TERMINAL: { label: "This enrolment has ended." },
};

function ReadinessChecklist({
  readiness,
  baseline,
}: {
  readiness: EnrolmentReadiness;
  baseline: ProgrammeBaselineAssessment | null;
}) {
  if (readiness.ready || readiness.blockers.length === 0) return null;

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        What&apos;s outstanding
      </p>
      <ul className="space-y-2">
        {readiness.blockers.map((code) => {
          const copy = BLOCKER_COPY[code];
          const isBaselineBlocker = code === "BASELINE_NOT_APPROVED";
          const baselineSubmitted =
            baseline?.status === "SUBMITTED" ||
            baseline?.status === "UNDER_REVIEW";
          return (
            <li key={code} className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm text-muted">
                  {isBaselineBlocker && baselineSubmitted
                    ? "Submitted — your clinic is reviewing your baseline questionnaire."
                    : (copy?.label ?? "Your clinic is still setting this up.")}
                </p>
              </div>
              {isBaselineBlocker && !baselineSubmitted ? (
                <Button
                  href="/patient/pcq/baseline"
                  size="sm"
                  variant="secondary"
                  className="shrink-0"
                >
                  Complete baseline
                </Button>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CareTeamPanel({ enrolment }: { enrolment: ProgrammeEnrolment }) {
  const activeAssignments = enrolment.careTeamAssignments.filter(
    (a) => a.active,
  );
  const hasAnyone =
    Boolean(enrolment.leadProvider) || activeAssignments.length > 0;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle
          icon={Stethoscope}
          count={activeAssignments.length + (enrolment.leadProvider ? 1 : 0)}
        >
          Care Team
        </PanelTitle>
      </PanelHeader>
      {!hasAnyone ? (
        <PanelEmpty>
          Your care team hasn&apos;t been assigned yet. Your clinic will add your lead consultant and other team members as your programme gets set up.
        </PanelEmpty>
      ) : (
        <PanelList>
          {enrolment.leadProvider ? (
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-base font-semibold text-text">
                  {enrolment.leadProvider.displayName ?? "Lead consultant"}
                </p>
                <p className="mt-1 text-sm text-muted">Lead consultant</p>
              </div>
              <ConsultantBookingAction provider={enrolment.leadProvider} label="Book" />
            </div>
          ) : null}
          {activeAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-base font-medium text-text">
                  {assignment.provider?.displayName ?? "Care team member"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {labelForChoice(
                    PROGRAMME_CARE_TEAM_ROLE_OPTIONS,
                    assignment.role,
                    titleCase(assignment.role),
                  )}
                </p>
              </div>
              {assignment.provider ? (
                <Button
                  href={`/patient/providers/${assignment.provider.id}/book`}
                  size="sm"
                  variant="secondary"
                >
                  Book
                </Button>
              ) : null}
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
) {
  const startLabel = formatDate(start);
  if (!end || end === start) return startLabel;
  return `${startLabel} - ${formatDate(end)}`;
}

function CareJourneyPanel({ items }: { items: ProgrammeScheduleItem[] }) {
  const completedCount = items.filter((item) => item.status === "DONE").length;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={items.length}>
          Care Journey
        </PanelTitle>
        {items.length > 0 ? (
          <p className="text-sm font-medium text-muted">
            {completedCount} of {items.length} done
          </p>
        ) : null}
      </PanelHeader>
      {items.length === 0 ? (
        <PanelEmpty>
          Your care journey milestones — consultations, reviews, and check-ins — will appear here once your care plan is activated.
        </PanelEmpty>
      ) : (
        <PanelList>
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-5 py-4">
              {item.status === "DONE" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              ) : (
                <Clock className="mt-0.5 size-4 shrink-0 text-muted" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    tone={toneForLifecycleStatus(item.status)}
                    label={
                      item.dayNumber
                        ? `Day ${item.dayNumber}`
                        : titleCase(item.status)
                    }
                    size="sm"
                  />
                  <p className="text-sm text-muted">
                    {formatDateRange(item.scheduledDate, item.scheduledEndDate)}
                  </p>
                </div>
                <p className="mt-1.5 text-base font-medium text-text">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {titleCase(item.eventType)}
                  {item.provider?.displayName
                    ? ` · ${item.provider.displayName}`
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function MonitoringRequirementsPanel({
  requirements,
}: {
  requirements: ProgrammeMonitoringRequirement[];
}) {
  if (requirements.length === 0) return null;
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.monitoring} count={requirements.length}>
          Monitoring Schedule
        </PanelTitle>
      </PanelHeader>
      <PanelList>
        {requirements.map((requirement) => (
          <div key={requirement.id} className="px-5 py-4">
            <p className="text-base font-medium text-text">
              {titleCase(
                requirement.observationContext || requirement.observationType,
              )}
            </p>
            <p className="mt-1 text-sm text-muted">
              {labelForChoice(
                PROGRAMME_MONITORING_CADENCE_TYPE_OPTIONS,
                requirement.cadenceType,
              )}
              {requirement.timeOfDay ? ` · ${requirement.timeOfDay}` : ""}
            </p>
          </div>
        ))}
      </PanelList>
    </Panel>
  );
}

function SharedProgrammePlansPanel({
  title,
  icon: Icon,
  plans,
  emptyLabel,
  loading,
  error,
  onRetry,
}: {
  title: string;
  icon: typeof Utensils;
  plans: CarePlanProgramme[];
  emptyLabel: string;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icon} count={plans.length}>
          {title}
        </PanelTitle>
      </PanelHeader>
      {error ? (
        <PanelBody className="space-y-3">
          <p className="text-sm text-danger">
            Unable to load {title.toLowerCase()}.
          </p>
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        </PanelBody>
      ) : loading ? (
        <PanelEmpty>Loading {title.toLowerCase()}...</PanelEmpty>
      ) : plans.length === 0 ? (
        <PanelEmpty>{emptyLabel}</PanelEmpty>
      ) : (
        <PanelList>
          {plans.map((plan) => (
            <div key={plan.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-base font-semibold text-text">
                    {plan.title}
                  </p>
                  {plan.description ? (
                    <p className="mt-1 text-sm leading-6 text-muted">
                      {plan.description}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm text-muted">
                  {plan.startsOnDay
                    ? `Day ${plan.startsOnDay}`
                    : "No start day"}
                  {plan.endsOnDay ? ` - ${plan.endsOnDay}` : ""}
                </p>
              </div>
              {plan.instructions ? (
                <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-text">
                  {plan.instructions}
                </div>
              ) : null}
              {plan.items.length ? (
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {plan.items.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border bg-background px-3 py-2"
                    >
                      <p className="text-sm font-medium text-text">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {item.dayNumber ? `Day ${item.dayNumber}` : "Any day"}
                        {item.timeOfDay ? ` | ${item.timeOfDay}` : ""}
                        {item.mealType ? ` | ${titleCase(item.mealType)}` : ""}
                        {item.durationMinutes
                          ? ` | ${item.durationMinutes} min`
                          : ""}
                        {item.intensity
                          ? ` | ${titleCase(item.intensity)}`
                          : ""}
                      </p>
                      {item.instructions ? (
                        <p className="mt-2 text-sm leading-6 text-muted">
                          {item.instructions}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

export function PatientProgrammeDetailView({
  enrolmentId,
}: {
  enrolmentId: string;
}) {
  const router = useRouter();
  const [openVersion, setOpenVersion] = useState<ProgrammeCarePlan | null>(
    null,
  );
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const enrolmentQuery = useQuery<EnrolmentData>(PROGRAMME_ENROLMENT_QUERY, {
    variables: { id: enrolmentId },
    fetchPolicy: "network-only",
    pollInterval: 60000,
    notifyOnNetworkStatusChange: true,
  });
  const enrolment = enrolmentQuery.data?.programmeEnrolment ?? null;
  const hasSharedPlanAccess = Boolean(
    enrolment?.hasSharedPlanAccess &&
    !enrolmentQuery.loading &&
    !enrolmentQuery.error,
  );

  const carePlanQuery = useQuery<CarePlanData>(
    PROGRAMME_CURRENT_CARE_PLAN_QUERY,
    {
      variables: { enrolmentId },
      fetchPolicy: "cache-and-network",
    },
  );
  const historyQuery = useQuery<HistoryData>(
    PROGRAMME_CARE_PLAN_HISTORY_QUERY,
    {
      variables: { enrolmentId },
      fetchPolicy: "cache-and-network",
    },
  );
  const baselineQuery = useQuery<BaselineData>(
    PROGRAMME_CURRENT_BASELINE_QUERY,
    {
      variables: { enrolmentId },
      fetchPolicy: "cache-and-network",
    },
  );
  const readinessQuery = useQuery<ReadinessData>(
    PROGRAMME_ENROLMENT_READINESS_QUERY,
    {
      variables: { enrolmentId },
      fetchPolicy: "cache-and-network",
    },
  );
  const scheduleQuery = useQuery<ScheduleData>(PROGRAMME_SCHEDULE_QUERY, {
    variables: { enrolmentId },
    fetchPolicy: "cache-and-network",
  });
  const monitoringQuery = useQuery<MonitoringData>(
    EFFECTIVE_MONITORING_REQUIREMENTS_QUERY,
    {
      variables: { enrolmentId },
      fetchPolicy: "cache-and-network",
    },
  );
  const sharedPlansQuery = useQuery<CarePlanProgrammesData>(
    CARE_PLAN_PROGRAMMES_QUERY,
    {
      variables: { programmeId: enrolment?.programme.id ?? "" },
      fetchPolicy: "network-only",
      skip: !enrolment?.programme.id || !hasSharedPlanAccess,
    },
  );
  const invoicesQuery = useQuery<InvoicesData>(MY_PROGRAMME_INVOICES_QUERY, {
    variables: { limit: 25 },
    fetchPolicy: "cache-and-network",
    skip: hasSharedPlanAccess,
  });
  const [ensureInvoice, ensureInvoiceState] = useMutation<EnsureInvoiceData>(
    ENSURE_PATIENT_PAYABLE_PROGRAMME_INVOICE_MUTATION,
  );

  const payableInvoice = useMemo(() => {
    const all = invoicesQuery.data?.myProgrammeInvoices.items ?? [];
    return all.find(
      (inv) =>
        inv.programmeEnrolmentId === enrolmentId &&
        PAYABLE_STATUSES.has(inv.status) &&
        Number(inv.balance) > 0,
    ) ?? null;
  }, [invoicesQuery.data, enrolmentId]);

  const currentPlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const baseline = baselineQuery.data?.programmeCurrentBaseline ?? null;
  const readiness = readinessQuery.data?.programmeEnrolmentReadiness ?? null;
  const schedule = scheduleQuery.data?.programmeSchedule ?? [];
  const monitoringRequirements =
    monitoringQuery.data?.effectiveMonitoringRequirements ?? [];
  const sharedPlans = hasSharedPlanAccess
    ? (sharedPlansQuery.data?.carePlanProgrammes ?? [])
    : [];
  const history = useMemo(() => {
    const all = historyQuery.data?.programmeCarePlanHistory ?? [];
    return all
      .filter((plan) => plan.id !== currentPlan?.id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }, [historyQuery.data?.programmeCarePlanHistory, currentPlan?.id]);

  async function handleEnsureInvoice() {
    if (ensureInvoiceState.loading) return;
    setInvoiceError(null);
    try {
      const { data } = await ensureInvoice({ variables: { enrolmentId } });
      const invoice = data?.ensurePatientPayableProgrammeInvoice.invoice;
      if (!invoice?.id) {
        setInvoiceError("We couldn't create an invoice right now. Please try again.");
        return;
      }
      await invoicesQuery.refetch();
      router.push(`/patient/payments/${invoice.id}`);
    } catch {
      setInvoiceError(
        "Your clinic needs to finish billing setup before you can pay here.",
      );
    }
  }

  if (enrolmentQuery.loading && !enrolment) {
    return <div className="h-72 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <Panel>
        <PanelEmpty>
          This programme couldn&apos;t be found, or it isn&apos;t one of yours.{" "}
          <Link
            href="/patient/care-plan"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Back to your programmes
          </Link>
        </PanelEmpty>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/patient/care-plan"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-text"
      >
        <ArrowLeft className="size-4" />
        All programmes
      </Link>

      <section className="rounded-xl border border-border bg-surface px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-primary">
              {enrolment.programme.organization?.name ?? "Care programme"}
            </p>
            <h1 className="mt-1 text-xl font-semibold text-ink">
              {enrolment.programme.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {enrolment.leadProvider ? (
              <ConsultantBookingAction provider={enrolment.leadProvider} />
            ) : null}
            <StatusBadge
              tone={toneForLifecycleStatus(enrolment.status)}
              label={titleCase(enrolment.status)}
            />
          </div>
        </div>

        {enrolment.programme.patientOffer ? (
          <p className="mt-3 text-base leading-6 text-muted">
            {enrolment.programme.patientOffer}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm text-muted">
          <span>Enrolled {formatDate(enrolment.enrolledAt)}</span>
          {enrolment.programme.defaultDurationDays ? (
            <span>{enrolment.programme.defaultDurationDays} days</span>
          ) : null}
          <span>
            Readings every {enrolment.monitoringCadenceDays === 1
              ? "day"
              : `${enrolment.monitoringCadenceDays} days`}
          </span>
          {enrolment.leadProvider ? (
            <span>Lead: {enrolment.leadProvider.displayName}</span>
          ) : null}
        </div>

        {enrolment.programme.whoItIsFor || enrolment.programme.whatHappensNext ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {enrolment.programme.whoItIsFor ? (
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs font-medium text-muted">Who this programme is for</p>
                <p className="mt-1 text-sm leading-6 text-text">{enrolment.programme.whoItIsFor}</p>
              </div>
            ) : null}
            {enrolment.programme.whatHappensNext ? (
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs font-medium text-muted">What happens next</p>
                <p className="mt-1 text-sm leading-6 text-text">{enrolment.programme.whatHappensNext}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {!hasSharedPlanAccess &&
        !["COMPLETED", "WITHDRAWN"].includes(enrolment.status) ? (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/30 bg-warning/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icons.billing className="mt-0.5 size-5 shrink-0 text-warning" />
            <div>
              <p className="text-base font-medium text-text">Payment required</p>
              <p className="mt-0.5 text-sm text-muted">
                {payableInvoice
                  ? `You have an open invoice of ${Number(payableInvoice.balance).toLocaleString("en-ZM", { style: "currency", currency: payableInvoice.currency })}. Pay now to unlock your full programme features.`
                  : "No invoice has been issued yet. Start payment and we'll create one if billing is ready."}
              </p>
              {invoiceError ? (
                <p className="mt-1 text-sm text-danger">{invoiceError}</p>
              ) : null}
            </div>
          </div>
          {payableInvoice ? (
            <Button href={`/patient/payments/${payableInvoice.id}`} size="sm" className="shrink-0">
              Complete payment
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              className="shrink-0"
              disabled={ensureInvoiceState.loading}
              onClick={() => void handleEnsureInvoice()}
            >
              {ensureInvoiceState.loading ? "Creating..." : "Start payment"}
            </Button>
          )}
        </div>
      ) : null}

      <Panel>
        <PanelHeader>
          <PanelTitle icon={Icons.records}>Current Care Plan</PanelTitle>
          {currentPlan ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">
                v{currentPlan.versionNumber}
              </span>
              <StatusBadge
                tone={toneForLifecycleStatus(currentPlan.status)}
                label={titleCase(currentPlan.status)}
              />
            </div>
          ) : null}
        </PanelHeader>
        {!currentPlan ? (
          <PanelBody>
            <PanelEmpty className="px-0 py-4 text-left">
              Your care team is preparing your personal care plan. You&apos;ll see your goals, instructions, and follow-up schedule here once it&apos;s ready.
            </PanelEmpty>
            {readiness ? (
              <ReadinessChecklist readiness={readiness} baseline={baseline} />
            ) : null}
          </PanelBody>
        ) : (
          <PanelBody>
            <p className="mb-4 text-base font-semibold text-text">
              {currentPlan.title}
            </p>
            <CarePlanDetail carePlan={currentPlan} />
          </PanelBody>
        )}
      </Panel>

      <CareTeamPanel enrolment={enrolment} />

      <CareJourneyPanel items={schedule} />

      {hasSharedPlanAccess ? (
        <>
          {[
            {
              title: "Programme Care Plans",
              type: "GENERAL",
              icon: Icons.records,
            },
            { title: "Meal Plans", type: "MEAL_PLAN", icon: Utensils },
            { title: "Exercise Plans", type: "EXERCISE_PLAN", icon: Dumbbell },
          ].map((section) => (
            <SharedProgrammePlansPanel
              key={section.type}
              title={section.title}
              icon={section.icon}
              plans={sharedPlans.filter(
                (plan) => plan.planType.toUpperCase() === section.type,
              )}
              emptyLabel={`Your clinic has not added ${section.title.toLowerCase()} yet.`}
              loading={sharedPlansQuery.loading}
              error={Boolean(sharedPlansQuery.error)}
              onRetry={() => void sharedPlansQuery.refetch()}
            />
          ))}
        </>
      ) : (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={LockKeyhole}>Your Programme Plans</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-5">
            {enrolmentQuery.loading ? (
              <p className="text-base text-muted">Checking your access...</p>
            ) : enrolmentQuery.error ? (
              <p className="text-base text-muted">
                We couldn&apos;t check your access right now. Try refreshing below.
              </p>
            ) : ["COMPLETED", "WITHDRAWN"].includes(enrolment.status) ? (
              <div className="space-y-2">
                <p className="text-base text-text">
                  Your enrolment in this programme has ended.
                </p>
                <p className="text-sm text-muted">
                  Contact your clinic if you&apos;d like to re-enrol or access your previous plans.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-base text-text">
                  Your meal plans, exercise plans, and care plans will appear here once your payment is confirmed.
                </p>
                <p className="text-sm text-muted">
                  Already paid? Try refreshing your access — it can take a moment to update. If it still doesn&apos;t show, contact your clinic.
                </p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <Utensils className="size-5 shrink-0 text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">Meal plans</p>
                  <p className="text-xs text-muted">Daily meals from your team</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <Dumbbell className="size-5 shrink-0 text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">Exercise plans</p>
                  <p className="text-xs text-muted">Activities set by your team</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
                <Icons.records className="size-5 shrink-0 text-muted" />
                <div>
                  <p className="text-sm font-medium text-text">Care plans</p>
                  <p className="text-xs text-muted">Clinical steps and goals</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {payableInvoice ? (
                <Button href={`/patient/payments/${payableInvoice.id}`} size="sm">
                  <Icons.billing className="size-4" />
                  Make payment
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={ensureInvoiceState.loading}
                  onClick={() => void handleEnsureInvoice()}
                >
                  <Icons.billing className="size-4" />
                  {ensureInvoiceState.loading ? "Creating..." : "Start payment"}
                </Button>
              )}
              {!baseline ||
              !["APPROVED", "SUBMITTED", "UNDER_REVIEW"].includes(
                baseline.status,
              ) ? (
                <Button
                  href="/patient/pcq/baseline"
                  size="sm"
                  variant="secondary"
                >
                  Complete baseline
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={enrolmentQuery.loading}
                onClick={() => void enrolmentQuery.refetch()}
              >
                <RefreshCw className="size-4" />
                Refresh access
              </Button>
            </div>
          </PanelBody>
        </Panel>
      )}

      <MonitoringRequirementsPanel requirements={monitoringRequirements} />

      <Panel>
        <PanelHeader>
          <PanelTitle icon={History} count={history.length}>
            Care Plan History
          </PanelTitle>
        </PanelHeader>
        {history.length === 0 ? (
          <PanelEmpty>
            When your care team updates your care plan, earlier versions will be kept here so you can see how your plan has changed over time.
          </PanelEmpty>
        ) : (
          <PanelList>
            {history.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setOpenVersion(plan)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-background"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text">
                    v{plan.versionNumber} &middot; {plan.title}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatDate(plan.startsAt)}
                    {plan.revisionReason ? ` · ${plan.revisionReason}` : ""}
                  </p>
                </div>
                <StatusBadge
                  tone={toneForLifecycleStatus(plan.status)}
                  label={titleCase(plan.status)}
                  size="sm"
                />
              </button>
            ))}
          </PanelList>
        )}
      </Panel>

      {openVersion ? (
        <DetailModal
          title={`${openVersion.title} · v${openVersion.versionNumber}`}
          subtitle={titleCase(openVersion.status)}
          onClose={() => setOpenVersion(null)}
        >
          <CarePlanDetail carePlan={openVersion} />
        </DetailModal>
      ) : null}
    </div>
  );
}
