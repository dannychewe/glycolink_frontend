import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PatientDashboardData } from "@/types";

type NextAppointmentSectionProps = Readonly<{
  nextAppointment: PatientDashboardData["nextAppointment"];
}>;

function formatAppointmentDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function NextAppointmentSection({
  nextAppointment,
}: NextAppointmentSectionProps) {
  const isConfirmed = nextAppointment.status === "CONFIRMED";

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Next Appointment</h2>
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xl font-semibold text-text">{nextAppointment.providerName}</p>
            <p className="text-sm text-muted">
              {formatAppointmentDate(nextAppointment.date)} at {nextAppointment.time}
            </p>
          </div>
          <Badge variant={isConfirmed ? "success" : "warning"}>
            {nextAppointment.status}
          </Badge>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="secondary" fullWidth className="sm:flex-1">
            View Details
          </Button>
          {isConfirmed ? (
            <Button href="/" fullWidth className="sm:flex-1">
              Join Consultation
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
