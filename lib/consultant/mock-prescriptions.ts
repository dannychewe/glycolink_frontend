import type { ConsultantPrescription } from "@/types";

export const mockConsultantPrescriptions: ConsultantPrescription[] = [
  {
    id: "cp-rx-001",
    patientName: "Thandiwe Mwape",
    medicationName: "Metformin",
    dosage: "500mg twice daily",
    frequency: "Twice daily",
    instructions: "Take with meals and continue evening glucose logging.",
    prescribedBy: "Dr. Miriam Phiri",
    dateIssued: "2026-04-12",
    status: "ACTIVE",
    medications: [
      {
        medicationName: "Metformin",
        dosage: "500mg",
        frequency: "Twice daily",
        instructions: "Take with breakfast and dinner.",
      },
      {
        medicationName: "Insulin glargine",
        dosage: "18 units",
        frequency: "Nightly",
        instructions: "Administer at the same time each evening.",
      },
    ],
  },
  {
    id: "cp-rx-002",
    patientName: "Brian Tembo",
    medicationName: "Insulin lispro",
    dosage: "6 units before meals",
    frequency: "Three times daily",
    instructions: "Use before meals and adjust if carbohydrate intake is reduced.",
    prescribedBy: "Dr. Miriam Phiri",
    dateIssued: "2026-04-10",
    status: "ACTIVE",
    medications: [
      {
        medicationName: "Insulin lispro",
        dosage: "6 units before meals",
        frequency: "Three times daily",
        instructions: "Inject within 15 minutes before meals.",
      },
    ],
  },
  {
    id: "cp-rx-003",
    patientName: "Faith Lungu",
    medicationName: "Glimepiride",
    dosage: "2mg daily",
    frequency: "Once daily",
    instructions: "Take in the morning and continue diet plan.",
    prescribedBy: "Dr. Peter Sitali",
    dateIssued: "2026-03-28",
    status: "COMPLETED",
    medications: [
      {
        medicationName: "Glimepiride",
        dosage: "2mg",
        frequency: "Once daily",
        instructions: "Take each morning before breakfast.",
      },
    ],
  },
  {
    id: "cp-rx-004",
    patientName: "Agnes Sitali",
    medicationName: "Insulin premix",
    dosage: "24 units morning, 16 units evening",
    frequency: "Twice daily",
    instructions: "Use before breakfast and before the evening meal.",
    prescribedBy: "Dr. Peter Sitali",
    dateIssued: "2026-03-15",
    status: "REVOKED",
    medications: [
      {
        medicationName: "Insulin premix",
        dosage: "24 units morning, 16 units evening",
        frequency: "Twice daily",
        instructions: "Revoked after regimen adjustment.",
      },
    ],
  },
];

export function getMockConsultantPrescriptions() {
  return mockConsultantPrescriptions;
}
