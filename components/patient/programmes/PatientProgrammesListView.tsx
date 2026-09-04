"use client";

import { useEffect, useMemo } from "react";
import { useQuery } from "@apollo/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, PanelEmpty, PanelList } from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { titleCase, formatDate } from "@/lib/utils/format";
import { BrowseProgrammesPanel } from "@/components/patient/dashboard/BrowseProgrammesPanel";
import { MY_PROGRAMME_ENROLMENTS_QUERY, type ProgrammeEnrolment } from "@/lib/programmes/graphql";

type Data = { myProgrammeEnrolments: ProgrammeEnrolment[] };

const OPEN_STATUSES = new Set(["invited", "pending_baseline", "active", "paused"]);

function EmptyState() {
  return (
    <div className="space-y-4">
      <Panel>
        <PanelEmpty>You haven&apos;t joined a care programme yet.</PanelEmpty>
      </Panel>
      {/* Same fork as the dashboard: a programme to join if attached to a clinic
          with one open, otherwise nowhere to route except ad hoc booking. */}
      <BrowseProgrammesPanel />
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-5 py-4">
        <p className="text-base text-text">Not attached to a clinic yet? You can still book a one-off consultation.</p>
        <Button href="/patient/providers" size="sm" variant="secondary" className="shrink-0">
          Find a consultant
        </Button>
      </div>
    </div>
  );
}

export function PatientProgrammesListView() {
  const router = useRouter();
  const { data, loading, error } = useQuery<Data>(MY_PROGRAMME_ENROLMENTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const enrolments = useMemo(() => {
    const all = data?.myProgrammeEnrolments ?? [];
    return [...all].sort((a, b) => {
      const aOpen = OPEN_STATUSES.has(a.status.toLowerCase()) ? 0 : 1;
      const bOpen = OPEN_STATUSES.has(b.status.toLowerCase()) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
    });
  }, [data?.myProgrammeEnrolments]);

  const openEnrolments = useMemo(
    () => enrolments.filter((enrolment) => OPEN_STATUSES.has(enrolment.status.toLowerCase())),
    [enrolments],
  );

  // Exactly one open programme is the common case — skip the list, go straight
  // to it. Only actually a list when there's a real choice to make (0 or 2+).
  useEffect(() => {
    if (openEnrolments.length === 1 && enrolments.length === 1) {
      router.replace(`/patient/programmes/${openEnrolments[0].id}`);
    }
  }, [openEnrolments, enrolments, router]);

  if (loading && enrolments.length === 0) {
    return <div className="h-40 animate-pulse rounded-lg bg-border/40" />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
        Unable to load your programmes right now.
      </div>
    );
  }

  if (enrolments.length === 0) {
    return <EmptyState />;
  }

  if (openEnrolments.length === 1 && enrolments.length === 1) {
    // Redirecting via the effect above — avoid flashing the list.
    return <div className="h-40 animate-pulse rounded-lg bg-border/40" />;
  }

  return (
    <Panel>
      <PanelList>
        {enrolments.map((enrolment) => (
          <Link
            key={enrolment.id}
            href={`/patient/programmes/${enrolment.id}`}
            className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-background"
          >
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-text">{enrolment.programme.name}</p>
              <p className="mt-1 text-sm text-muted">
                Enrolled {formatDate(enrolment.enrolledAt)}
                {enrolment.leadProvider ? ` · ${enrolment.leadProvider.displayName}` : ""}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <StatusBadge tone={toneForLifecycleStatus(enrolment.status)} label={titleCase(enrolment.status)} />
              <ChevronRight className="size-4 text-muted" />
            </div>
          </Link>
        ))}
      </PanelList>
    </Panel>
  );
}
