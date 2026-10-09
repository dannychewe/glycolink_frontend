import type { MonitoringRequirementConfiguration } from "./graphql";

export type ReminderFormValues = Record<
  string,
  boolean | number | string | null
>;

export const REMINDER_SETTING_LABELS: Record<string, string> = {
  due_reminder_enabled: "Remind when due",
  grace_reminder_enabled: "Remind during grace period",
  missed_reminder_enabled: "Remind after a missed reading",
  create_follow_up: "Create care-team follow-up",
  upcoming_hours_before_due: "Advance reminder (hours before due)",
  follow_up_after_missed_count: "Missed readings before follow-up",
};

export function reminderPayload(
  configuration: MonitoringRequirementConfiguration,
  values: ReminderFormValues,
) {
  return Object.fromEntries(
    configuration.reminderSettings.map((setting) => {
      const value = values[setting.key] ?? setting.defaultValue;
      return [
        setting.key,
        setting.valueType === "boolean"
          ? value === true
          : value === "" || value === null
            ? null
            : Number(value),
      ];
    }),
  );
}

export function reminderFormValues(value: unknown): ReminderFormValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) =>
        entry === null ||
        ["string", "number", "boolean"].includes(typeof entry),
    ),
  );
}

export function monitoringFieldErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    !error ||
    typeof error !== "object" ||
    !("graphQLErrors" in error) ||
    !Array.isArray(error.graphQLErrors)
  )
    return errors;
  for (const graphError of error.graphQLErrors) {
    const fields = graphError?.extensions?.fields;
    if (!fields || typeof fields !== "object") continue;
    for (const [field, messages] of Object.entries(fields)) {
      errors[field] = Array.isArray(messages)
        ? messages.map(String).join(" ")
        : String(messages);
    }
  }
  return errors;
}
