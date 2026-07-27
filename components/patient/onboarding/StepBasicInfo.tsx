import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";

type StepBasicInfoProps = Readonly<{
  isFullNameEditable?: boolean;
  onEnableFullNameEdit?: () => void;
}>;

export function StepBasicInfo({
  isFullNameEditable = true,
  onEnableFullNameEdit = () => {},
}: StepBasicInfoProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<PatientOnboardingValues>();
  const fullName = watch("fullName");
  const fullNameLocked = !isFullNameEditable && !!fullName?.trim();

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="fullName">Full Name</Label>
          {fullNameLocked ? (
            <Button type="button" variant="secondary" size="sm" onClick={onEnableFullNameEdit}>
              Change
            </Button>
          ) : null}
        </div>
        <Input id="fullName" readOnly={fullNameLocked} {...register("fullName")} />
        {fullNameLocked ? (
          <p className="text-xs text-muted">
            Prefilled from your profile. Click Change if you want to edit it.
          </p>
        ) : null}
        {errors.fullName?.message ? (
          <p className="text-sm text-danger">{errors.fullName.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of Birth</Label>
        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
        {errors.dateOfBirth?.message ? (
          <p className="text-sm text-danger">{errors.dateOfBirth.message}</p>
        ) : null}
      </div>

    </div>
  );
}
