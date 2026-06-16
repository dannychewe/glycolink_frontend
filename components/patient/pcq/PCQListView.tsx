"use client";

import { useQuery } from "@apollo/client";
import Link from "next/link";
import { CalendarClock, ChevronRight, ClipboardList, UserRound } from "lucide-react";
import { PATIENT_PCQ_LIST_QUERY } from "@/lib/patient/pcq-graphql";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type PCQListItem = {
  id: string;
  appointmentId: string | null;
  assignedByProviderName: string | null;
  responseScope: string;
  status: string;
  assignmentReason: string | null;
  dueAt: string | null;
  submittedAt: string | null;
  lockedAt: string | null;
  template: { id: string; name: string; consultationType: string } | null;
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("en-ZM", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

const SCOPE_LABEL: Record<string, string> = {
  BASELINE: "Baseline",
  APPOINTMENT: "Appointment",
  ASSIGNED: "Assigned",
};

// Order and presentation for each status bucket.
const STATUS_GROUPS: { key: string; label: string; description: string }[] = [
  { key: "IN_PROGRESS", label: "In progress", description: "Continue where you left off." },
  { key: "DRAFT", label: "To do", description: "Questionnaires waiting for your answers." },
  { key: "SUBMITTED", label: "Submitted", description: "Sent to your care team." },
  { key: "LOCKED", label: "Locked", description: "Closed and read-only." },
];

function statusVariant(status: string): "success" | "secondary" | "warning" {
  const s = status.toUpperCase();
  if (s === "SUBMITTED") return "success";
  if (s === "LOCKED") return "secondary";
  return "warning";
}

function PCQCard({ item }: { item: PCQListItem }) {
  const due = item.dueAt ? new Date(item.dueAt) : null;
  const overdue = due && !Number.isNaN(due.getTime()) && due.getTime() < Date.now()
    && !["SUBMITTED", "LOCKED"].includes(item.status.toUpperCase());

  return (
    <Link
      href={`/patient/pcq/response/${item.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-surface px-5 py-4 transition hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-text">
            {item.template?.name ?? "Questionnaire"}
          </p>
          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted">
            {SCOPE_LABEL[item.responseScope] ?? item.responseScope}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {item.assignedByProviderName ? (
            <span className="inline-flex items-center gap-1">
              <UserRound className="size-3.5" /> {item.assignedByProviderName}
            </span>
          ) : null}
          {item.dueAt ? (
            <span className={cn("inline-flex items-center gap-1", overdue && "font-medium text-danger")}>
              <CalendarClock className="size-3.5" /> Due {formatDate(item.dueAt)}
            </span>
          ) : null}
          {item.submittedAt ? <span>Submitted {formatDate(item.submittedAt)}</span> : null}
        </div>
        {item.assignmentReason ? (
          <p className="line-clamp-1 text-xs text-muted italic">{item.assignmentReason}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={statusVariant(item.status)}>{item.status.replace(/_/g, " ")}</Badge>
        <ChevronRight className="size-4 text-muted" />
      </div>
    </Link>
  );
}

export function PCQListView() {
  const { data, loading, error } = useQuery<{ myPcqResponses: PCQListItem[] }>(
    PATIENT_PCQ_LIST_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  if (loading && !data) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-border/40" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-warning">
        Unable to load your questionnaires. Please try again.
      </div>
    );
  }

  const responses = data?.myPcqResponses ?? [];

  if (responses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-12 text-center">
        <ClipboardList className="size-9 text-muted/50" />
        <p className="text-sm font-medium text-text">No questionnaires yet</p>
        <p className="text-xs text-muted">Questionnaires from onboarding, appointments, and your care team appear here.</p>
      </div>
    );
  }

  // Group, preserving a "known status first, then anything else" order.
  const knownKeys = STATUS_GROUPS.map((g) => g.key);
  const grouped = STATUS_GROUPS.map((group) => ({
    ...group,
    items: responses.filter((r) => r.status.toUpperCase() === group.key),
  })).filter((g) => g.items.length > 0);

  const otherItems = responses.filter((r) => !knownKeys.includes(r.status.toUpperCase()));

  return (
    <div className="space-y-8">
      {grouped.map((group) => (
        <section key={group.key} className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-text">{group.label}</h2>
            <p className="text-xs text-muted">{group.description}</p>
          </div>
          <div className="space-y-2">
            {group.items.map((item) => <PCQCard key={item.id} item={item} />)}
          </div>
        </section>
      ))}

      {otherItems.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-text">Other</h2>
          <div className="space-y-2">
            {otherItems.map((item) => <PCQCard key={item.id} item={item} />)}
          </div>
        </section>
      ) : null}
    </div>
  );
}
