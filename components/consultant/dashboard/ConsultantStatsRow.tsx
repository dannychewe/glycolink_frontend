"use client";

import { useQuery } from "@apollo/client";
import { Icons, type LucideIcon } from "@/components/ui/icons";
import { cn } from "@/lib/utils/cn";
import {
  TODAYS_APPOINTMENTS_QUERY,
  UPCOMING_APPOINTMENTS_QUERY,
} from "@/lib/bookings/graphql";
import { PENDING_LAB_REVIEWS_QUERY } from "@/lib/consultant/labs-graphql";
import { PROVIDER_PATIENT_ALERTS_QUERY } from "@/lib/monitoring/graphql";

function Tile({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  sublabel: string;
  icon: LucideIcon;
  tone?: "neutral" | "warning" | "danger";
}) {
  const valueTone =
    tone === "danger" ? "text-danger" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div className="bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <Icon className={cn("size-4 shrink-0", tone === "neutral" ? "text-muted" : valueTone)} />
      </div>
      <p className={cn("mt-2 text-3xl font-semibold leading-none tabular-nums", valueTone)}>{value}</p>
      <p className="mt-1.5 text-xs text-muted">{sublabel}</p>
    </div>
  );
}

export function ConsultantStatsRow() {
  const { data: todays } = useQuery(TODAYS_APPOINTMENTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: upcoming } = useQuery(UPCOMING_APPOINTMENTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const { data: labs } = useQuery(PENDING_LAB_REVIEWS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const { data: alerts } = useQuery(PROVIDER_PATIENT_ALERTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });

  const todaysCount = todays?.todaysAppointments?.length ?? 0;
  const upcomingCount = upcoming?.upcomingAppointments?.length ?? 0;
  const pendingLabsCount = labs?.pendingLabReviews?.length ?? 0;
  const activeAlerts =
    alerts?.providerPatientAlerts?.filter(
      (a: { alert: { acknowledgedAt: string | null } }) => !a.alert.acknowledgedAt,
    ).length ?? 0;

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
      <Tile label="Today" value={todaysCount} sublabel={todaysCount === 1 ? "appointment" : "appointments"} icon={Icons.appointments} />
      <Tile label="Upcoming" value={upcomingCount} sublabel="scheduled ahead" icon={Icons.upcoming} />
      <Tile
        label="Pending labs"
        value={pendingLabsCount}
        sublabel="awaiting review"
        icon={Icons.labs}
        tone={pendingLabsCount > 0 ? "warning" : "neutral"}
      />
      <Tile
        label="Active alerts"
        value={activeAlerts}
        sublabel="need attention"
        icon={Icons.alerts}
        tone={activeAlerts > 0 ? "danger" : "neutral"}
      />
    </div>
  );
}
