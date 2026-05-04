import type { ConsultantSettings } from "@/types";

export const mockConsultantSettings: ConsultantSettings = {
  emailNotifications: true,
  smsNotifications: true,
};

export function getMockConsultantSettings() {
  return mockConsultantSettings;
}
