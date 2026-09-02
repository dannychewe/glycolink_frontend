import type { ChoiceOption } from "@/lib/programmes/choices";

export const GLUCOSE_CONTEXT_OPTIONS = [
  { value: "fasting", label: "Fasting" },
  { value: "pre_meal", label: "Before meal" },
  { value: "post_meal", label: "After meal" },
  { value: "bedtime", label: "Bedtime" },
  { value: "random", label: "Random" },
  { value: "other", label: "Other" },
] as const satisfies readonly ChoiceOption[];

export const VITAL_READING_TYPE_OPTIONS = [
  { value: "blood_pressure_systolic", label: "Blood pressure systolic" },
  { value: "blood_pressure_diastolic", label: "Blood pressure diastolic" },
  { value: "heart_rate", label: "Heart rate" },
  { value: "weight", label: "Weight" },
  { value: "temperature", label: "Temperature" },
  { value: "oxygen_saturation", label: "Oxygen saturation" },
  { value: "bmi", label: "BMI" },
  { value: "other", label: "Other" },
] as const satisfies readonly ChoiceOption[];

export type GlucoseContextValue = (typeof GLUCOSE_CONTEXT_OPTIONS)[number]["value"];
export type VitalReadingTypeValue = (typeof VITAL_READING_TYPE_OPTIONS)[number]["value"];

export const VITAL_READING_UNITS: Record<VitalReadingTypeValue, string> = {
  blood_pressure_systolic: "mmHg",
  blood_pressure_diastolic: "mmHg",
  heart_rate: "bpm",
  weight: "kg",
  temperature: "C",
  oxygen_saturation: "%",
  bmi: "kg/m2",
  other: "",
};
