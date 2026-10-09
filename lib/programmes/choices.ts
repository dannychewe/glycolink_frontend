export type ChoiceOption<TValue extends string = string> = {
  value: TValue;
  label: string;
};

export const PROGRAMME_TYPE_OPTIONS = [
  { value: "diabetes", label: "Diabetes care" },
] as const satisfies readonly ChoiceOption[];

export const PROGRAMME_CARE_TEAM_ROLE_OPTIONS = [
  { value: "doctor", label: "Doctor" },
  { value: "nurse", label: "Nurse" },
  { value: "care_coordinator", label: "Care coordinator" },
] as const satisfies readonly ChoiceOption[];

export const PROGRAMME_MONITORING_CADENCE_TYPE_OPTIONS = [
  { value: "interval_days", label: "Interval days" },
  { value: "weekly", label: "Weekly" },
  { value: "custom", label: "Custom" },
] as const satisfies readonly ChoiceOption[];

// Programme requirements allow glucose plus the backend's VitalReadingType choices.
export const PROGRAMME_OBSERVATION_TYPE_OPTIONS = [
  { value: "glucose", label: "Glucose" },
  { value: "blood_pressure_systolic", label: "Blood Pressure Systolic" },
  { value: "blood_pressure_diastolic", label: "Blood Pressure Diastolic" },
  { value: "heart_rate", label: "Heart Rate" },
  { value: "weight", label: "Weight" },
  { value: "temperature", label: "Temperature" },
  { value: "oxygen_saturation", label: "Oxygen Saturation" },
  { value: "bmi", label: "BMI" },
  { value: "other", label: "Other" },
] as const satisfies readonly ChoiceOption[];

export const PROGRAMME_GLUCOSE_CONTEXT_OPTIONS = [
  { value: "", label: "Any context" },
  { value: "fasting", label: "Fasting" },
  { value: "pre_meal", label: "Pre Meal" },
  { value: "post_meal", label: "Post Meal" },
  { value: "bedtime", label: "Bedtime" },
  { value: "random", label: "Random" },
  { value: "other", label: "Other" },
] as const satisfies readonly ChoiceOption[];

export type ProgrammeCareTeamRoleValue =
  (typeof PROGRAMME_CARE_TEAM_ROLE_OPTIONS)[number]["value"];

export function labelForChoice(
  options: readonly ChoiceOption[],
  value: string | null | undefined,
  fallback = "Unknown",
) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return (
    options.find((option) => option.value === normalized)?.label ?? fallback
  );
}
