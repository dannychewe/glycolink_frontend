"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@apollo/client";
import { FormProvider, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Pencil,
  Send,
} from "lucide-react";
import { OnboardingStepper } from "@/components/patient/onboarding/OnboardingStepper";
import { StepProfile } from "@/components/consultant/onboarding/StepProfile";
import { StepProfessionalDetails } from "@/components/consultant/onboarding/StepProfessionalDetails";
import { StepFees } from "@/components/consultant/onboarding/StepFees";
import { StepCredentials } from "@/components/consultant/onboarding/StepCredentials";
import { StepAvailability } from "@/components/consultant/onboarding/StepAvailability";
import { StepReview } from "@/components/consultant/onboarding/StepReview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  consultantOnboardingSchema,
  consultantOnboardingDefaults,
  type ConsultantOnboardingValues,
} from "@/lib/validation/consultant-onboarding";
import {
  CREATE_PROVIDER_PROFILE_MUTATION,
  MY_PROVIDER_PROFILE_QUERY,
  SUBMIT_PROVIDER_PROFILE_MUTATION,
  UPDATE_PROVIDER_PROFILE_MUTATION,
  UPDATE_PROVIDER_SPECIALTIES_MUTATION,
  PROVIDER_ONBOARDING_READINESS_QUERY,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";

type UploadedLicense = {
  id: string;
  type: string;
  fileUrl: string;
  expiryDate: string | null;
  issuedAt: string | null;
};

type ReadinessItem = {
  code: string;
  label: string;
  complete: boolean;
  action: string | null;
};

type ProviderOnboardingReadiness = {
  status: string | null;
  verificationStatus: string | null;
  canSubmit: boolean;
  canResubmit: boolean;
  submitted: boolean;
  approved: boolean;
  missingRequired: string[];
  missingSetup: string[];
  nextAction: string | null;
  requiredItems: ReadinessItem[];
  setupItems: ReadinessItem[];
} | null;

const steps = [
  {
    title: "Profile",
    description: "Your display name and registration number.",
    fields: ["displayName"] as const,
  },
  {
    title: "Professional",
    description: "Bio, specialties, and languages you speak.",
    fields: [] as const,
  },
  {
    title: "Fees & Dates",
    description: "Your consultation fees and license expiry dates.",
    fields: [] as const,
  },
  {
    title: "Credentials",
    description: "Upload your practicing certificate and licenses.",
    fields: [] as const,
  },
  {
    title: "Availability",
    description: "Set the days and hours you are available.",
    fields: [] as const,
  },
  {
    title: "Review",
    description: "Confirm everything before submitting.",
    fields: [] as const,
  },
];

const REVIEW_STEP = steps.length - 1;

type ExistingProfile = {
  id: string;
  displayName: string | null;
  hpczNumber: string | null;
  bio: string | null;
  languages: string | null;
  languagesJson: string[] | string | null;
  specialties: string[] | string | null;
  subSpecialties: string[] | string | null;
  consultationFeeInitial: number | null;
  consultationFeeFollowup: number | null;
  certificateExpiryDate: string | null;
  telemedApprovalExpiryDate: string | null;
  status: string;
  licenses?: UploadedLicense[] | null;
} | null;

const nextActionLabels: Record<string, string> = {
  UPDATE_PROFILE: "Save profile",
  UPLOAD_LICENSE: "Upload document",
  UPDATE_SPECIALTIES: "Choose specialties",
  SET_AVAILABILITY: "Set availability",
  SUBMIT_PROFILE: "Submit for review",
  AWAIT_ADMIN_REVIEW: "Awaiting review",
  OPEN_DASHBOARD: "Go to dashboard",
};

const nextActionSteps: Record<string, number> = {
  UPDATE_PROFILE: 0,
  UPDATE_SPECIALTIES: 1,
  UPLOAD_LICENSE: 3,
  SET_AVAILABILITY: 4,
  SUBMIT_PROFILE: REVIEW_STEP,
};

function parseCommaSeparatedNames(value: string | undefined) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function languagesToCsv(languages: string | string[] | null | undefined) {
  if (!languages) return "";
  if (Array.isArray(languages)) return languages.join(", ");
  try {
    const parsed = JSON.parse(languages) as unknown;
    return Array.isArray(parsed) ? parsed.map(String).join(", ") : languages;
  } catch {
    return languages;
  }
}

function namesToCsv(value: string | string[] | null | undefined) {
  if (!value) return "";
  return Array.isArray(value) ? value.join(", ") : value;
}

function parseCommaSeparatedIds(value: string | undefined) {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

export function ConsultantOnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [existingProfileId, setExistingProfileId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadedLicense[]>([]);

  const [createProfile] = useMutation(CREATE_PROVIDER_PROFILE_MUTATION);
  const [updateProfile] = useMutation(UPDATE_PROVIDER_PROFILE_MUTATION);
  const [updateSpecialties] = useMutation(UPDATE_PROVIDER_SPECIALTIES_MUTATION);
  const [submitProfile] = useMutation(SUBMIT_PROVIDER_PROFILE_MUTATION);

  const { data: profileData } = useQuery<{ myProviderProfile: ExistingProfile }>(
    MY_PROVIDER_PROFILE_QUERY,
    { fetchPolicy: "network-only" },
  );
  const { data: readinessData, refetch: refetchReadiness } = useQuery<{
    providerOnboardingReadiness: ProviderOnboardingReadiness;
  }>(PROVIDER_ONBOARDING_READINESS_QUERY, { fetchPolicy: "network-only" });

  const methods = useForm<ConsultantOnboardingValues>({
    resolver: zodResolver(consultantOnboardingSchema),
    defaultValues: consultantOnboardingDefaults,
    mode: "onTouched",
  });
  const { setValue, getFieldState } = methods;

  useEffect(() => {
    const p = profileData?.myProviderProfile;
    if (!p) return;
    setExistingProfileId(p.id);

    if (p.displayName && !getFieldState("displayName").isDirty) {
      setValue("displayName", p.displayName);
    }
    if (p.hpczNumber && !getFieldState("hpczNumber").isDirty) {
      setValue("hpczNumber", p.hpczNumber);
    }
    if (p.bio && !getFieldState("bio").isDirty) {
      setValue("bio", p.bio);
    }
    const languages = languagesToCsv(p.languagesJson ?? p.languages);
    if (languages && !getFieldState("languages").isDirty) {
      setValue("languages", languages);
    }
    const specialties = namesToCsv(p.specialties);
    if (specialties && !getFieldState("specialties").isDirty) {
      setValue("specialties", specialties);
    }
    const subSpecialties = namesToCsv(p.subSpecialties);
    if (subSpecialties && !getFieldState("subSpecialties").isDirty) {
      setValue("subSpecialties", subSpecialties);
    }
    if (p.consultationFeeInitial != null && !getFieldState("consultationFeeInitial").isDirty) {
      setValue("consultationFeeInitial", String(p.consultationFeeInitial));
    }
    if (p.consultationFeeFollowup != null && !getFieldState("consultationFeeFollowup").isDirty) {
      setValue("consultationFeeFollowup", String(p.consultationFeeFollowup));
    }
    if (p.certificateExpiryDate && !getFieldState("certificateExpiryDate").isDirty) {
      setValue("certificateExpiryDate", p.certificateExpiryDate);
    }
    if (p.telemedApprovalExpiryDate && !getFieldState("telemedApprovalExpiryDate").isDirty) {
      setValue("telemedApprovalExpiryDate", p.telemedApprovalExpiryDate);
    }
    if (p.licenses?.length) {
      setUploads((current) => {
        const knownIds = new Set(current.map((license) => license.id));
        const newUploads = p.licenses?.filter((license) => !knownIds.has(license.id)) ?? [];
        return newUploads.length ? [...current, ...newUploads] : current;
      });
    }
  }, [profileData, getFieldState, setValue]);

  const isLastStep = currentStep === REVIEW_STEP;
  const isFirstStep = currentStep === 0;
  const currentStepMeta = steps[currentStep];
  const readiness = readinessData?.providerOnboardingReadiness ?? null;
  const nextAction = readiness?.nextAction ?? null;
  const primaryLabel = isLastStep
    ? nextAction
      ? nextActionLabels[nextAction] ?? "Submit for review"
      : "Submit for review"
    : "Continue";
  const isAwaitingReview = nextAction === "AWAIT_ADMIN_REVIEW";
  const incompleteRequiredItems = readiness?.requiredItems.filter((item) => !item.complete) ?? [];
  const incompleteSetupItems = readiness?.setupItems.filter((item) => !item.complete) ?? [];

  async function persistProfileStep() {
    const values = methods.getValues();
    const data = {
      displayName: values.displayName,
      hpczNumber: values.hpczNumber || undefined,
      bio: values.bio || undefined,
      languagesJson: JSON.stringify(parseCommaSeparatedNames(values.languages)),
      consultationFeeInitial:
        values.consultationFeeInitial ? Number(values.consultationFeeInitial) : undefined,
      consultationFeeFollowup:
        values.consultationFeeFollowup ? Number(values.consultationFeeFollowup) : undefined,
      certificateExpiryDate: values.certificateExpiryDate || undefined,
      telemedApprovalExpiryDate: values.telemedApprovalExpiryDate || undefined,
    };

    if (existingProfileId) {
      const { data: result } = await updateProfile({ variables: { data } });
      const profile = result?.updateProviderProfile?.providerProfile;
      if (profile?.id) setExistingProfileId(profile.id);
    } else {
      const { data: result } = await createProfile({ variables: { data } });
      const profile = result?.createProviderProfile?.providerProfile;
      if (profile?.id) setExistingProfileId(profile.id);
    }

    await updateSpecialties({
      variables: {
        specialtyIds: parseCommaSeparatedIds(values.specialtyIds),
        subSpecialtyIds: parseCommaSeparatedIds(values.subSpecialtyIds),
      },
    });

    await refetchReadiness();
  }

  async function handleNext() {
    const fields = steps[currentStep].fields;
    const isValid = fields.length > 0 ? await methods.trigger(fields) : true;
    if (!isValid) return;

    setSubmitError(null);
    setErrorStep(null);

    // Persist profile data on steps 0–2
    if (currentStep <= 2) {
      try {
        await persistProfileStep();
      } catch (error) {
        const code = getGraphQLErrorCode(error);
        if (code === "PROFILE_ALREADY_EXISTS") {
          setExistingProfileId("existing");
          try {
            await persistProfileStep();
          } catch (retryError) {
            setSubmitError(getGraphQLErrorMessage(retryError, "Failed to save profile. Please try again."));
            return;
          }
        } else {
          setSubmitError(getGraphQLErrorMessage(error, "Failed to save. Please try again."));
          return;
        }
      }
    }

    await refetchReadiness();
    setCurrentStep((step) => Math.min(step + 1, REVIEW_STEP));
  }

  function handleBack() {
    setSubmitError(null);
    setErrorStep(null);
    setCurrentStep((step) => Math.max(step - 1, 0));
  }

  function handleEditStep(stepIndex: number) {
    setSubmitError(null);
    setErrorStep(null);
    setCurrentStep(stepIndex);
  }

  async function handleSubmit() {
    setSubmitError(null);
    setErrorStep(null);

    if (readiness && !readiness.canSubmit && !readiness.canResubmit) {
      setSubmitError("Complete the required items before submitting your profile for review.");
      setErrorStep(nextAction ? nextActionSteps[nextAction] ?? 0 : 0);
      return;
    }

    setIsSubmitting(true);

    try {
      await submitProfile();
      await refetchReadiness();
      setSubmitMessage("Profile submitted for verification.");
    } catch (error) {
      const code = getGraphQLErrorCode(error);
      if (code === "PROFILE_INCOMPLETE") {
        setSubmitError(getGraphQLErrorMessage(error, "Your profile is incomplete. Please review each step."));
        setErrorStep(0);
      } else if (
        code === "AUTH_TOKEN_EXPIRED" ||
        code === "AUTH_TOKEN_INVALID" ||
        code === "UNAUTHENTICATED"
      ) {
        router.replace("/login?next=/consultant/onboarding");
      } else {
        setSubmitError(getGraphQLErrorMessage(error, "Unable to submit profile right now. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePrimaryAction() {
    // Readiness describes the next incomplete onboarding requirement, but it
    // must not override the sequential navigation of the wizard itself.
    if (!isLastStep) {
      await handleNext();
      return;
    }

    if (nextAction === "OPEN_DASHBOARD") {
      router.push("/consultant/dashboard");
      return;
    }

    if (nextAction === "AWAIT_ADMIN_REVIEW") {
      return;
    }

    if (nextAction === "SUBMIT_PROFILE") {
      await handleSubmit();
      return;
    }

    if (nextAction === "UPLOAD_LICENSE" || nextAction === "UPDATE_SPECIALTIES" || nextAction === "SET_AVAILABILITY") {
      setCurrentStep(nextActionSteps[nextAction]);
      return;
    }

    if (nextAction === "UPDATE_PROFILE") {
      try {
        await persistProfileStep();
        setSubmitMessage("Profile saved.");
      } catch (error) {
        setSubmitError(getGraphQLErrorMessage(error, "Failed to save profile. Please try again."));
      }
      return;
    }

    if (isLastStep) {
      await handleSubmit();
    } else {
      await handleNext();
    }
  }

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        <OnboardingStepper
          steps={steps.map((step) => step.title)}
          currentStep={currentStep}
        />

        {submitError ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{submitError}</span>
            </div>
            {errorStep !== null ? (
              <button
                type="button"
                onClick={() => handleEditStep(errorStep)}
                className="flex shrink-0 items-center gap-1 text-xs font-medium underline underline-offset-2 hover:opacity-80"
              >
                <Pencil className="size-3" />
                Fix in {steps[errorStep].title}
              </button>
            ) : null}
          </div>
        ) : null}

        {submitMessage ? (
          <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>{submitMessage}</span>
          </div>
        ) : null}

        {readiness ? (
          <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 text-sm md:grid-cols-2">
            <div className="space-y-2">
              <p className="font-semibold text-text">Required before review</p>
              {readiness.requiredItems.map((item) => (
                <div key={item.code} className="flex items-center justify-between gap-3">
                  <span className={item.complete ? "text-muted line-through" : "text-text"}>
                    {item.label}
                  </span>
                  <span className={item.complete ? "text-success" : "text-danger"}>
                    {item.complete ? "Done" : "Required"}
                  </span>
                </div>
              ))}
              {incompleteRequiredItems.length ? (
                <p className="text-xs text-muted">
                  Complete these items before submitting. Required items cannot be skipped.
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className="font-semibold text-text">Recommended setup</p>
              {readiness.setupItems.map((item) => (
                <div key={item.code} className="flex items-center justify-between gap-3">
                  <span className={item.complete ? "text-muted line-through" : "text-text"}>
                    {item.label}
                  </span>
                  <span className={item.complete ? "text-success" : "text-muted"}>
                    {item.complete ? "Done" : "Can add later"}
                  </span>
                </div>
              ))}
              {incompleteSetupItems.length ? (
                <p className="text-xs text-muted">
                  Recommended items can be finished now or added after review.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="border-b border-border pb-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Step {currentStep + 1} of {steps.length}
              </p>
              <h2 className="text-xl font-semibold text-text">{currentStepMeta.title}</h2>
              <p className="text-sm text-muted">{currentStepMeta.description}</p>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {currentStep === 0 ? (
              <StepProfile />
            ) : currentStep === 1 ? (
              <StepProfessionalDetails />
            ) : currentStep === 2 ? (
              <StepFees />
            ) : currentStep === 3 ? (
              <StepCredentials
                uploads={uploads}
                onUploaded={(lic) => {
                  setUploads((prev) => [...prev, lic]);
                  void refetchReadiness();
                }}
                onRemove={(id) => setUploads((prev) => prev.filter((l) => l.id !== id))}
              />
            ) : currentStep === 4 ? (
              <StepAvailability />
            ) : (
              <StepReview onEdit={handleEditStep} uploadCount={uploads.length} />
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleBack}
            disabled={isFirstStep || isSubmitting}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              type="button"
              disabled={isSubmitting || isAwaitingReview}
              onClick={() => void handlePrimaryAction()}
              className="gap-1.5 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {primaryLabel}
                </>
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void handlePrimaryAction()}
              disabled={isSubmitting}
              className="gap-1.5 px-6"
            >
              {primaryLabel}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}
