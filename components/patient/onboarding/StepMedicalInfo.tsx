import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";

function OptionalBadge() {
  return (
    <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
      Optional
    </span>
  );
}

export function StepMedicalInfo() {
  const { register } = useFormContext<PatientOnboardingValues>();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="allergies">
          Allergies <OptionalBadge />
        </Label>
        <Textarea
          id="allergies"
          placeholder="e.g. Penicillin, latex, peanuts…"
          {...register("allergies")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="currentMedications">
          Current Medications <OptionalBadge />
        </Label>
        <Textarea
          id="currentMedications"
          placeholder="e.g. Metformin 500 mg twice daily…"
          {...register("currentMedications")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalNotes">
          Additional Notes <OptionalBadge />
        </Label>
        <Textarea
          id="additionalNotes"
          placeholder="Anything else relevant for your care team…"
          {...register("additionalNotes")}
        />
      </div>
    </div>
  );
}
