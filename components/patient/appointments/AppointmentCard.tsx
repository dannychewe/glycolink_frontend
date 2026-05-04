import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { Appointment } from "@/types";
import { AppointmentPaymentBadge } from "@/components/patient/appointments/AppointmentPaymentBadge";
import { AppointmentStatusBadge } from "@/components/patient/appointments/AppointmentStatusBadge";

type AppointmentCardProps = Readonly<{
  appointment: Appointment;
}>;

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function AppointmentCard({ appointment }: AppointmentCardProps) {
  const appointmentLabel =
    appointment.status === "COMPLETED" || appointment.status === "NO_SHOW"
      ? "Past appointment"
      : appointment.status === "CANCELLED"
        ? "Cancelled appointment"
        : "Upcoming appointment";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {appointmentLabel}
          </p>
          <p className="text-lg font-semibold text-text">{appointment.providerName}</p>
          <p className="text-sm font-medium text-primary">{appointment.providerSpecialty}</p>
          <p className="text-sm text-muted">
            {formatAppointmentDate(appointment.date)} at {appointment.time}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AppointmentStatusBadge status={appointment.status} />
          <AppointmentPaymentBadge status={appointment.paymentStatus} />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Button
          href={`/patient/bookings/${appointment.id}`}
          variant="secondary"
          fullWidth
          className="sm:w-auto"
        >
          View Details
        </Button>
      </CardContent>
    </Card>
  );
}
