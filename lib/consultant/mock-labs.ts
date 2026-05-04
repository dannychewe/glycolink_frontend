import type { ConsultantLabReview } from "@/types";

export const mockConsultantLabs: ConsultantLabReview[] = [
  {
    id: "clab-001",
    patientName: "Thandiwe Mwape",
    testName: "HbA1c",
    resultSummary: "8.2%, above target range but improved from prior review.",
    resultValue: "8.2",
    unit: "%",
    interpretation: "HIGH",
    orderedBy: "Dr. Miriam Phiri",
    dateOrdered: "2026-04-08",
    status: "RESULT_READY",
  },
  {
    id: "clab-002",
    patientName: "Brian Tembo",
    testName: "Urine Albumin-Creatinine Ratio",
    resultSummary: "Within normal range on latest screen.",
    resultValue: "18",
    unit: "mg/g",
    interpretation: "NORMAL",
    orderedBy: "Dr. Peter Sitali",
    dateOrdered: "2026-04-04",
    status: "REVIEWED",
    doctorNotes: "Continue routine annual monitoring. No medication adjustment required today.",
  },
  {
    id: "clab-003",
    patientName: "Faith Lungu",
    testName: "Kidney Function Panel",
    resultSummary: "Stable creatinine with preserved renal function.",
    resultValue: "2.6",
    unit: "mg/dL",
    interpretation: "CRITICAL",
    orderedBy: "Dr. Miriam Phiri",
    dateOrdered: "2026-04-11",
    status: "RESULT_READY",
  },
];

export function getMockConsultantLabs() {
  return mockConsultantLabs;
}

export function getMockConsultantLabById(id: string) {
  return mockConsultantLabs.find((lab) => lab.id === id);
}
