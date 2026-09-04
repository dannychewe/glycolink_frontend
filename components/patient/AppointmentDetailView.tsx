"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { CalendarClock, Video } from "lucide-react";
import { AppointmentActionModal } from "@/components/patient/appointments/AppointmentActionModal";
import { PaymentsComingSoonNotice } from "@/components/patient/payments/PaymentsComingSoonNotice";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusBadge, toneForLifecycleStatus } from "@/components/design-system";
import { useCountdown } from "@/hooks/use-countdown";
import {
  APPOINTMENT_QUERY,
  AVAILABLE_SLOTS_QUERY,
  CANCEL_APPOINTMENT_MUTATION,
  PENDING_ACTIONS_QUERY,
  RESCHEDULE_APPOINTMENT_MUTATION,
} from "@/lib/bookings/graphql";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";
import { canJoinVideoConsultation } from "@/lib/video-consultation-graphql";

type AppointmentDetailViewProps = Readonly<{
  appointmentId: string;
}>;

type AppointmentData = {
  appointment: AppointmentItem | null;
};

type AppointmentItem = {
  id: string;
  providerId: string;
  patientId: string;
  consultationType: string | null;
  startsAt: string;
  endsAt: string | null;
  status: string;
  cancelReason: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
};

type PendingActionsData = {
  pendingActions: Array<{
    action: string;
    title: string;
    description: string;
    status: string;
    dueAt: string | null;
    appointment: {
      id: string;
      patientId?: string;
      providerId?: string;
      organizationId?: string | null;
      status?: string;
      startsAt?: string;
      endsAt?: string | null;
      consultationType?: string | null;
      source?: string | null;
    } | null;
    provider: {
      id: string;
      displayName: string;
      specialties?: string[];
      consultationFee?: string | number | null;
      shortBio?: string | null;
    } | null;
  }>;
};

type ProviderData = {
  provider: {
    id: string;
    displayName: string;
    specialties: string[];
    consultationFeeInitial: string | null;
  } | null;
};

type AvailableSlotsData = {
  availableSlots: Array<{
    startTime: string;
    endTime: string;
  }>;
};

type CancelAppointmentData = {
  cancelAppointment: {
    appointment: {
      id: string;
      status: string;
      cancelledAt: string | null;
      cancelReason: string | null;
    };
  };
};

type RescheduleAppointmentData = {
  rescheduleAppointment: {
    appointment: {
      id: string;
      status: string;
      startsAt: string;
      endsAt: string | null;
    };
  };
};

function normalizeStatus(status: string) {
  return status.trim().toUpperCase();
}

function formatStatus(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "AWAITING_PAYMENT") return "Awaiting Payment";
  if (normalized === "IN_PROGRESS") return "In Progress";
  if (normalized === "CHECKED_IN") return "Checked In";
  if (normalized === "NO_SHOW") return "No Show";
  return normalized.charAt(0) + normalized.slice(1).toLowerCase();
}

function formatDateTime(value: string | null) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isTelemedicine(value: string | null | undefined) {
  return value?.trim().toLowerCase() === "telemedicine";
}

function formatPendingActionType(action: string) {
  if (action === "PCQ_NOT_COMPLETED") return "Questionnaire";
  if (action === "PAYMENT_PENDING") return "Payment";
  return action.replace(/_/g, " ").toLowerCase();
}

function mapAppointmentError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "APPOINTMENT_NOT_FOUND") return "Appointment not found.";
  if (code === "APPOINTMENT_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
    return "You do not have access to this appointment.";
  }
  if (code === "PROVIDER_NOT_AVAILABLE") return "Provider is unavailable for this action.";
  if (code === "PROVIDER_VISIBILITY_RESTRICTED") {
    return "This provider is not available under your clinic's consultant access settings.";
  }
  if (code === "SLOT_UNAVAILABLE") return "The selected slot is no longer available.";
  if (code === "INVALID_SLOT") return "Invalid slot selected.";
  if (code === "INVALID_STATUS_TRANSITION") return "This status transition is not allowed.";
  if (code === "PAYMENT_REQUIRED") return "Payment is required before this action.";
  return getGraphQLErrorMessage(error, "Unable to process this request right now.");
}

export function AppointmentDetailView({ appointmentId }: AppointmentDetailViewProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState("");
  const [selectedRescheduleStartTime, setSelectedRescheduleStartTime] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: appointmentData,
    loading: appointmentLoading,
    error: appointmentError,
    refetch: refetchAppointment,
  } = useQuery<AppointmentData>(APPOINTMENT_QUERY, {
    variables: { id: appointmentId },
    fetchPolicy: "network-only",
  });
  const appointment = appointmentData?.appointment ?? null;

  const {
    data: providerData,
    loading: providerLoading,
  } = useQuery<ProviderData>(PROVIDER_QUERY, {
    variables: appointment ? { id: appointment.providerId } : undefined,
    skip: !appointment,
    fetchPolicy: "network-only",
  });
  const { data: pendingActionsData } = useQuery<PendingActionsData>(PENDING_ACTIONS_QUERY, {
    variables: { appointmentId },
    fetchPolicy: "network-only",
  });
  const {
    data: slotsData,
    loading: slotsLoading,
    error: slotsError,
    refetch: refetchSlots,
  } = useQuery<AvailableSlotsData>(AVAILABLE_SLOTS_QUERY, {
    variables:
      appointment && selectedRescheduleDate
        ? { providerId: appointment.providerId, date: selectedRescheduleDate }
        : undefined,
    skip: !appointment || !selectedRescheduleDate || !isRescheduleModalOpen,
    fetchPolicy: "network-only",
  });

  const [cancelAppointment, { loading: isCancelling }] = useMutation<CancelAppointmentData>(
    CANCEL_APPOINTMENT_MUTATION,
  );
  const [rescheduleAppointment, { loading: isRescheduling }] =
    useMutation<RescheduleAppointmentData>(RESCHEDULE_APPOINTMENT_MUTATION);

  const provider = providerData?.provider ?? null;
  const status = normalizeStatus(appointment?.status ?? "");
  const isTerminal =
    status === "COMPLETED" ||
    status === "CANCELLED" ||
    status === "NO_SHOW" ||
    status === "RESCHEDULED";
  const canCancel = !isTerminal;
  const canReschedule =
    status === "REQUESTED" ||
    status === "AWAITING_PAYMENT" ||
    status === "CONFIRMED" ||
    status === "CHECKED_IN";
  const canJoin = canJoinVideoConsultation(appointment?.consultationType, status);
  const canPay = status === "AWAITING_PAYMENT";

  const isUpcomingTelemedicine =
    isTelemedicine(appointment?.consultationType) && !isTerminal && !canJoin;
  const startCountdown = useCountdown(
    isUpcomingTelemedicine ? appointment?.startsAt : null,
    { warnSeconds: 900, criticalSeconds: 300 },
  );

  // The query is now scoped server-side to this appointment (pendingActions(appointmentId:)),
  // not just "whatever's next" — no client-side filtering needed to match it up.
  const prioritizedPendingActions = [...(pendingActionsData?.pendingActions ?? [])].sort((a, b) => {
    const priority = (action: string) => {
      if (action === "PCQ_NOT_COMPLETED") return 0;
      if (action === "PAYMENT_PENDING") return 1;
      return 2;
    };
    return priority(a.action) - priority(b.action);
  });
  const primaryPendingAction = prioritizedPendingActions[0] ?? null;
  const hasBlockingPendingActions = prioritizedPendingActions.some((action) =>
    action.action === "PCQ_NOT_COMPLETED" || action.action === "PAYMENT_PENDING",
  );
  const rescheduleSlots = slotsData?.availableSlots ?? [];

  async function handleConfirmCancel() {
    if (!appointment) return;
    setActionError(null);
    try {
      await cancelAppointment({
        variables: {
          appointmentId: appointment.id,
          reason: "Cancelled by patient",
        },
      });
      await refetchAppointment();
      setIsCancelModalOpen(false);
    } catch (error) {
      setActionError(mapAppointmentError(error));
    }
  }

  async function handleConfirmReschedule() {
    if (!appointment || !selectedRescheduleStartTime) return;
    const selectedSlot = rescheduleSlots.find(
      (slot) => slot.startTime === selectedRescheduleStartTime,
    );
    if (!selectedSlot) {
      setActionError("Select a valid slot to reschedule.");
      return;
    }

    setActionError(null);
    try {
      await rescheduleAppointment({
        variables: {
          appointmentId: appointment.id,
          newStartTime: selectedSlot.startTime,
          newEndTime: selectedSlot.endTime,
        },
      });
      await refetchAppointment();
      setIsRescheduleModalOpen(false);
      setSelectedRescheduleDate("");
      setSelectedRescheduleStartTime("");
    } catch (error) {
      setActionError(mapAppointmentError(error));
    }
  }

  if (appointmentLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Loading appointment...</p>
        </CardContent>
      </Card>
    );
  }

  if (appointmentError || !appointment) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-semibold text-text">Appointment not found</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{appointmentError ? "Unable to load appointment details." : "Appointment not found."}</p>
          <Button href="/patient/bookings" variant="secondary">
            Back to appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        breadcrumbs={[
          { label: "Appointments", href: "/patient/bookings" },
          { label: provider?.displayName ?? "Appointment" },
        ]}
        title={providerLoading ? "Loading provider…" : provider?.displayName ?? "Appointment"}
        description={formatDateTime(appointment.startsAt)}
        actions={<StatusBadge tone={toneForLifecycleStatus(status)} label={formatStatus(status)} />}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Next step</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {primaryPendingAction ? (
            <div className="rounded-lg border border-l-4 border-l-warning bg-surface px-4 py-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-warning">
                {formatPendingActionType(primaryPendingAction.action)}
              </p>
              <p className="mt-1 text-base font-semibold text-text">{primaryPendingAction.title}</p>
              <p className="mt-1 text-base text-muted">{primaryPendingAction.description}</p>
              {primaryPendingAction.dueAt ? (
                <p className="mt-2 text-sm text-muted">Due {formatDateTime(primaryPendingAction.dueAt)}</p>
              ) : null}

              <div className="mt-4">
                {primaryPendingAction.action === "PCQ_NOT_COMPLETED" ? (
                  <Button href={`/patient/pcq/${appointment.id}`}>
                    Complete questionnaire
                  </Button>
                ) : primaryPendingAction.action === "PAYMENT_PENDING" ? (
                  <Button type="button" disabled>
                    Payment handled off-platform
                  </Button>
                ) : (
                  <Button href={`/patient/bookings/${appointment.id}`} variant="secondary">
                    Open appointment
                  </Button>
                )}
              </div>
            </div>
          ) : canJoin ? (
            <Button href={`/patient/bookings/${appointment.id}/video`} fullWidth>
              Join consultation
            </Button>
          ) : isUpcomingTelemedicine ? (
            <div className="rounded-lg border border-border bg-background px-4 py-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-primary">
                  <Video className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-base font-semibold text-text">Video consultation</p>
                  <p className="text-base text-muted">
                    Joining opens when your consultant starts the session.
                  </p>
                  {startCountdown && !startCountdown.isExpired ? (
                    <p className="text-base text-muted">
                      Scheduled to start in{" "}
                      <span className="font-semibold tabular-nums text-text">
                        {startCountdown.label}
                      </span>
                    </p>
                  ) : (
                    <p className="text-base text-muted">
                      Scheduled for {formatDateTime(appointment.startsAt)}
                    </p>
                  )}
                </div>
              </div>
              <Button type="button" disabled fullWidth className="mt-3">
                <CalendarClock className="size-4" />
                Waiting for consultant
              </Button>
            </div>
          ) : status === "COMPLETED" ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/patient/records" fullWidth>
                View consultation summary
              </Button>
              <Button href="/patient/messages" variant="secondary" fullWidth>
                Message consultant
              </Button>
            </div>
          ) : (
            <p className="text-base text-muted">No action is needed right now.</p>
          )}

          {prioritizedPendingActions.length > 1 ? (
            <div className="space-y-2 border-t border-border pt-4">
              <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
                Other pending actions
              </p>
              {prioritizedPendingActions.slice(1).map((action) => (
                <div key={`${action.action}-${action.dueAt ?? "none"}`} className="text-base text-muted">
                  <span className="font-medium text-text">{action.title}</span>
                  {action.dueAt ? ` · Due ${formatDateTime(action.dueAt)}` : ""}
                </div>
              ))}
            </div>
          ) : null}

          {actionError ? (
            <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-base text-warning">
              {actionError}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Appointment overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Consultation type</p>
            <p className="text-base font-medium text-text">
              {appointment.consultationType ?? "telemedicine"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Consultation fee</p>
            <p className="text-base font-medium text-text">
              {provider?.consultationFeeInitial != null ? `ZMW ${provider.consultationFeeInitial}` : "On request"}
            </p>
          </div>
          {appointment.cancelReason ? (
            <div className="sm:col-span-2">
              <p className="text-sm text-muted">Cancellation reason</p>
              <p className="text-base font-medium text-text">{appointment.cancelReason}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Appointment management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canPay && !hasBlockingPendingActions ? (
            <Button
              type="button"
              fullWidth
              onClick={() => {
                setActionError(null);
                setIsPaymentModalOpen(true);
              }}
            >
              Payment guidance
            </Button>
          ) : null}

          {canJoin && !hasBlockingPendingActions ? (
            <Button href={`/patient/bookings/${appointment.id}/video`} fullWidth>
              Join video consultation
            </Button>
          ) : null}

          {canReschedule ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => {
                setActionError(null);
                setIsRescheduleModalOpen(true);
              }}
            >
              Reschedule
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              type="button"
              variant="ghost"
              fullWidth
              onClick={() => {
                setActionError(null);
                setIsCancelModalOpen(true);
              }}
            >
              Cancel Appointment
            </Button>
          ) : null}

          {hasBlockingPendingActions ? (
            <p className="rounded-lg border border-border bg-background px-3 py-2 text-base text-muted">
              Complete the next step above before appointment actions unlock.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isPaymentModalOpen ? (
        <AppointmentActionModal
          title="Payment"
          onClose={() => setIsPaymentModalOpen(false)}
          cancelLabel="Close"
          showFooterActions={false}
        >
          <PaymentsComingSoonNotice />
          <div className="mt-4 flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>
              Close
            </Button>
          </div>
        </AppointmentActionModal>
      ) : null}

      {isCancelModalOpen ? (
        <AppointmentActionModal
          title="Cancel Appointment"
          description="Are you sure you want to cancel this appointment?"
          confirmLabel="Confirm Cancellation"
          cancelLabel="Keep Appointment"
          isLoading={isCancelling}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={() => void handleConfirmCancel()}
        />
      ) : null}

      {isRescheduleModalOpen ? (
        <AppointmentActionModal
          title="Reschedule Appointment"
          description="Choose a new date and slot for your appointment."
          isLoading={isRescheduling}
          onClose={() => setIsRescheduleModalOpen(false)}
          showFooterActions={false}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="rescheduleDate" className="text-sm font-medium text-text">
                New date
              </label>
              <Input
                id="rescheduleDate"
                type="date"
                value={selectedRescheduleDate}
                onChange={async (event) => {
                  const date = event.target.value;
                  setSelectedRescheduleDate(date);
                  setSelectedRescheduleStartTime("");
                  if (appointment && date) {
                    await refetchSlots({ providerId: appointment.providerId, date });
                  }
                }}
              />
            </div>

            {slotsLoading ? <p className="text-sm text-muted">Loading available slots...</p> : null}

            {slotsError ? (
              <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-base text-warning">
                {mapAppointmentError(slotsError)}
              </p>
            ) : null}

            {selectedRescheduleDate && !slotsLoading && !slotsError ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {rescheduleSlots.length === 0 ? (
                  <p className="text-sm text-muted">No slots available for this date.</p>
                ) : (
                  rescheduleSlots.map((slot) => {
                    const isSelected = selectedRescheduleStartTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        type="button"
                        onClick={() => setSelectedRescheduleStartTime(slot.startTime)}
                        className={`rounded-xl border px-4 py-3 text-left text-base transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background hover:border-primary/40 hover:bg-primary/5"
                        }`}
                      >
                        {formatDateTime(slot.startTime)}
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsRescheduleModalOpen(false)}
                disabled={isRescheduling}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => void handleConfirmReschedule()}
                disabled={isRescheduling || !selectedRescheduleStartTime}
              >
                {isRescheduling ? "Please wait..." : "Confirm Reschedule"}
              </Button>
            </div>
          </div>
        </AppointmentActionModal>
      ) : null}
    </div>
  );
}
