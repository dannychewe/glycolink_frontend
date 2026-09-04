"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import { CalendarRange, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Panel, PanelBody, PanelEmpty, PanelHeader, PanelList, PanelTitle, StatTile } from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { GlucoseLogForm } from "@/components/patient/monitoring/GlucoseLogForm";
import { VitalsLogForm } from "@/components/patient/monitoring/VitalsLogForm";
import { PATIENT_GLUCOSE_SUMMARY_QUERY } from "@/lib/monitoring/graphql";
import {
  MY_CURRENT_PROGRAMME_ENROLMENT_QUERY,
  MY_NEXT_EXPECTED_READINGS_QUERY,
  MY_PROGRAMME_SCHEDULE_QUERY,
  MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  type ExpectedMonitoringWindow,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeScheduleItem,
} from "@/lib/programmes/graphql";
import { Icons } from "@/components/ui/icons";

type EnrolmentData = { myCurrentProgrammeEnrolment: ProgrammeEnrolment | null };
type CarePlanData = { programmeCurrentCarePlan: ProgrammeCarePlan | null };
type NextReadingsData = { myNextExpectedReadings: ExpectedMonitoringWindow[] };
type CareJourneyData = { myProgrammeSchedule: ProgrammeScheduleItem[] };

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function isTodayOrOverdue(value: string) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  return due <= endOfToday;
}

function isDueDate(value: string) {
  const due = new Date(value);
  if (Number.isNaN(due.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return due <= today;
}

/**
 * Today's diabetes care, for patients who have a programme/care plan. One
 * panel, one job: what's due, tap through to act on it. A missing glucose (or
 * vitals) reading gets its own "Log" button here, opening the same modal used
 * elsewhere on the dashboard — not just a status badge with no way to act on it.
 */
function ProgrammeTodayPanel({
  readings,
  scheduleItems,
  onMarkedDone,
  onLogged,
}: {
  readings: ExpectedMonitoringWindow[];
  scheduleItems: ProgrammeScheduleItem[];
  onMarkedDone: () => void;
  onLogged: () => void;
}) {
  const client = useApolloClient();
  const [markDone, markState] = useMutation(MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION);
  const [logMode, setLogMode] = useState<"glucose" | "vitals" | null>(null);

  const dueReadings = readings.filter((r) => r.status !== "SATISFIED" && isTodayOrOverdue(r.dueAt));
  const actionableSchedule = scheduleItems.filter((item) => !["DONE", "SKIPPED", "CANCELLED"].includes(item.status));
  const dueSchedule = actionableSchedule.filter((item) => isDueDate(item.scheduledDate)).slice(0, 5);
  const totalDue = dueReadings.length + dueSchedule.length;

  async function complete(itemId: string) {
    await markDone({ variables: { itemId } });
    onMarkedDone();
  }

  function handleLogged() {
    setLogMode(null);
    onLogged();
    void client.refetchQueries({ include: [PATIENT_GLUCOSE_SUMMARY_QUERY, MY_NEXT_EXPECTED_READINGS_QUERY] });
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.monitoring} count={totalDue} countTone="warning">
          Today
        </PanelTitle>
      </PanelHeader>
      {totalDue === 0 ? (
        <PanelEmpty>Nothing due today — you&apos;re all caught up.</PanelEmpty>
      ) : (
        <PanelList>
          {dueReadings.map((reading) => (
            <div key={reading.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-base font-medium text-text">
                  {titleCase(reading.observationContext ?? reading.observationType)}
                </p>
                <p className="mt-1 text-sm text-muted">Due {formatDateTime(reading.dueAt)}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge tone={toneForLifecycleStatus(reading.status)} label={titleCase(reading.status)} size="sm" />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setLogMode(reading.observationType === "vital" ? "vitals" : "glucose")}
                >
                  {reading.observationType === "vital" ? "Log vitals" : "Log glucose"}
                </Button>
              </div>
            </div>
          ))}
          {dueSchedule.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="truncate text-base font-medium text-text">{item.title}</p>
                <p className="mt-1 text-sm text-muted">
                  {titleCase(item.eventType)}
                  {item.provider?.displayName ? ` · ${item.provider.displayName}` : ""}
                </p>
              </div>
              {item.eventType === "VIDEO_CONSULTATION" || item.eventType === "CONSULTANT_REVIEW" ? (
                <Button href={item.provider?.id ? `/patient/providers/${item.provider.id}/book` : "/patient/bookings"} size="sm">
                  Book
                </Button>
              ) : (
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
              )}
            </div>
          ))}
        </PanelList>
      )}
      {logMode ? (
        <DetailModal
          title="Log reading"
          subtitle="Record today's programme monitoring"
          onClose={() => setLogMode(null)}
          className="sm:max-w-2xl"
          footer={
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogMode(null)}>
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
                onClick={() => setLogMode("glucose")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  logMode === "glucose" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
                }`}
              >
                Glucose
              </button>
              <button
                type="button"
                onClick={() => setLogMode("vitals")}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  logMode === "vitals" ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"
                }`}
              >
                Vitals
              </button>
            </div>
            {logMode === "glucose" ? (
              <GlucoseLogForm onSuccess={handleLogged} />
            ) : (
              <VitalsLogForm onSuccess={handleLogged} />
            )}
          </div>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

function CareJourneyProgress({ items }: { items: ProgrammeScheduleItem[] }) {
  if (items.length === 0) return null;
  const completedCount = items.filter((item) => item.status === "DONE").length;
  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange}>Care Journey Progress</PanelTitle>
        <p className="text-sm font-medium text-muted">
          {completedCount} of {items.length} done
        </p>
      </PanelHeader>
      <PanelBody className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile label="Completed" value={completedCount} tone="success" />
          <StatTile label="Progress" value={`${progress}%`} />
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
      </PanelBody>
    </Panel>
  );
}

/**
 * The programme-specific section of the dashboard — secondary, and only
 * rendered by the page when the patient actually has an enrolment. Everything
 * universal (booking, glucose status, messages, payments) lives one level up.
 */
export function PatientDiabetesHome() {
  const enrolmentQuery = useQuery<EnrolmentData>(MY_CURRENT_PROGRAMME_ENROLMENT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const enrolment = enrolmentQuery.data?.myCurrentProgrammeEnrolment ?? null;
  const enrolmentId = enrolment?.id;

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

  const carePlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const nextReadings = useMemo(
    () => nextReadingsQuery.data?.myNextExpectedReadings ?? [],
    [nextReadingsQuery.data?.myNextExpectedReadings],
  );
  const careJourney = careJourneyQuery.data?.myProgrammeSchedule ?? [];

  function refetch() {
    void nextReadingsQuery.refetch();
    void careJourneyQuery.refetch();
  }

  if (enrolmentQuery.loading && !enrolment) {
    return <div className="h-48 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) return null;

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-primary">
          {enrolment.programme.name}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
          <Link href={`/patient/programmes/${enrolment.id}`} className="text-sm font-medium text-primary hover:text-primary/80">
            View care plan
          </Link>
        </div>
      </section>

      {carePlan?.summary ? (
        <p className="rounded-lg border border-border bg-surface px-4 py-3 text-sm leading-6 text-muted">
          {carePlan.summary}
        </p>
      ) : null}

      <ProgrammeTodayPanel
        readings={nextReadings}
        scheduleItems={careJourney}
        onMarkedDone={refetch}
        onLogged={refetch}
      />

      <CareJourneyProgress items={careJourney} />
    </div>
  );
}
