import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConsultantOnboardingValues } from "@/lib/validation/consultant-onboarding";

export function StepProfile() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsultantOnboardingValues>();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="displayName">
          Display Name <span className="text-danger">*</span>
        </Label>
        <Input
          id="displayName"
          placeholder="Dr. Jane Banda"
          {...register("displayName")}
        />
        <p className="text-xs text-muted">
          This is the name patients will see on your profile.
        </p>
        {errors.displayName?.message ? (
          <p className="text-sm text-danger">{errors.displayName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="hpczNumber">HPCZ Number</Label>
        <Input
          id="hpczNumber"
          placeholder="HPCZ-XXXXX"
          {...register("hpczNumber")}
        />
        <p className="text-xs text-muted">
          Your Health Professions Council of Zambia registration number.
        </p>
        {errors.hpczNumber?.message ? (
          <p className="text-sm text-danger">{errors.hpczNumber.message}</p>
        ) : null}
      </div>
    </div>
  );
}
