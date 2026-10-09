"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { CalendarRange, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Panel, PanelBody, PanelHeader, PanelList, PanelTitle } from "@/components/ui/panel";
import { Icons } from "@/components/ui/icons";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { BROWSABLE_PROGRAMMES_QUERY, JOIN_PROGRAMME_MUTATION, type CareProgramme } from "@/lib/programmes/graphql";

type BrowsableData = { browsableProgrammes: CareProgramme[] };

function mapJoinError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PROGRAMME_ACCESS_DENIED") {
    return "This programme is not available to you.";
  }
  if (code === "PROGRAMME_ENROLMENT_EXISTS") {
    return "You already have an open enrolment in this programme.";
  }
  if (code === "PROGRAMME_NOT_FOUND") {
    return "This programme is no longer available.";
  }
  return getGraphQLErrorMessage(error, "Unable to join this programme right now. Please try again.");
}

export function BrowseProgrammesPanel() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery<BrowsableData>(BROWSABLE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [join, joinState] = useMutation(JOIN_PROGRAMME_MUTATION);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [previewProgramme, setPreviewProgramme] = useState<CareProgramme | null>(null);
  const [error, setError] = useState<string | null>(null);

  const programmes = (data?.browsableProgrammes ?? []).filter((programme) => !programme.myEnrolmentStatus);
  if (loading && programmes.length === 0) return null;
  if (programmes.length === 0) return null;

  async function handleJoin(programmeId: string) {
    setError(null);
    setJoiningId(programmeId);
    try {
      await join({ variables: { programmeId } });
      setPreviewProgramme(null);
      await refetch();
      router.refresh();
    } catch (mutationError) {
      setError(mapJoinError(mutationError));
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <>
      <Panel>
        <PanelHeader>
          <PanelTitle icon={Icons.health} count={programmes.length}>
            Programmes You Can Join
          </PanelTitle>
        </PanelHeader>
        {error && !previewProgramme ? (
          <p className="border-b border-danger/30 bg-danger/5 px-5 py-3 text-sm text-danger">{error}</p>
        ) : null}
        <PanelList>
          {programmes.map((programme) => (
            <div key={programme.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base font-semibold text-text">{programme.name}</p>
                  {programme.organization?.name ? (
                    <p className="mt-0.5 text-xs text-muted">{programme.organization.name}</p>
                  ) : null}
                  {programme.patientOffer ?? programme.description ? (
                    <p className="mt-1.5 text-sm leading-6 text-muted">
                      {programme.patientOffer ?? programme.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setPreviewProgramme(programme)}
                >
                  Learn more
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                {programme.defaultDurationDays ? (
                  <span className="flex items-center gap-1">
                    <CalendarRange className="size-3.5" />
                    {programme.defaultDurationDays} days
                  </span>
                ) : null}
                {programme.defaultMonitoringCadenceDays ? (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    Readings every {programme.defaultMonitoringCadenceDays === 1
                      ? "day"
                      : `${programme.defaultMonitoringCadenceDays} days`}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </PanelList>
      </Panel>

      {previewProgramme ? (
        <DetailModal
          title={previewProgramme.name}
          subtitle={previewProgramme.organization?.name ?? undefined}
          onClose={() => { setPreviewProgramme(null); setError(null); }}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => { setPreviewProgramme(null); setError(null); }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={joinState.loading && joiningId === previewProgramme.id}
                onClick={() => void handleJoin(previewProgramme.id)}
              >
                {joinState.loading && joiningId === previewProgramme.id ? "Joining…" : "Join this programme"}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            {error ? (
              <p className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
            ) : null}

            {previewProgramme.patientOffer ?? previewProgramme.description ? (
              <p className="text-base leading-6 text-text">
                {previewProgramme.patientOffer ?? previewProgramme.description}
              </p>
            ) : null}

            {previewProgramme.whoItIsFor ? (
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs font-medium text-muted">Who this is for</p>
                <p className="mt-1 text-sm leading-6 text-text">{previewProgramme.whoItIsFor}</p>
              </div>
            ) : null}

            {previewProgramme.whatHappensNext ? (
              <div className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-xs font-medium text-muted">What happens after you join</p>
                <p className="mt-1 text-sm leading-6 text-text">{previewProgramme.whatHappensNext}</p>
              </div>
            ) : null}

            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              <div className="bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Programme length</p>
                <p className="mt-2 text-xl font-semibold leading-none text-ink">
                  {previewProgramme.defaultDurationDays ?? "Open"}
                  {previewProgramme.defaultDurationDays ? <span className="ml-1 text-sm font-normal text-muted">days</span> : null}
                </p>
              </div>
              <div className="bg-surface p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-muted">Reading frequency</p>
                <p className="mt-2 text-xl font-semibold leading-none text-ink">
                  {previewProgramme.defaultMonitoringCadenceDays === 1
                    ? "Daily"
                    : `Every ${previewProgramme.defaultMonitoringCadenceDays} days`}
                </p>
              </div>
            </div>

            <p className="text-xs leading-5 text-muted">
              By joining, you&apos;ll be enrolled in this programme and your clinic will begin setting up your care plan. Your meal plans, exercise plans, and full programme features become available after payment is confirmed.
            </p>
          </div>
        </DetailModal>
      ) : null}
    </>
  );
}
