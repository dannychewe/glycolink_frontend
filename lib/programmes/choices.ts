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

export type ProgrammeCareTeamRoleValue = (typeof PROGRAMME_CARE_TEAM_ROLE_OPTIONS)[number]["value"];

export function labelForChoice(
  options: readonly ChoiceOption[],
  value: string | null | undefined,
  fallback = "Unknown",
) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return options.find((option) => option.value === normalized)?.label ?? fallback;
}
