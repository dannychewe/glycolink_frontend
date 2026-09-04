"use client";

import { useQuery } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { Icons } from "@/components/ui/icons";
import { PENDING_ACTIONS_QUERY, UPCOMING_APPOINTMENT_QUERY } from "@/lib/bookings/graphql";
import { canJoinVideoConsultation } from "@/lib/video-consultation-graphql";

type UpcomingAppointmentData = {
  upcomingAppointment: {
    appointment: {
      id: string;
      status: string;
      startsAt: string;
      consultationType: string | null;
    };
    provider: {
      displayName?: string | null;
    };
  } | null;
};

type PendingActionsData = {
  pendingActions: Array<{
    action: string;
    title: string;
  }>;
};

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Summary-only — no in-place actions beyond a single tap-through per state. */
export function UpcomingAppointmentPanel() {
  const { data, loading } = useQuery<UpcomingAppointmentData>(UPCOMING_APPOINTMENT_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const pendingQuery = useQuery<PendingActionsData>(PENDING_ACTIONS_QUERY, {
    fetchPolicy: "cache-and-network",
    skip: !data?.upcomingAppointment,
  });

  const upcoming = data?.upcomingAppointment;
  if (loading && !upcoming) return null;
  if (!upcoming) return null;

  const pendingAction = pendingQuery.data?.pendingActions?.[0] ?? null;
  const canJoin = canJoinVideoConsultation(upcoming.appointment.consultationType, upcoming.appointment.status);
  const href = `/patient/bookings/${upcoming.appointment.id}${canJoin ? "/video" : ""}`;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.upcoming}>Upcoming Appointment</PanelTitle>
      </PanelHeader>
      <PanelBody className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-text">
            {upcoming.provider.displayName ?? "Your consultant"}
          </p>
          <p className="mt-1 text-sm text-muted">{formatWhen(upcoming.appointment.startsAt)}</p>
        </div>
        <Button href={href} size="sm">
          {canJoin ? "Join call" : pendingAction ? pendingAction.title : "View details"}
        </Button>
      </PanelBody>
    </Panel>
  );
}
