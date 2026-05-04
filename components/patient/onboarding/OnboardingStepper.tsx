import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type OnboardingStepperProps = Readonly<{
  steps: string[];
  currentStep: number;
}>;

export function OnboardingStepper({ steps, currentStep }: OnboardingStepperProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-start">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={step} className="flex items-start">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200",
                    isActive && "bg-primary text-white shadow-md ring-4 ring-primary/20",
                    isComplete && "bg-success text-white",
                    !isActive && !isComplete && "bg-slate-100 text-slate-400 ring-1 ring-border",
                  )}
                >
                  {isComplete ? <Check className="size-4" strokeWidth={2.5} /> : index + 1}
                </div>
                <span
                  className={cn(
                    "w-[72px] text-center text-[10px] font-medium leading-tight",
                    isActive ? "text-primary" : isComplete ? "text-success" : "text-muted",
                  )}
                >
                  {step}
                </span>
              </div>

              {!isLast && (
                <div
                  className={cn(
                    "mx-1 mt-4 h-px w-8 shrink-0 transition-colors duration-300",
                    isComplete ? "bg-success" : "bg-border",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
