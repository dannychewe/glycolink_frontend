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
          <p className="font-medium text-text">
            Your data is handled with care
          </p>
          <p className="text-muted">
            Naje Health uses the profile, diabetes history, emergency contact,
            glucose readings, care plans, messages, appointments, and records
            you provide to operate your account and support care. These details
            may be made available to the clinic and clinicians you connect with,
            and processed by service providers that operate the platform.
          </p>
        </div>
      </div>

      <p className="text-sm text-muted">
        Naje is not an emergency service. The app does not replace medical
        advice, diagnosis, or treatment. Consult a healthcare professional and
        see the{" "}
        <a
          href="/medical-disclaimer"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-primary underline"
        >
          Medical Safety Notice
        </a>
        .
      </p>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/40 hover:bg-primary/5">
        <input
          type="checkbox"
          className="mt-0.5 size-4 shrink-0 rounded border-border text-primary focus:ring-primary"
          {...register("consent")}
        />
        <span className="text-sm leading-relaxed text-text">
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline"
          >
            Terms of Service
          </a>{" "}
          and consent to the processing and sharing of my health information
          described in the{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline"
          >
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {errors.consent?.message ? (
        <p className="text-sm text-danger">{errors.consent.message}</p>
      ) : null}
    </div>
  );
}
