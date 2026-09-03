"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Panel, PanelBody, PanelEmpty, PanelHeader, PanelList, PanelTitle } from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { Icons } from "@/components/ui/icons";
import { titleCase, formatDate } from "@/lib/utils/format";
import {
  PROGRAMME_ENROLMENT_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  PROGRAMME_CARE_PLAN_HISTORY_QUERY,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";

type EnrolmentData = { programmeEnrolment: ProgrammeEnrolment | null };
type CarePlanData = { programmeCurrentCarePlan: ProgrammeCarePlan | null };
type HistoryData = { programmeCarePlanHistory: ProgrammeCarePlan[] };

/** Renders a JSON blob defensively — shape isn't locked down on the backend. */
function jsonToItems(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          const label = record.label ?? record.title ?? record.name ?? record.description ?? record.text;
          if (typeof label === "string") return label;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  }
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== "")
      .map(([key, v]) => `${titleCase(key)}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`);
  }
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function JsonSection({ title, value }: { title: string; value: unknown }) {
  const items = jsonToItems(value);
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-6 text-text">
            <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
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
      {carePlan.summary ? <p className="text-sm leading-6 text-text">{carePlan.summary}</p> : null}
      {carePlan.patientInstructions ? (
        <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm leading-6 text-text">
          {carePlan.patientInstructions}
        </div>
      ) : null}
      <JsonSection title="Goals" value={carePlan.goalsJson} />
      <JsonSection title="Follow-up schedule" value={carePlan.followUpScheduleJson} />
      <JsonSection title="Laboratory follow-up" value={carePlan.laboratoryFollowUpJson} />
      <JsonSection title="Medication review" value={carePlan.medicationReviewJson} />
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-xs text-muted">
        {carePlan.startsAt ? <span>Starts {formatDate(carePlan.startsAt)}</span> : null}
        {carePlan.expectedReviewAt ? <span>Next review {formatDate(carePlan.expectedReviewAt)}</span> : null}
        {carePlan.endsAt ? <span>Ends {formatDate(carePlan.endsAt)}</span> : null}
        {carePlan.approvedByProvider ? (
          <span>
            Approved by {carePlan.approvedByProvider.displayName ?? "your care team"}
            {carePlan.approvedAt ? ` · ${formatDate(carePlan.approvedAt)}` : ""}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function PatientProgrammeDetailView({ enrolmentId }: { enrolmentId: string }) {
  const [openVersion, setOpenVersion] = useState<ProgrammeCarePlan | null>(null);

  const enrolmentQuery = useQuery<EnrolmentData>(PROGRAMME_ENROLMENT_QUERY, {
    variables: { id: enrolmentId },
    fetchPolicy: "cache-and-network",
  });
  const enrolment = enrolmentQuery.data?.programmeEnrolment ?? null;

  const carePlanQuery = useQuery<CarePlanData>(PROGRAMME_CURRENT_CARE_PLAN_QUERY, {
    variables: { enrolmentId },
    fetchPolicy: "cache-and-network",
  });
  const historyQuery = useQuery<HistoryData>(PROGRAMME_CARE_PLAN_HISTORY_QUERY, {
    variables: { enrolmentId },
    fetchPolicy: "cache-and-network",
  });

  const currentPlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const history = useMemo(() => {
    const all = historyQuery.data?.programmeCarePlanHistory ?? [];
    return all
      .filter((plan) => plan.id !== currentPlan?.id)
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }, [historyQuery.data?.programmeCarePlanHistory, currentPlan?.id]);

  if (enrolmentQuery.loading && !enrolment) {
    return <div className="h-72 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <Panel>
        <PanelEmpty>
          This programme couldn&apos;t be found, or it isn&apos;t one of yours.{" "}
          <Link href="/patient/care-plan" className="font-semibold text-primary hover:text-primary/80">
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

      <section className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            {enrolment.programme.name}
          </p>
          <p className="mt-1 text-sm text-muted">Enrolled {formatDate(enrolment.enrolledAt)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {enrolment.leadProvider ? (
            <Button href={`/patient/providers/${enrolment.leadProvider.id}/book`} size="sm">
              Book consultant
            </Button>
          ) : null}
          <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
        </div>
      </section>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={Icons.records}>Current Care Plan</PanelTitle>
          {currentPlan ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">v{currentPlan.versionNumber}</span>
              <StatusBadge tone={toneForLifecycleStatus(currentPlan.status)} label={titleCase(currentPlan.status)} />
            </div>
          ) : null}
        </PanelHeader>
        {!currentPlan ? (
          <PanelEmpty>Your clinic has not activated a care plan for this programme yet.</PanelEmpty>
        ) : (
          <PanelBody>
            <p className="mb-4 text-base font-semibold text-text">{currentPlan.title}</p>
            <CarePlanDetail carePlan={currentPlan} />
          </PanelBody>
        )}
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={History} count={history.length}>
            Care Plan History
          </PanelTitle>
        </PanelHeader>
        {history.length === 0 ? (
          <PanelEmpty>Earlier versions of this care plan will appear here after your first revision.</PanelEmpty>
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
                  <p className="truncate text-sm font-semibold text-text">
                    v{plan.versionNumber} &middot; {plan.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(plan.startsAt)}
                    {plan.revisionReason ? ` · ${plan.revisionReason}` : ""}
                  </p>
                </div>
                <StatusBadge tone={toneForLifecycleStatus(plan.status)} label={titleCase(plan.status)} size="sm" />
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
