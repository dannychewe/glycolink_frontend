import type { PrescriptionRecord } from "@/types";

export const mockPrescriptions: PrescriptionRecord[] = [
  {
    id: "rx-metformin-001",
    medicationName: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    instructions:
      "Take with meals in the morning and evening. Monitor for any stomach discomfort and stay hydrated.",
    prescribedBy: "Dr. Brian Okello",
    dateIssued: "2026-04-10",
    status: "ACTIVE",
  },
  {
    id: "rx-insulin-002",
    medicationName: "Insulin Glargine",
    dosage: "10 units",
    frequency: "Once nightly",
    instructions:
      "Inject at the same time every evening. Rotate injection sites and continue glucose monitoring.",
    prescribedBy: "Dr. Sarah Mensah",
    dateIssued: "2026-04-01",
    status: "ACTIVE",
  },
  {
    id: "rx-vitamin-d-003",
    medicationName: "Vitamin D3",
    dosage: "1000 IU",
    frequency: "Once daily",
    instructions:
      "Take after breakfast for the full prescribed course unless advised otherwise by your doctor.",
    prescribedBy: "Dr. James Ncube",
    dateIssued: "2026-03-15",
    status: "COMPLETED",
  },
  {
    id: "rx-antibiotic-004",
    medicationName: "Amoxicillin",
    dosage: "500mg",
    frequency: "Three times daily",
    instructions:
      "This prescription was revoked after an updated allergy review. Do not continue use.",
    prescribedBy: "Dr. Anita Phiri",
    dateIssued: "2026-02-28",
    status: "REVOKED",
  },
];

export function getPrescriptions() {
  return mockPrescriptions;
}
