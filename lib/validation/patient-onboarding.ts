import { z } from "zod";

export const patientOnboardingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  diabetesType: z.enum(["type_1", "type_2", "gestational", "prediabetes", "other"], {
    error: "Select a diabetes type.",
  }),
  diagnosisDate: z.string().min(1, "Diagnosis date is required."),
  emergencyContactName: z.string().min(2, "Emergency contact name is required."),
  emergencyContactRelationship: z.string().min(2, "Relationship is required."),
  emergencyContactPhone: z.string().min(6, "Emergency contact phone is required."),
  consent: z.boolean().refine((value) => value === true, {
    message: "You must agree before continuing.",
  }),
});

export type PatientOnboardingValues = z.infer<typeof patientOnboardingSchema>;
