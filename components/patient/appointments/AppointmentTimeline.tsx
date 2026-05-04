import { cn } from "@/lib/utils/cn";
import type { Appointment } from "@/types";

type AppointmentTimelineProps = Readonly<{
  appointment: Appointment;
}>;

const timelineSteps = [
  { id: "created", label: "Appointment Created" },
  { id: "questionnaire", label: "Questionnaire" },
  { id: "payment", label: "Payment" },
  { id: "consultation", label: "Consultation" },
  { id: "completed", label: "Completed" },
] as const;

function getCurrentStepIndex(appointment: Appointment) {
  if (appointment.status === "COMPLETED") {
    return 4;
  }

  if (appointment.status === "IN_PROGRESS") {
    return 3;
  }

  if (appointment.status === "CONFIRMED") {
    return 3;
  }

  if (appointment.paymentStatus === "PAID") {
    return 2;
  }

  if (appointment.status !== "REQUESTED") {
    return 1;
  }

  return 0;
}

export function AppointmentTimeline({ appointment }: AppointmentTimelineProps) {
  const currentStepIndex = getCurrentStepIndex(appointment);
  const isStoppedState =
    appointment.status === "CANCELLED" || appointment.status === "NO_SHOW";

  return (
    <div className="space-y-4">
      {timelineSteps.map((step, index) => {
        const isComplete = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex size-9 items-center justify-center rounded-full text-sm font-semibold",
                  isStoppedState && index > currentStepIndex
                    ? "bg-slate-100 text-muted"
                    : isCurrent
                      ? "bg-primary text-white"
                      : isComplete
                        ? "bg-success text-white"
                        : "bg-slate-100 text-muted",
                )}
              >
                {index + 1}
              </div>
              {index < timelineSteps.length - 1 ? (
                <div className="mt-2 h-10 w-px bg-border" />
              ) : null}
            </div>
            <div className="pb-5 pt-1">
              <p className="text-sm font-semibold text-text">{step.label}</p>
              <p className="text-sm text-muted">
                {step.id === "questionnaire"
                  ? appointment.status === "REQUESTED"
                    ? "Pending submission"
                    : "Submitted"
                  : step.id === "payment"
                    ? appointment.paymentStatus === "PAID"
                      ? "Completed"
                      : "Pending payment"
                    : isCurrent
                      ? "Current step"
                      : isComplete
                        ? "Completed"
                        : isStoppedState
                          ? "Not reached"
                          : "Pending"}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
