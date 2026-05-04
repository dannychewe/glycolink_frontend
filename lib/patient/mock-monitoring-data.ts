import type { GlucoseReading } from "@/types";

export const mockGlucoseReadings: GlucoseReading[] = [
  {
    id: "reading-001",
    value: 112,
    unit: "mg/dL",
    timestamp: "2026-04-13T07:30",
  },
  {
    id: "reading-002",
    value: 186,
    unit: "mg/dL",
    timestamp: "2026-04-12T18:10",
  },
  {
    id: "reading-003",
    value: 104,
    unit: "mg/dL",
    timestamp: "2026-04-12T07:45",
  },
  {
    id: "reading-004",
    value: 68,
    unit: "mg/dL",
    timestamp: "2026-04-11T21:00",
  },
  {
    id: "reading-005",
    value: 121,
    unit: "mg/dL",
    timestamp: "2026-04-11T08:20",
  },
];

export function getMockGlucoseReadings() {
  return mockGlucoseReadings;
}

export function getGlucoseAlertLevel(value: number) {
  if (value < 70) {
    return "Low";
  }

  if (value > 180) {
    return "High";
  }

  return "Normal";
}
