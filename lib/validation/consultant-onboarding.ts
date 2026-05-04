import { z } from "zod";

export const consultantOnboardingSchema = z.object({
  // Step 0: Profile
  displayName: z.string().min(2, "Display name is required."),
  hpczNumber: z.string().optional(),

  // Step 1: Professional
  bio: z
    .string()
    .min(20, "Bio must be at least 20 characters.")
    .or(z.literal(""))
    .optional(),
  languages: z.string().optional(),
  specialties: z.string().optional(),
  subSpecialties: z.string().optional(),

  // Step 2: Fees & Dates
  consultationFeeInitial: z.string().optional(),
  consultationFeeFollowup: z.string().optional(),
  certificateExpiryDate: z.string().optional(),
  telemedApprovalExpiryDate: z.string().optional(),
});

export type ConsultantOnboardingValues = z.infer<typeof consultantOnboardingSchema>;

export const consultantOnboardingDefaults: ConsultantOnboardingValues = {
  displayName: "",
  hpczNumber: "",
  bio: "",
  languages: "",
  specialties: "",
  subSpecialties: "",
  consultationFeeInitial: "",
  consultationFeeFollowup: "",
  certificateExpiryDate: "",
  telemedApprovalExpiryDate: "",
};
