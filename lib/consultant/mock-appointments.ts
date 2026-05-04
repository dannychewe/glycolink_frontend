import type { ConsultantWorklistAppointment } from "@/types";

export const mockConsultantAppointments: ConsultantWorklistAppointment[] = [
  {
    id: "c-apt-001",
    patientId: "thandiwe-mwape",
    patientName: "Thandiwe Mwape",
    date: "2026-04-13",
    time: "09:00",
    status: "READY",
    pcqStatus: "SUBMITTED",
    paymentStatus: "PAID",
  },
  {
    id: "c-apt-002",
    patientId: "brian-tembo",
    patientName: "Brian Tembo",
    date: "2026-04-13",
    time: "10:30",
    status: "IN_PROGRESS",
    pcqStatus: "SUBMITTED",
    paymentStatus: "PAID",
  },
  {
    id: "c-apt-003",
    patientId: "ruth-chileshe",
    patientName: "Ruth Chileshe",
    date: "2026-04-13",
    time: "14:00",
    status: "UPCOMING",
    pcqStatus: "IN_PROGRESS",
    paymentStatus: "AWAITING_PAYMENT",
  },
  {
    id: "c-apt-004",
    patientId: "faith-lungu",
    patientName: "Faith Lungu",
    date: "2026-04-15",
    time: "11:00",
    status: "UPCOMING",
    pcqStatus: "NOT_STARTED",
    paymentStatus: "PAID",
  },
  {
    id: "c-apt-005",
    patientId: "agnes-sitali",
    patientName: "Agnes Sitali",
    date: "2026-04-10",
    time: "08:30",
    status: "COMPLETED",
    pcqStatus: "SUBMITTED",
    paymentStatus: "PAID",
  },
  {
    id: "c-apt-006",
    patientId: "moses-banda",
    patientName: "Moses Banda",
    date: "2026-04-09",
    time: "16:00",
    status: "NO_SHOW",
    pcqStatus: "NOT_STARTED",
    paymentStatus: "AWAITING_PAYMENT",
  },
];

export function getMockConsultantAppointments() {
  return mockConsultantAppointments;
}

export function getMockConsultantAppointmentById(id: string) {
  return mockConsultantAppointments.find((appointment) => appointment.id === id);
}
