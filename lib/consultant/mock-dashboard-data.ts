import type { ConsultantDashboardData } from "@/types";

export const mockConsultantDashboardData: ConsultantDashboardData = {
  providerStatus: "PENDING",
  todayAppointments: [
    {
      id: "c-apt-001",
      patientId: "thandiwe-mwape",
      patientName: "Thandiwe Mwape",
      time: "09:00",
      status: "UPCOMING",
    },
    {
      id: "c-apt-002",
      patientId: "brian-tembo",
      patientName: "Brian Tembo",
      time: "10:30",
      status: "IN_PROGRESS",
    },
    {
      id: "c-apt-003",
      patientId: "ruth-chileshe",
      patientName: "Ruth Chileshe",
      time: "14:00",
      status: "UPCOMING",
    },
  ],
  pendingLabs: [
    {
      id: "clab-001",
      patientId: "thandiwe-mwape",
      patientName: "Thandiwe Mwape",
      testName: "HbA1c",
    },
    {
      id: "clab-003",
      patientId: "faith-lungu",
      patientName: "Faith Lungu",
      testName: "Kidney Function Panel",
    },
    {
      id: "clab-002",
      patientId: "brian-tembo",
      patientName: "Brian Tembo",
      testName: "Urine Albumin-Creatinine Ratio",
    },
  ],
  alerts: [
    {
      patientId: "moses-banda",
      patientName: "Moses Banda",
      message: "Repeated glucose readings above 240 mg/dL in the last 12 hours.",
      severity: "HIGH",
    },
    {
      patientId: "faith-lungu",
      patientName: "Faith Lungu",
      message: "Missed medication log for two consecutive days.",
      severity: "MEDIUM",
    },
  ],
  messages: [
    {
      patientId: "thandiwe-mwape",
      patientName: "Thandiwe Mwape",
      lastMessage: "I uploaded my latest glucose readings for review.",
    },
    {
      patientId: "brian-tembo",
      patientName: "Brian Tembo",
      lastMessage: "Can we confirm whether tomorrow's consultation is virtual?",
    },
    {
      patientId: "ruth-chileshe",
      patientName: "Ruth Chileshe",
      lastMessage: "I have a question about the dosage adjustment discussed today.",
    },
  ],
};

export function getMockConsultantDashboardData() {
  return mockConsultantDashboardData;
}
