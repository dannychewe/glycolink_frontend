import { z } from "zod";

export const patientOnboardingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  dateOfBirth: z.string().min(1, "Date of birth is required."),
  phone: z.string().optional(),
  email: z.string().email("Enter a valid email address.").or(z.literal("")),
  diabetesType: z.enum(["TYPE_1", "TYPE_2", "GESTATIONAL", "PREDIABETES", "OTHER"], {
    error: "Select a diabetes type.",
  }),
  diagnosisDate: z.string().min(1, "Diagnosis date is required."),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  additionalNotes: z.string().optional(),
  emergencyContactName: z.string().min(2, "Emergency contact name is required."),
  emergencyContactRelationship: z.string().min(2, "Relationship is required."),
  emergencyContactPhone: z.string().min(6, "Emergency contact phone is required."),
  consent: z.boolean().refine((value) => value === true, {
    message: "You must agree before continuing.",
  }),
});

export type PatientOnboardingValues = z.infer<typeof patientOnboardingSchema>;
