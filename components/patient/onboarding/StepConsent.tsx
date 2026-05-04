import { ShieldCheck } from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";

export function StepConsent() {
  const {
    register,
    formState: { errors },
  } = useFormContext<PatientOnboardingValues>();

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-text">Your data is handled with care</p>
          <p className="text-muted">
            Naje Health collects your health information solely to support your care team. Your data
            is encrypted, never sold, and accessed only by authorised medical professionals involved
            in your treatment.
          </p>
        </div>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-primary/5">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-primary"
          {...register("consent")}
        />
        <span className="text-sm leading-relaxed text-text">
          I agree to the{" "}
          <span className="font-medium text-primary">Terms of Service</span> and consent to
          the processing of my medical data as described above.
        </span>
      </label>

      {errors.consent?.message ? (
        <p className="text-sm text-danger">{errors.consent.message}</p>
      ) : null}
    </div>
  );
}
