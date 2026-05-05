"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AppointmentActionModal } from "@/components/patient/appointments/AppointmentActionModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AVAILABLE_SLOTS_QUERY,
  CANCEL_APPOINTMENT_MUTATION,
  MY_APPOINTMENTS_QUERY,
  PENDING_ACTIONS_QUERY,
  RESCHEDULE_APPOINTMENT_MUTATION,
} from "@/lib/bookings/graphql";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { PROVIDER_QUERY } from "@/lib/providers/directory-graphql";

type AppointmentDetailViewProps = Readonly<{
  appointmentId: string;
}>;

type MyAppointmentsData = {
  myAppointments: AppointmentItem[];
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
    status: string;
    appointment: {
      id: string;
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

function getStatusVariant(status: string) {
  const normalized = normalizeStatus(status);
  if (normalized === "CONFIRMED" || normalized === "COMPLETED") return "success" as const;
  if (normalized === "AWAITING_PAYMENT" || normalized === "PENDING") return "warning" as const;
  if (normalized === "IN_PROGRESS" || normalized === "CHECKED_IN") return "primary" as const;
  if (
    normalized === "CANCELLED" ||
    normalized === "NO_SHOW" ||
    normalized === "RESCHEDULED"
  )
    return "danger" as const;
  return "secondary" as const;
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

function mapAppointmentError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "APPOINTMENT_NOT_FOUND") return "Appointment not found.";
  if (code === "APPOINTMENT_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
    return "You do not have access to this appointment.";
  }
  if (code === "PROVIDER_NOT_AVAILABLE") return "Provider is unavailable for this action.";
  if (code === "SLOT_UNAVAILABLE") return "The selected slot is no longer available.";
  if (code === "INVALID_SLOT") return "Invalid slot selected.";
  if (code === "INVALID_STATUS_TRANSITION") return "This status transition is not allowed.";
  if (code === "PAYMENT_REQUIRED") return "Payment is required before this action.";
  return getGraphQLErrorMessage(error, "Unable to process this request right now.");
}

export function AppointmentDetailView({ appointmentId }: AppointmentDetailViewProps) {
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState("");
  const [selectedRescheduleStartTime, setSelectedRescheduleStartTime] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: appointmentsData,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
  } = useQuery<MyAppointmentsData>(MY_APPOINTMENTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "network-only",
  });
  const appointment = useMemo(
    () => (appointmentsData?.myAppointments ?? []).find((item) => item.id === appointmentId) ?? null,
    [appointmentId, appointmentsData?.myAppointments],
  );

  const {
    data: providerData,
    loading: providerLoading,
  } = useQuery<ProviderData>(PROVIDER_QUERY, {
    variables: appointment ? { id: appointment.providerId } : undefined,
    skip: !appointment,
    fetchPolicy: "network-only",
  });
  const { data: pendingActionsData } = useQuery<PendingActionsData>(PENDING_ACTIONS_QUERY, {
    fetchPolicy: "network-only",
  });
  const {
    data: slotsData,
    loading: slotsLoading,
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
  const canCancel =
    !isTerminal &&
    status !== "PENDING" &&
    status !== "REQUESTED" &&
    status !== "AWAITING_PAYMENT"
      ? true
      : !isTerminal;
  const canReschedule =
    status === "REQUESTED" ||
    status === "AWAITING_PAYMENT" ||
    status === "CONFIRMED" ||
    status === "CHECKED_IN";
  const canJoin = status === "CONFIRMED" || status === "CHECKED_IN" || status === "IN_PROGRESS";
  const canPay = status === "AWAITING_PAYMENT";

  const hasPendingPcq = (pendingActionsData?.pendingActions ?? []).some(
    (action) =>
      action.action === "PCQ_NOT_COMPLETED" && action.appointment?.id === appointment?.id,
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
      await refetchAppointments();
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
      await refetchAppointments();
      setIsRescheduleModalOpen(false);
      setSelectedRescheduleDate("");
      setSelectedRescheduleStartTime("");
    } catch (error) {
      setActionError(mapAppointmentError(error));
    }
  }

  if (appointmentsLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p>Loading appointment...</p>
        </CardContent>
      </Card>
    );
  }

  if (appointmentsError || !appointment) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <h1 className="text-2xl font-semibold text-text">Appointment not found</h1>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>{appointmentsError ? "Unable to load appointment details." : "Appointment not found."}</p>
          <Button href="/patient/bookings" variant="secondary">
            Back to appointments
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Appointment overview
            </p>
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">
              {providerLoading ? "Loading provider..." : provider?.displayName ?? "Provider"}
            </h1>
            <p className="text-sm text-muted">{formatDateTime(appointment.startsAt)}</p>
          </div>
          <div className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            getStatusVariant(status) === "success"
              ? "bg-success/10 text-success"
              : getStatusVariant(status) === "warning"
                ? "bg-warning/10 text-warning"
                : getStatusVariant(status) === "danger"
                  ? "bg-danger/10 text-danger"
                  : getStatusVariant(status) === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-slate-100 text-muted"
          }`}>
            {formatStatus(status)}
          </div>
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
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPendingPcq ? (
            <Button href={`/patient/pcq/${appointment.id}`} variant="secondary" fullWidth>
              Complete Questionnaire
            </Button>
          ) : null}

          {canPay ? (
            <Button href="/patient/payments" fullWidth>
              Proceed to Payment
            </Button>
          ) : null}

          {canJoin ? (
            <Button href={`/patient/bookings/${appointment.id}`} fullWidth>
              Join Consultation
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

          {actionError ? (
            <p className="rounded-xl border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
              {actionError}
            </p>
          ) : null}
        </CardContent>
      </Card>

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

            {selectedRescheduleDate && !slotsLoading ? (
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
                        className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
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
