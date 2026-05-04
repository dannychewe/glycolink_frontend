import { Activity, Pencil, Phone, ShieldCheck, Stethoscope, User } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { DIABETES_TYPE_OPTIONS } from "@/lib/patient/clinical-profile-graphql";
import type { PatientOnboardingValues } from "@/lib/validation/patient-onboarding";
import { Button } from "@/components/ui/button";

function ReviewSection({
  icon: Icon,
  title,
  stepIndex,
  onEdit,
  children,
}: Readonly<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  stepIndex: number;
  onEdit: (stepIndex: number) => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-text">{title}</h3>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 px-2 text-xs text-muted hover:text-text"
          onClick={() => onEdit(stepIndex)}
        >
          <Pencil className="size-3" />
          Edit
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-background">{children}</div>
    </div>
  );
}

function ReviewRow({
  label,
  value,
  last,
}: Readonly<{
  label: string;
  value?: string | boolean;
  last?: boolean;
}>) {
  const displayValue =
    typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : value?.trim()
        ? value
        : "Not provided";

  return (
    <div
      className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${!last ? "border-b border-border" : ""}`}
    >
      <p className="text-xs font-medium text-muted sm:shrink-0">{label}</p>
      <p className="text-sm font-medium text-text sm:text-right">{displayValue}</p>
    </div>
  );
}

export function StepReview({ onEdit }: Readonly<{ onEdit: (stepIndex: number) => void }>) {
  const { getValues } = useFormContext<PatientOnboardingValues>();
  const values = getValues();
  const diabetesTypeLabel =
    DIABETES_TYPE_OPTIONS.find((item) => item.value === values.diabetesType)?.label ??
    values.diabetesType;

  return (
    <div className="space-y-6">
      <ReviewSection icon={User} title="Basic Information" stepIndex={0} onEdit={onEdit}>
        <ReviewRow label="Full Name" value={values.fullName} />
        <ReviewRow label="Date of Birth" value={values.dateOfBirth} />
        <ReviewRow label="Phone" value={values.phone} />
        <ReviewRow label="Email" value={values.email} last />
      </ReviewSection>

      <ReviewSection icon={Activity} title="Diabetes Profile" stepIndex={1} onEdit={onEdit}>
        <ReviewRow label="Diabetes Type" value={diabetesTypeLabel} />
        <ReviewRow label="Diagnosis Date" value={values.diagnosisDate} last />
      </ReviewSection>

      <ReviewSection icon={Stethoscope} title="Medical Information" stepIndex={2} onEdit={onEdit}>
        <ReviewRow label="Allergies" value={values.allergies} />
        <ReviewRow label="Current Medications" value={values.currentMedications} />
        <ReviewRow label="Additional Notes" value={values.additionalNotes} last />
      </ReviewSection>

      <ReviewSection icon={Phone} title="Emergency Contact" stepIndex={3} onEdit={onEdit}>
        <ReviewRow label="Name" value={values.emergencyContactName} />
        <ReviewRow label="Relationship" value={values.emergencyContactRelationship} />
        <ReviewRow label="Phone" value={values.emergencyContactPhone} last />
      </ReviewSection>

      <ReviewSection icon={ShieldCheck} title="Consent" stepIndex={4} onEdit={onEdit}>
        <ReviewRow label="Terms & Medical Data Consent" value={values.consent} last />
      </ReviewSection>
    </div>
  );
}
