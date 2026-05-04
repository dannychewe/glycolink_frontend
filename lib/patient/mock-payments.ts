import type { PaymentRecord, PaymentStatus } from "@/types";

export const mockPayments: PaymentRecord[] = [
  {
    id: "pay-brian-001",
    appointmentId: "apt-demo-brian-okello",
    providerName: "Dr. Brian Okello",
    amount: 38,
    status: "PENDING",
    createdAt: "2026-04-09T08:30:00.000Z",
  },
  {
    id: "pay-sarah-002",
    appointmentId: "apt-demo-sarah-mensah",
    providerName: "Dr. Sarah Mensah",
    amount: 45,
    status: "PROCESSING",
    createdAt: "2026-04-08T12:15:00.000Z",
  },
  {
    id: "pay-james-003",
    appointmentId: "apt-demo-james-ncube",
    providerName: "Dr. James Ncube",
    amount: 52,
    status: "SUCCESS",
    createdAt: "2026-04-05T09:20:00.000Z",
  },
  {
    id: "pay-anita-004",
    appointmentId: "apt-demo-anita-phiri",
    providerName: "Dr. Anita Phiri",
    amount: 30,
    status: "FAILED",
    createdAt: "2026-04-04T14:45:00.000Z",
  },
];

export function getPayments() {
  return mockPayments;
}

export function getPaymentById(id: string) {
  return mockPayments.find((payment) => payment.id === id);
}

export function getPaymentStatusVariant(status: PaymentStatus) {
  if (status === "SUCCESS") {
    return "success";
  }

  if (status === "FAILED") {
    return "danger";
  }

  if (status === "PENDING") {
    return "warning";
  }

  return "secondary";
}
