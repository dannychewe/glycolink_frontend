import { ConsultantAppointmentStatusBadge } from "@/components/consultant/appointments/ConsultantAppointmentStatusBadge";
import { ConsultantPaymentStatusBadge } from "@/components/consultant/appointments/ConsultantPaymentStatusBadge";
import { ConsultantPcqStatusBadge } from "@/components/consultant/appointments/ConsultantPcqStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConsultantWorklistAppointment } from "@/types";

type ConsultantAppointmentCardProps = Readonly<{
  appointment: ConsultantWorklistAppointment;
}>;

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

function getPrimaryAction(appointment: ConsultantWorklistAppointment) {
  if (appointment.status === "READY") {
    return {
      label: "Start Consultation",
      href: `/consultant/consultations/${appointment.id}`,
    };
  }

  if (appointment.status === "IN_PROGRESS") {
    return {
      label: "Resume Consultation",
      href: `/consultant/consultations/${appointment.id}`,
    };
  }

  if (appointment.status === "COMPLETED") {
    return {
      label: "View Encounter",
      href: `/consultant/patients/${appointment.patientId}`,
    };
  }

  return {
    label: "View Details",
    href: `/consultant/patients/${appointment.patientId}`,
  };
}

export function ConsultantAppointmentCard({
  appointment,
}: ConsultantAppointmentCardProps) {
  const needsPcqAttention = appointment.pcqStatus !== "SUBMITTED";
  const needsPaymentAttention = appointment.paymentStatus !== "PAID";
  const primaryAction = getPrimaryAction(appointment);

  return (
    <Card>
      <CardContent className="px-5 py-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-base font-semibold text-text">{appointment.patientName}</p>
              <p className="text-sm text-muted">
                {formatAppointmentDate(appointment.date)} at {appointment.time}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ConsultantAppointmentStatusBadge status={appointment.status} />
              <ConsultantPcqStatusBadge status={appointment.pcqStatus} />
              <ConsultantPaymentStatusBadge status={appointment.paymentStatus} />
            </div>

            {needsPcqAttention || needsPaymentAttention ? (
              <div className="flex flex-wrap gap-2">
                {needsPcqAttention ? (
                  <Badge variant="warning">PCQ requires attention</Badge>
                ) : null}
                {needsPaymentAttention ? (
                  <Badge variant="warning">Payment incomplete</Badge>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
            <Button
              href={primaryAction.href}
              variant="secondary"
              fullWidth
              className="xl:w-auto"
            >
              {primaryAction.label}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
