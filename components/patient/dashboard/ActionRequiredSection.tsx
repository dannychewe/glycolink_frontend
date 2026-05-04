import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { DashboardPendingAction, PatientDashboardData } from "@/types";

type ActionRequiredSectionProps = Readonly<{
  pendingActions: DashboardPendingAction[];
  appointmentId: PatientDashboardData["nextAppointment"]["id"];
}>;

function getActionLabel(type: DashboardPendingAction["type"]) {
  return type === "PAYMENT" ? "Pay Now" : "Complete Questionnaire";
}

function getActionHref(
  type: DashboardPendingAction["type"],
  appointmentId: string,
) {
  return type === "PAYMENT" ? `/patient/bookings/${appointmentId}` : `/patient/pcq/${appointmentId}`;
}

export function ActionRequiredSection({
  pendingActions,
  appointmentId,
}: ActionRequiredSectionProps) {
  if (pendingActions.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl">Action Required</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        {pendingActions.map((action) => (
          <Card key={`${action.type}-${action.message}`} className="border-warning/20">
            <CardHeader className="pb-4">
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-warning">
                {action.type === "PAYMENT" ? "Payment" : "Questionnaire"}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>{action.message}</p>
              <Button href={getActionHref(action.type, appointmentId)} variant="secondary">
                {getActionLabel(action.type)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
