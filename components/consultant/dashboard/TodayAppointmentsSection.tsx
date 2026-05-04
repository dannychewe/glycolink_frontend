import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ConsultantTodayAppointment } from "@/types";

type TodayAppointmentsSectionProps = Readonly<{
  appointments: ConsultantTodayAppointment[];
}>;

function getAppointmentBadgeVariant(status: ConsultantTodayAppointment["status"]) {
  return status === "IN_PROGRESS" ? "primary" : "secondary";
}

function getAppointmentAction(appointment: ConsultantTodayAppointment) {
  if (appointment.status === "IN_PROGRESS") {
    return {
      href: `/consultant/consultations/${appointment.id}`,
      label: "Resume Consultation",
    };
  }

  return {
    href: `/consultant/patients/${appointment.patientId}`,
    label: "Open Patient",
  };
}

export function TodayAppointmentsSection({
  appointments,
}: TodayAppointmentsSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle>Today&apos;s Appointments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-1">
              <Link
                href={`/consultant/patients/${appointment.patientId}`}
                className="text-sm font-semibold text-text transition hover:text-primary"
              >
                {appointment.patientName}
              </Link>
              <p className="text-sm text-muted">{appointment.time}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Badge variant={getAppointmentBadgeVariant(appointment.status)}>
                {appointment.status === "IN_PROGRESS" ? "In Progress" : "Upcoming"}
              </Badge>
              <Button
                href={getAppointmentAction(appointment).href}
                variant="secondary"
                className="sm:w-auto"
                fullWidth
              >
                {getAppointmentAction(appointment).label}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
