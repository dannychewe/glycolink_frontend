import { z } from "zod";

export const consultationWorkspaceSchema = z.object({
  subjective: z.string().min(10, "Add subjective notes."),
  objective: z.string().min(10, "Add objective findings."),
  assessment: z.string().min(10, "Add an assessment."),
  plan: z.string().min(10, "Add a management plan."),
  diagnosis: z.string().min(2, "Diagnosis is required."),
  medications: z.array(
    z.object({
      medicationName: z.string().min(2, "Medication name is required."),
      dosage: z.string().min(2, "Dosage is required."),
      frequency: z.string().min(2, "Frequency is required."),
      instructions: z.string().min(2, "Instructions are required."),
    }),
  ),
  labOrders: z.array(
    z.object({
      testName: z.string().min(2, "Test name is required."),
      notes: z.string().min(2, "Notes are required."),
    }),
  ),
});

export type ConsultationWorkspaceValues = z.infer<
  typeof consultationWorkspaceSchema
>;
