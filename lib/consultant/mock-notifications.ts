import type { ConsultantNotification } from "@/types";

export const mockConsultantNotifications: ConsultantNotification[] = [
  {
    id: "consultant-notif-001",
    message: "Thandiwe Mwape has completed the pre-consult questionnaire for today’s appointment.",
    type: "APPOINTMENT",
    timestamp: "2026-04-13T07:35:00.000Z",
    isRead: false,
  },
  {
    id: "consultant-notif-002",
    message: "A new HbA1c result is ready for review in your lab queue.",
    type: "LAB",
    timestamp: "2026-04-13T06:50:00.000Z",
    isRead: false,
  },
  {
    id: "consultant-notif-003",
    message: "Critical glucose readings were detected for Faith Lungu overnight.",
    type: "ALERT",
    timestamp: "2026-04-12T22:10:00.000Z",
    isRead: false,
  },
  {
    id: "consultant-notif-004",
    message: "Platform maintenance is scheduled for Sunday at 21:00 CAT.",
    type: "SYSTEM",
    timestamp: "2026-04-11T14:00:00.000Z",
    isRead: true,
  },
];

export function getMockConsultantNotifications() {
  return mockConsultantNotifications;
}
