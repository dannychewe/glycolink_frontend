import type { PatientDashboardData } from "@/types";

export const patientDashboardData: PatientDashboardData = {
  nextAppointment: {
    id: "apt-demo-brian-okello",
    providerName: "Dr. Brian Okello",
    date: "2026-04-14",
    time: "09:30",
    status: "AWAITING_PAYMENT",
  },
  pendingActions: [
    {
      type: "PAYMENT",
      message: "Your consultation payment is still pending for the upcoming appointment.",
    },
    {
      type: "PCQ",
      message: "Complete your pre-consultation questionnaire before your next visit.",
    },
  ],
  latestPrescription: {
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
  latestLab: {
    id: "lab-hba1c-001",
    testName: "HbA1c Panel",
    orderedBy: "Dr. Brian Okello",
    dateOrdered: "2026-04-10",
    status: "RESULT_READY",
    resultSummary: "HbA1c improved to 7.1%, showing better recent glucose control.",
    hasAttachment: true,
  },
  recentReadings: [112, 108, 115, 104, 110, 106],
  notifications: [
    {
      message: "Your booking with Dr. Brian Okello was created successfully.",
      timestamp: "2 hours ago",
    },
    {
      message: "A new prescription summary has been added to your profile.",
      timestamp: "Yesterday",
    },
    {
      message: "Your lab order is awaiting result processing.",
      timestamp: "2 days ago",
    },
  ],
};
