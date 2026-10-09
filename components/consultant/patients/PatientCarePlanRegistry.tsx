"use client";

import { useEffect, useMemo, useState } from "react";
import { useApolloClient, useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { CarePlanManager, type CarePlanOrigin } from "./CarePlanManager";
import {
  PATIENT_PROGRAMME_ENROLMENTS_QUERY,
  PROGRAMME_CARE_PLAN_HISTORY_QUERY,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";
import { type WorkspaceOngoingCarePlan } from "@/lib/consultant/patient-workspace-graphql";

export function PatientCarePlanRegistry({
  patientId,
  carePlans,
  active,
  onChanged,
  onOpenEnrolment,
}: {
  patientId: string;
  carePlans: WorkspaceOngoingCarePlan[];
  active: boolean;
  onChanged: () => void;
  onOpenEnrolment: (enrolmentId: string) => void;
}) {
  const client = useApolloClient();
  const [retry, setRetry] = useState(0);
  const [mapping, setMapping] = useState<{
    signature: string;
    origins: Record<string, CarePlanOrigin>;
    complete: boolean;
  } | null>(null);
  const enrolmentsQuery = useQuery<{
    clinicProgrammeEnrolments: ProgrammeEnrolment[];
  }>(PATIENT_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { patientId },
    skip: !active,
    fetchPolicy: "cache-and-network",
  });
  const enrolments = useMemo(
    () => enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [],
    [enrolmentsQuery.data],
  );
  const signature = JSON.stringify([
    patientId,
    enrolments.map((item) => item.id),
    carePlans.map((item) => item.id),
  ]);
  useEffect(() => {
    if (
      !active ||
      !enrolmentsQuery.data ||
      enrolmentsQuery.loading ||
      enrolmentsQuery.error
    )
      return;
    let cancelled = false;
    // The workspace type omits enrolmentId; history IDs provide the actual relation.
    async function resolveOrigins() {
      const results = await Promise.allSettled(
        enrolments.map(async (enrolment) => {
          const result = await client.query<{
            programmeCarePlanHistory: {
              id: string;
              enrolmentId: string | null;
            }[];
          }>({
            query: PROGRAMME_CARE_PLAN_HISTORY_QUERY,
            variables: { enrolmentId: enrolment.id },
            fetchPolicy: "network-only",
          });
          if (!Array.isArray(result.data?.programmeCarePlanHistory))
            throw new Error("Care-plan history unavailable");
          if (
            result.data.programmeCarePlanHistory.some(
              (plan) => plan.enrolmentId !== enrolment.id,
            )
          )
            throw new Error("Care-plan enrolment mismatch");
          return { enrolment, plans: result.data.programmeCarePlanHistory };
        }),
      );
      if (cancelled) return;
      const origins: Record<string, CarePlanOrigin> = {};
      for (const result of results) {
        if (result.status !== "fulfilled") continue;
        const { enrolment, plans } = result.value;
        for (const plan of plans)
          if (plan.enrolmentId === enrolment.id)
            origins[plan.id] = {
              enrolmentId: enrolment.id,
              programmeName: enrolment.programme.name,
            };
      }
      setMapping({
        signature,
        origins,
        complete: results.every((result) => result.status === "fulfilled"),
      });
    }
    void resolveOrigins();
    return () => {
      cancelled = true;
    };
  }, [
    active,
    client,
    enrolments,
    enrolmentsQuery.data,
    enrolmentsQuery.loading,
    enrolmentsQuery.error,
    signature,
    retry,
  ]);
  const current = mapping?.signature === signature ? mapping : null;
  const complete = Boolean(
    current?.complete && !enrolmentsQuery.loading && !enrolmentsQuery.error,
  );
  return (
    <div className="space-y-4">
      {enrolmentsQuery.error || (current && !current.complete) ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 text-sm text-danger"
        >
          <p>
            Some care-plan relationships could not be verified. Unverified plans
            are read-only.
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              setRetry((value) => value + 1);
              void enrolmentsQuery.refetch();
            }}
          >
            Retry
          </Button>
        </div>
      ) : !complete ? (
        <p role="status" className="text-sm text-muted">
          Loading care-plan relationships...
        </p>
      ) : null}
      <CarePlanManager
        patientId={patientId}
        carePlans={carePlans}
        onChanged={onChanged}
        programmeOrigins={current?.origins ?? {}}
        originsVerified={complete}
        onOpenEnrolment={onOpenEnrolment}
      />
    </div>
  );
}
