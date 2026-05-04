import type { PatientNotification } from "@/types";

export const mockNotifications: PatientNotification[] = [
  {
    id: "notif-appointment-001",
    message: "Your consultation with Dr. Sarah Mensah is confirmed for April 15 at 10:30.",
    type: "APPOINTMENT",
    timestamp: "2026-04-13T07:20:00.000Z",
    isRead: false,
  },
  {
    id: "notif-payment-002",
    message: "Payment for your upcoming consultation is still pending.",
    type: "PAYMENT",
    timestamp: "2026-04-12T15:45:00.000Z",
    isRead: false,
  },
  {
    id: "notif-lab-003",
    message: "Your HbA1c results are ready for review.",
    type: "LAB",
    timestamp: "2026-04-11T10:15:00.000Z",
    isRead: true,
  },
  {
    id: "notif-system-004",
    message: "We updated our privacy notice and patient communication policy.",
    type: "SYSTEM",
    timestamp: "2026-04-10T08:00:00.000Z",
    isRead: true,
  },
];

export function getMockNotifications() {
  return mockNotifications;
}
