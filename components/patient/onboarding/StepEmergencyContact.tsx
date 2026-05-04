import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";

export function StepEmergencyContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PatientOnboardingValues>();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
        <Input id="emergencyContactName" {...register("emergencyContactName")} />
        {errors.emergencyContactName?.message ? (
          <p className="text-sm text-danger">{errors.emergencyContactName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactRelationship">Relationship</Label>
        <Input id="emergencyContactRelationship" {...register("emergencyContactRelationship")} />
        {errors.emergencyContactRelationship?.message ? (
          <p className="text-sm text-danger">{errors.emergencyContactRelationship.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="emergencyContactPhone">Phone</Label>
        <Input id="emergencyContactPhone" type="tel" {...register("emergencyContactPhone")} />
        {errors.emergencyContactPhone?.message ? (
          <p className="text-sm text-danger">{errors.emergencyContactPhone.message}</p>
        ) : null}
      </div>
    </div>
  );
}
