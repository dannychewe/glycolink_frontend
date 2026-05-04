import type { PatientSettings } from "@/types";

export const mockPatientSettings: PatientSettings = {
  emailNotifications: true,
  smsNotifications: false,
};

export function getMockPatientSettings() {
  return mockPatientSettings;
}
