"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Panel, PanelEmpty, PanelList } from "@/components/ui/panel";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { titleCase, formatDate } from "@/lib/utils/format";
import { MY_PROGRAMME_ENROLMENTS_QUERY, type ProgrammeEnrolment } from "@/lib/programmes/graphql";

type Data = { myProgrammeEnrolments: ProgrammeEnrolment[] };

const OPEN_STATUSES = new Set(["invited", "pending_baseline", "active", "paused"]);

export function PatientProgrammesListView() {
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
    return (
      <Panel>
        <PanelEmpty>
          You haven&apos;t been enrolled in a care programme yet. Your clinic will enrol you when you&apos;re ready
          to start.
        </PanelEmpty>
      </Panel>
    );
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
              <p className="truncate text-sm font-semibold text-text">{enrolment.programme.name}</p>
              <p className="mt-1 text-xs text-muted">
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
