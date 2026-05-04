import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConsultantOnboardingValues } from "@/lib/validation/consultant-onboarding";

export function StepFees() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsultantOnboardingValues>();

  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="consultationFeeInitial">Initial Consultation Fee</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
              ZMW
            </span>
            <Input
              id="consultationFeeInitial"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              className="pl-14"
              {...register("consultationFeeInitial")}
            />
          </div>
          {errors.consultationFeeInitial?.message ? (
            <p className="text-sm text-danger">{errors.consultationFeeInitial.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="consultationFeeFollowup">Follow-up Consultation Fee</Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted">
              ZMW
            </span>
            <Input
              id="consultationFeeFollowup"
              type="number"
              min={0}
              step={0.01}
              placeholder="0.00"
              className="pl-14"
              {...register("consultationFeeFollowup")}
            />
          </div>
          {errors.consultationFeeFollowup?.message ? (
            <p className="text-sm text-danger">{errors.consultationFeeFollowup.message}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="certificateExpiryDate">Practicing Certificate Expiry</Label>
          <Input
            id="certificateExpiryDate"
            type="date"
            {...register("certificateExpiryDate")}
          />
          <p className="text-xs text-muted">
            The platform will warn you before this expires.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telemedApprovalExpiryDate">Telemedicine Approval Expiry</Label>
          <Input
            id="telemedApprovalExpiryDate"
            type="date"
            {...register("telemedApprovalExpiryDate")}
          />
          <p className="text-xs text-muted">
            Your telemedicine practice approval expiry date.
          </p>
        </div>
      </div>
    </div>
  );
}
