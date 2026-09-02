import type { ChoiceOption } from "@/lib/programmes/choices";

export const PROGRAMME_PRICE_BILLING_MODEL_OPTIONS: ChoiceOption[] = [
  { value: "one_time", label: "One-time programme fee" },
  { value: "monthly", label: "Monthly programme fee" },
  { value: "fixed_period", label: "Fixed programme-period fee" },
];

export const PROGRAMME_PAYER_TYPE_OPTIONS: ChoiceOption[] = [
  { value: "patient", label: "Patient" },
  { value: "sponsor", label: "Sponsor" },
  { value: "clinic", label: "Clinic" },
  { value: "employer", label: "Employer" },
  { value: "insurer", label: "Insurer" },
  { value: "ngo", label: "NGO" },
  { value: "other", label: "Other" },
];

export const PROGRAMME_BILLING_INTERVAL_OPTIONS: ChoiceOption[] = [
  { value: "monthly", label: "Monthly" },
  { value: "once", label: "Once" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];
