import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DIABETES_TYPE_OPTIONS } from "@/lib/patient/clinical-profile-graphql";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";

export function StepDiabetesProfile() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PatientOnboardingValues>();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="diabetesType">Diabetes Type</Label>
        <select
          id="diabetesType"
          className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          {...register("diabetesType")}
        >
          <option value="">Select diabetes type</option>
          {DIABETES_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.diabetesType?.message ? (
          <p className="text-sm text-danger">{errors.diabetesType.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosisDate">Diagnosis Date</Label>
        <Input id="diagnosisDate" type="date" {...register("diagnosisDate")} />
        {errors.diagnosisDate?.message ? (
          <p className="text-sm text-danger">{errors.diagnosisDate.message}</p>
        ) : null}
      </div>
    </div>
  );
}
