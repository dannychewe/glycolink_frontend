"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Panel, PanelHeader, PanelList, PanelTitle } from "@/components/ui/panel";
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

/**
 * Only ever rendered when `browsableProgrammes` is non-empty (the parent decides
 * that) — never a tile that leads to an empty list.
 */
export function BrowseProgrammesPanel() {
  const router = useRouter();
  const { data, loading, refetch } = useQuery<BrowsableData>(BROWSABLE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const [join, joinState] = useMutation(JOIN_PROGRAMME_MUTATION);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A programme the patient already has an open enrolment in (any status short
  // of completed/withdrawn) isn't something to "join" again — drop it rather
  // than show a button that's guaranteed to error.
  const programmes = (data?.browsableProgrammes ?? []).filter((programme) => !programme.myEnrolmentStatus);
  if (loading && programmes.length === 0) return null;
  if (programmes.length === 0) return null;

  async function handleJoin(programmeId: string) {
    setError(null);
    setJoiningId(programmeId);
    try {
      await join({ variables: { programmeId } });
      await refetch();
      router.refresh();
    } catch (mutationError) {
      setError(mapJoinError(mutationError));
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.health} count={programmes.length}>
          Programmes You Can Join
        </PanelTitle>
      </PanelHeader>
      {error ? (
        <p className="border-b border-danger/30 bg-danger/5 px-5 py-3 text-sm text-danger">{error}</p>
      ) : null}
      <PanelList>
        {programmes.map((programme) => (
          <div key={programme.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-semibold text-text">{programme.name}</p>
              {programme.patientOffer ?? programme.description ? (
                <p className="mt-1 text-sm text-muted">{programme.patientOffer ?? programme.description}</p>
              ) : null}
            </div>
            <Button
              type="button"
              size="sm"
              disabled={joinState.loading && joiningId === programme.id}
              onClick={() => void handleJoin(programme.id)}
            >
              {joinState.loading && joiningId === programme.id ? "Joining…" : "Join programme"}
            </Button>
          </div>
        ))}
      </PanelList>
    </Panel>
  );
}
