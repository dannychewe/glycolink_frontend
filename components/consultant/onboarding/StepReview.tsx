import {
  BadgeCheck,
  Calendar,
  Clock,
  FileText,
  Pencil,
  Stethoscope,
  User,
} from "lucide-react";
import { useFormContext } from "react-hook-form";
import type { ConsultantOnboardingValues } from "@/lib/validation/consultant-onboarding";
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
}: Readonly<{ label: string; value?: string | number; last?: boolean }>) {
  const display = value !== undefined && String(value).trim() !== "" ? String(value) : "Not provided";
  return (
    <div
      className={`flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4 ${!last ? "border-b border-border" : ""}`}
    >
      <p className="text-xs font-medium text-muted sm:shrink-0">{label}</p>
      <p className="text-sm font-medium text-text sm:text-right">{display}</p>
    </div>
  );
}

type StepReviewProps = Readonly<{
  onEdit: (stepIndex: number) => void;
  uploadCount: number;
}>;

export function StepReview({ onEdit, uploadCount }: StepReviewProps) {
  const { getValues } = useFormContext<ConsultantOnboardingValues>();
  const v = getValues();

  const feeInitial =
    v.consultationFeeInitial !== "" && v.consultationFeeInitial !== undefined
      ? `ZMW ${Number(v.consultationFeeInitial).toFixed(2)}`
      : undefined;

  const feeFollowup =
    v.consultationFeeFollowup !== "" && v.consultationFeeFollowup !== undefined
      ? `ZMW ${Number(v.consultationFeeFollowup).toFixed(2)}`
      : undefined;

  return (
    <div className="space-y-6">
      <ReviewSection icon={User} title="Profile" stepIndex={0} onEdit={onEdit}>
        <ReviewRow label="Display Name" value={v.displayName} />
        <ReviewRow label="HPCZ Number" value={v.hpczNumber} last />
      </ReviewSection>

      <ReviewSection icon={Stethoscope} title="Professional Details" stepIndex={1} onEdit={onEdit}>
        <ReviewRow label="Bio" value={v.bio} />
        <ReviewRow label="Specialties" value={v.specialties} />
        <ReviewRow label="Sub-Specialties" value={v.subSpecialties} />
        <ReviewRow label="Languages" value={v.languages} last />
      </ReviewSection>

      <ReviewSection icon={Clock} title="Fees & Dates" stepIndex={2} onEdit={onEdit}>
        <ReviewRow label="Initial Consultation Fee" value={feeInitial} />
        <ReviewRow label="Follow-up Consultation Fee" value={feeFollowup} />
        <ReviewRow label="Certificate Expiry" value={v.certificateExpiryDate} />
        <ReviewRow label="Telemedicine Approval Expiry" value={v.telemedApprovalExpiryDate} last />
      </ReviewSection>

      <ReviewSection icon={FileText} title="Credentials" stepIndex={3} onEdit={onEdit}>
        <ReviewRow
          label="Documents Uploaded"
          value={uploadCount > 0 ? `${uploadCount} document${uploadCount === 1 ? "" : "s"}` : "None"}
          last
        />
      </ReviewSection>

      <ReviewSection icon={Calendar} title="Availability" stepIndex={4} onEdit={onEdit}>
        <div className="px-4 py-3">
          <p className="text-sm text-muted">
            Review and adjust your availability from the previous step, or continue to submit.
          </p>
        </div>
      </ReviewSection>

      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-3">
          <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-text">
            Submitting will send your profile to our team for verification. You will be notified
            once approved.
          </p>
        </div>
      </div>
    </div>
  );
}
