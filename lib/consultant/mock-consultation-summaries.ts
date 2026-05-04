import type { ConsultantEncounterSummary } from "@/types";

export const mockConsultationSummaries: ConsultantEncounterSummary[] = [
  {
    id: "c-apt-001",
    patientName: "Thandiwe Mwape",
    date: "2026-04-13",
    time: "09:00",
    soap: {
      subjective:
        "Patient reports persistent evening fatigue, increased thirst, and two post-prandial glucose readings above 220 mg/dL over the last week.",
      objective:
        "Latest home readings remain above target. Most recent HbA1c is 8.2%. No acute distress reported during the consultation.",
      assessment:
        "Type 2 diabetes with suboptimal glycemic control, likely related to post-meal hyperglycemia and inconsistent evening routine.",
      plan:
        "Reinforce adherence, continue monitoring, initiate basal insulin adjustment, and review response after repeat glucose logs and follow-up labs.",
    },
    diagnosis: "Type 2 diabetes mellitus with uncontrolled hyperglycemia",
    prescriptions: [
      {
        medicationName: "Metformin",
        dosage: "500mg twice daily",
        instructions: "Take with breakfast and dinner.",
      },
      {
        medicationName: "Insulin glargine",
        dosage: "20 units nightly",
        instructions: "Increase from 18 units and inject at the same time each evening.",
      },
    ],
    labOrders: [
      {
        testName: "HbA1c",
        notes: "Repeat in 8 weeks to assess response to treatment adjustment.",
      },
      {
        testName: "Fasting Blood Glucose",
        notes: "Obtain with next morning lab visit.",
      },
    ],
  },
  {
    id: "c-apt-002",
    patientName: "Brian Tembo",
    date: "2026-04-13",
    time: "10:30",
    soap: {
      subjective:
        "Patient describes increased morning variability and two mild hypoglycemic episodes over the previous week, both self-managed.",
      objective:
        "Recent glucose logs show wide fasting range with occasional low mid-day values. No new complications reported.",
      assessment:
        "Type 1 diabetes with recent glycemic variability, likely related to meal timing and activity changes.",
      plan:
        "Adjust rapid-acting insulin guidance around breakfast, reinforce hypoglycemia precautions, and continue home glucose monitoring.",
    },
    diagnosis: "Type 1 diabetes mellitus with glycemic variability",
    prescriptions: [
      {
        medicationName: "Insulin lispro",
        dosage: "6 units before meals",
        instructions: "Reduce breakfast dose on high-activity mornings as discussed.",
      },
    ],
    labOrders: [
      {
        testName: "Urine Albumin-Creatinine Ratio",
        notes: "Repeat annual screening at next routine lab cycle.",
      },
    ],
  },
];

export function getMockConsultationSummaryById(id: string) {
  return mockConsultationSummaries.find((summary) => summary.id === id);
}
