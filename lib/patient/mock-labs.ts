import type { LabOrderRecord } from "@/types";

export const mockLabOrders: LabOrderRecord[] = [
  {
    id: "lab-hba1c-001",
    testName: "HbA1c",
    orderedBy: "Dr. Brian Okello",
    dateOrdered: "2026-04-10",
    status: "RESULT_READY",
    resultSummary: "HbA1c improved to 7.1%, showing better recent glucose control.",
    hasAttachment: true,
  },
  {
    id: "lab-glucose-002",
    testName: "Blood Glucose",
    orderedBy: "Dr. Sarah Mensah",
    dateOrdered: "2026-04-11",
    status: "SAMPLE_COLLECTED",
    hasAttachment: false,
  },
  {
    id: "lab-lipid-003",
    testName: "Lipid Profile",
    orderedBy: "Dr. James Ncube",
    dateOrdered: "2026-04-03",
    status: "REVIEWED",
    resultSummary: "Cholesterol markers are stable. Continue current management plan.",
    hasAttachment: true,
  },
  {
    id: "lab-kidney-004",
    testName: "Kidney Function Panel",
    orderedBy: "Dr. Anita Phiri",
    dateOrdered: "2026-04-12",
    status: "ORDERED",
    hasAttachment: false,
  },
];

export function getLabOrders() {
  return mockLabOrders;
}
