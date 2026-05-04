import type {
  ConsultantPatientContext,
  ConsultantPatientListItem,
} from "@/types";

const mockConsultantPatients: ConsultantPatientContext[] = [
  {
    id: "thandiwe-mwape",
    name: "Thandiwe Mwape",
    age: 34,
    gender: "Female",
    diabetesType: "Type 2",
    diagnosisDate: "2022-08-14",
    allergies: "Penicillin, shellfish",
    medications: "Metformin 500mg twice daily, Insulin glargine at night",
    pcq: [
      {
        question: "How have your glucose readings been this week?",
        answer: "Mostly between 150 and 190 mg/dL, with two readings above 220 after dinner.",
      },
      {
        question: "Any symptoms or concerns before today’s consultation?",
        answer: "I have been more fatigued than usual and noticed increased thirst in the evenings.",
      },
      {
        question: "Have you missed any medication doses recently?",
        answer: "I missed one evening dose on Sunday but have otherwise been consistent.",
      },
      {
        question: "Any recent hospital or clinic visits?",
        answer: "No emergency visits. I only attended a routine lab collection last week.",
      },
    ],
    prescriptions: [
      {
        medicationName: "Metformin",
        dosage: "500mg twice daily",
        dateIssued: "2026-03-18",
      },
      {
        medicationName: "Insulin glargine",
        dosage: "18 units nightly",
        dateIssued: "2026-03-18",
      },
    ],
    labs: [
      {
        testName: "HbA1c",
        resultSummary: "8.2%, above target range but improved from prior review.",
        status: "RESULT_READY",
      },
      {
        testName: "Fasting Blood Glucose",
        resultSummary: "9.8 mmol/L on latest sample.",
        status: "REVIEWED",
      },
    ],
    monitoring: [
      {
        id: "glucose-thandiwe-1",
        value: 182,
        unit: "mg/dL",
        timestamp: "2026-04-13T06:15:00.000Z",
      },
      {
        id: "glucose-thandiwe-2",
        value: 169,
        unit: "mg/dL",
        timestamp: "2026-04-12T20:10:00.000Z",
      },
      {
        id: "glucose-thandiwe-3",
        value: 224,
        unit: "mg/dL",
        timestamp: "2026-04-12T13:40:00.000Z",
      },
      {
        id: "glucose-thandiwe-4",
        value: 157,
        unit: "mg/dL",
        timestamp: "2026-04-11T07:05:00.000Z",
      },
    ],
  },
  {
    id: "brian-tembo",
    name: "Brian Tembo",
    age: 46,
    gender: "Male",
    diabetesType: "Type 1",
    diagnosisDate: "2015-02-03",
    allergies: "None reported",
    medications: "Rapid-acting insulin before meals, basal insulin every evening",
    pcq: [
      {
        question: "What prompted this follow-up visit?",
        answer: "I have had more variability in morning glucose readings over the last two weeks.",
      },
      {
        question: "Any episodes of hypoglycemia?",
        answer: "Two mild low readings last week, both resolved after taking juice.",
      },
      {
        question: "Have you changed diet, activity, or insulin dosing recently?",
        answer: "I started walking more in the mornings and reduced dinner portions slightly.",
      },
    ],
    prescriptions: [
      {
        medicationName: "Insulin lispro",
        dosage: "6 units before meals",
        dateIssued: "2026-03-05",
      },
    ],
    labs: [
      {
        testName: "Urine Albumin-Creatinine Ratio",
        resultSummary: "Within normal range on latest screen.",
        status: "REVIEWED",
      },
    ],
    monitoring: [
      {
        id: "glucose-brian-1",
        value: 96,
        unit: "mg/dL",
        timestamp: "2026-04-13T05:50:00.000Z",
      },
      {
        id: "glucose-brian-2",
        value: 121,
        unit: "mg/dL",
        timestamp: "2026-04-12T21:05:00.000Z",
      },
      {
        id: "glucose-brian-3",
        value: 68,
        unit: "mg/dL",
        timestamp: "2026-04-12T11:10:00.000Z",
      },
    ],
  },
  {
    id: "ruth-chileshe",
    name: "Ruth Chileshe",
    age: 29,
    gender: "Female",
    diabetesType: "Prediabetes",
    diagnosisDate: "2025-06-21",
    allergies: "None reported",
    medications: "Lifestyle modification plan, no active medication",
    pcq: [
      {
        question: "What would you like to focus on during today’s consultation?",
        answer: "I want guidance on diet changes and preventing progression to Type 2 diabetes.",
      },
      {
        question: "Any new symptoms or concerns this week?",
        answer: "I feel well overall but have occasional headaches in the afternoon.",
      },
    ],
    prescriptions: [],
    labs: [
      {
        testName: "Oral Glucose Tolerance Test",
        resultSummary: "Borderline elevated 2-hour glucose result.",
        status: "RESULT_READY",
      },
    ],
    monitoring: [
      {
        id: "glucose-ruth-1",
        value: 141,
        unit: "mg/dL",
        timestamp: "2026-04-12T07:10:00.000Z",
      },
    ],
  },
  {
    id: "faith-lungu",
    name: "Faith Lungu",
    age: 52,
    gender: "Female",
    diabetesType: "Type 2",
    diagnosisDate: "2018-11-09",
    allergies: "Sulfa drugs",
    medications: "Metformin 1g twice daily, Glimepiride 2mg daily",
    pcq: [
      {
        question: "How have you been tolerating your current medications?",
        answer: "No major side effects, but I sometimes feel mild nausea in the morning.",
      },
    ],
    prescriptions: [
      {
        medicationName: "Metformin",
        dosage: "1g twice daily",
        dateIssued: "2026-02-22",
      },
    ],
    labs: [
      {
        testName: "Kidney Function Panel",
        resultSummary: "Stable creatinine, no acute concerns.",
        status: "REVIEWED",
      },
    ],
    monitoring: [
      {
        id: "glucose-faith-1",
        value: 173,
        unit: "mg/dL",
        timestamp: "2026-04-12T18:20:00.000Z",
      },
    ],
  },
  {
    id: "agnes-sitali",
    name: "Agnes Sitali",
    age: 61,
    gender: "Female",
    diabetesType: "Type 2",
    diagnosisDate: "2012-04-02",
    allergies: "None reported",
    medications: "Insulin premix twice daily, Metformin 500mg daily",
    pcq: [
      {
        question: "Did you have any issues since your last review?",
        answer: "No major issues. Fasting readings have been slightly better this month.",
      },
    ],
    prescriptions: [
      {
        medicationName: "Insulin premix",
        dosage: "24 units morning, 16 units evening",
        dateIssued: "2026-03-30",
      },
    ],
    labs: [
      {
        testName: "HbA1c",
        resultSummary: "7.4%, improved control compared with prior quarter.",
        status: "REVIEWED",
      },
    ],
    monitoring: [
      {
        id: "glucose-agnes-1",
        value: 145,
        unit: "mg/dL",
        timestamp: "2026-04-09T06:35:00.000Z",
      },
    ],
  },
  {
    id: "moses-banda",
    name: "Moses Banda",
    age: 38,
    gender: "Male",
    diabetesType: "Type 1",
    diagnosisDate: "2006-01-13",
    allergies: "Latex",
    medications: "Basal-bolus insulin regimen",
    pcq: [
      {
        question: "Was there any reason you missed your last session?",
        answer: "Transport disruption prevented me from attending the appointment.",
      },
    ],
    prescriptions: [
      {
        medicationName: "Insulin aspart",
        dosage: "Sliding scale with meals",
        dateIssued: "2026-03-01",
      },
    ],
    labs: [
      {
        testName: "HbA1c",
        resultSummary: "Pending repeat sample collection.",
        status: "ORDERED",
      },
    ],
    monitoring: [
      {
        id: "glucose-moses-1",
        value: 201,
        unit: "mg/dL",
        timestamp: "2026-04-08T20:15:00.000Z",
      },
    ],
  },
];

export function getMockConsultantPatientById(id: string) {
  return mockConsultantPatients.find((patient) => patient.id === id);
}

export function getMockConsultantPatients(): ConsultantPatientListItem[] {
  return [
    {
      id: "thandiwe-mwape",
      name: "Thandiwe Mwape",
      age: 34,
      diabetesType: "Type 2",
      lastVisitDate: "2026-04-13",
    },
    {
      id: "brian-tembo",
      name: "Brian Tembo",
      age: 46,
      diabetesType: "Type 1",
      lastVisitDate: "2026-04-13",
    },
    {
      id: "ruth-chileshe",
      name: "Ruth Chileshe",
      age: 29,
      diabetesType: "Prediabetes",
      lastVisitDate: "2026-04-06",
    },
    {
      id: "faith-lungu",
      name: "Faith Lungu",
      age: 52,
      diabetesType: "Type 2",
      lastVisitDate: "2026-04-11",
    },
    {
      id: "agnes-sitali",
      name: "Agnes Sitali",
      age: 61,
      diabetesType: "Type 2",
      lastVisitDate: "2026-04-09",
    },
    {
      id: "moses-banda",
      name: "Moses Banda",
      age: 38,
      diabetesType: "Type 1",
      lastVisitDate: "2026-04-02",
    },
  ];
}
