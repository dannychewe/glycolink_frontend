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
import { StepBasicInfo } from "@/components/patient/onboarding/StepBasicInfo";
import { StepConsent } from "@/components/patient/onboarding/StepConsent";
import { StepDiabetesProfile } from "@/components/patient/onboarding/StepDiabetesProfile";
import { StepEmergencyContact } from "@/components/patient/onboarding/StepEmergencyContact";
import { StepMedicalInfo } from "@/components/patient/onboarding/StepMedicalInfo";
import { StepReview } from "@/components/patient/onboarding/StepReview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  patientOnboardingSchema,
  type PatientOnboardingValues,
} from "@/lib/validation/patient-onboarding";
import {
  ACCEPT_CONSENT_MUTATION,
  ADD_PATIENT_CONTACT_MUTATION,
  COMPLETE_PATIENT_PROFILE_MUTATION,
  GET_PATIENT_CONSENTS_QUERY,
  GET_PATIENT_CONTACTS_QUERY,
  MY_PATIENT_PROFILE_QUERY,
  PATIENT_ONBOARDING_READINESS_QUERY,
  UPDATE_PATIENT_PROFILE_MUTATION,
  UPDATE_PATIENT_CONTACT_MUTATION,
} from "@/lib/patient/clinical-profile-graphql";
import { getGraphQLErrorCode, getGraphQLErrorMessage, useAuth } from "@/features/auth/auth-context";

const steps = [
  {
    title: "Basic Info",
    description: "Your name, date of birth, and contact details.",
    fields: ["fullName", "dateOfBirth", "phone", "email"] as const,
  },
  {
    title: "Diabetes Profile",
    description: "Help your care team understand your diabetes history.",
    fields: ["diabetesType", "diagnosisDate"] as const,
  },
  {
    title: "Medical Info",
    description: "Optional details about allergies, medications, and notes.",
    fields: ["allergies", "currentMedications", "additionalNotes"] as const,
  },
  {
    title: "Emergency Contact",
    description: "Someone we can reach if you're unable to communicate.",
    fields: [
      "emergencyContactName",
      "emergencyContactRelationship",
      "emergencyContactPhone",
    ] as const,
  },
  {
    title: "Consent",
    description: "Review and agree to our terms before continuing.",
    fields: ["consent"] as const,
  },
  {
    title: "Review",
    description: "Confirm everything looks correct before submitting.",
    fields: [] as const,
  },
];

const REVIEW_STEP = steps.length - 1;

type ReadinessItem = {
  code: string;
  label: string;
  complete: boolean;
  action: string | null;
};

type PatientOnboardingReadiness = {
  isComplete: boolean;
  pcqComplete: boolean;
  consultationReady: boolean;
  percentComplete: number;
  missingRequired: string[];
  missingSetup: string[];
  nextAction: string | null;
  requiredItems: ReadinessItem[];
  setupItems: ReadinessItem[];
} | null;

const nextActionLabels: Record<string, string> = {
  UPDATE_PROFILE: "Save profile",
  ADD_EMERGENCY_CONTACT: "Add emergency contact",
  COMPLETE_BASELINE_PCQ: "Complete questionnaire",
  UPDATE_PRIVACY_PREFERENCES: "Save preferences",
  OPEN_DASHBOARD: "Go to dashboard",
};

const nextActionSteps: Record<string, number> = {
  UPDATE_PROFILE: 0,
  ADD_EMERGENCY_CONTACT: 3,
  UPDATE_PRIVACY_PREFERENCES: 4,
};

const defaultValues: PatientOnboardingValues = {
  fullName: "",
  dateOfBirth: "",
  phone: "",
  email: "",
  diabetesType: "type_2",
  diagnosisDate: "",
  allergies: "",
  currentMedications: "",
  additionalNotes: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  consent: false,
};

type ExistingProfile = {
  id: string;
  fullName: string | null;
  dateOfBirth: string | null;
  phone: string | null;
  diabetesType: string | null;
  diagnosisDate: string | null;
  allergies: string | null;
  currentMedications: string | null;
  additionalNotes: string | null;
} | null;

type ExistingContact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
} | null;

type ExistingConsent = {
  id: string;
  policyType: string;
  version: string;
  acceptedAt: string;
} | null;

const _ERROR_STEP_MAP: Record<string, number> = {
  INVALID_DIABETES_TYPE: 1,
  INVALID_DIAGNOSIS_DATE: 1,
  INVALID_DATE_OF_BIRTH: 0,
  INVALID_PHONE: 0,
  DUPLICATE_CONTACT: 3,
  INVALID_CONTACT: 3,
};

export function PatientOnboardingWizard() {
  const router = useRouter();
  const { user, status, isAuthenticated } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [errorStep, setErrorStep] = useState<number | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isFullNameEditable, setIsFullNameEditable] = useState(true);
  const [existingContactId, setExistingContactId] = useState<string | null>(null);
  const [consentAlreadyAccepted, setConsentAlreadyAccepted] = useState(false);

  const [completeProfile] = useMutation(COMPLETE_PATIENT_PROFILE_MUTATION);
  const [updateProfile] = useMutation(UPDATE_PATIENT_PROFILE_MUTATION);
  const [addPatientContact] = useMutation(ADD_PATIENT_CONTACT_MUTATION);
  const [updatePatientContact] = useMutation(UPDATE_PATIENT_CONTACT_MUTATION);
  const [acceptConsent] = useMutation(ACCEPT_CONSENT_MUTATION);

  const canQuery = status === "authenticated" && isAuthenticated && !!user?.isVerified;

  const { data: profileData } = useQuery<{ myPatientProfile: ExistingProfile }>(
    MY_PATIENT_PROFILE_QUERY,
    { fetchPolicy: "network-only", skip: !canQuery },
  );

  const { data: contactsData } = useQuery<{ myPatientContacts: ExistingContact[] }>(
    GET_PATIENT_CONTACTS_QUERY,
    { fetchPolicy: "network-only", skip: !canQuery },
  );

  const { data: consentsData } = useQuery<{ myPatientConsents: ExistingConsent[] }>(
    GET_PATIENT_CONSENTS_QUERY,
    { fetchPolicy: "network-only", skip: !canQuery },
  );
  const { data: readinessData, refetch: refetchReadiness } = useQuery<{
    patientOnboardingReadiness: PatientOnboardingReadiness;
  }>(PATIENT_ONBOARDING_READINESS_QUERY, { fetchPolicy: "network-only", skip: !canQuery });

  const methods = useForm<PatientOnboardingValues>({
    resolver: zodResolver(patientOnboardingSchema),
    defaultValues,
    mode: "onTouched",
  });
  const { setValue, getFieldState } = methods;

  const isLastStep = currentStep === REVIEW_STEP;
  const isFirstStep = currentStep === 0;
  const currentStepMeta = steps[currentStep];
  const readiness = readinessData?.patientOnboardingReadiness ?? null;
  const nextAction = readiness?.nextAction ?? null;
  const primaryLabel = nextAction
    ? nextActionLabels[nextAction] ?? "Continue"
    : isLastStep
      ? "Submit profile"
      : "Continue";
  const incompleteRequiredItems = readiness?.requiredItems.filter((item) => !item.complete) ?? [];
  const incompleteSetupItems = readiness?.setupItems.filter((item) => !item.complete) ?? [];

  useEffect(() => {
    const profile = profileData?.myPatientProfile;

    if (profile?.fullName && !getFieldState("fullName").isDirty) {
      setValue("fullName", profile.fullName);
      setIsFullNameEditable(false);
    }
    if (profile?.dateOfBirth && !getFieldState("dateOfBirth").isDirty) {
      setValue("dateOfBirth", profile.dateOfBirth);
    }
    if (profile?.diabetesType && !getFieldState("diabetesType").isDirty) {
      setValue("diabetesType", profile.diabetesType.toLowerCase() as PatientOnboardingValues["diabetesType"]);
    }
    if (profile?.diagnosisDate && !getFieldState("diagnosisDate").isDirty) {
      setValue("diagnosisDate", profile.diagnosisDate);
    }
    if (profile?.phone && !getFieldState("phone").isDirty) {
      setValue("phone", profile.phone);
    }
    if (profile?.allergies && !getFieldState("allergies").isDirty) {
      setValue("allergies", profile.allergies);
    }
    if (profile?.currentMedications && !getFieldState("currentMedications").isDirty) {
      setValue("currentMedications", profile.currentMedications);
    }
    if (profile?.additionalNotes && !getFieldState("additionalNotes").isDirty) {
      setValue("additionalNotes", profile.additionalNotes);
    }
    if (user?.email && !getFieldState("email").isDirty) {
      setValue("email", user.email);
    }
  }, [profileData, getFieldState, setValue, user?.email]);

  useEffect(() => {
    const contacts = contactsData?.myPatientContacts;
    if (!contacts?.length) return;
    const primary = contacts.find((c) => c?.isPrimary) ?? contacts[0];
    if (!primary) return;
    setExistingContactId(primary.id);
    if (primary.name && !getFieldState("emergencyContactName").isDirty) {
      setValue("emergencyContactName", primary.name);
    }
    if (primary.relationship && !getFieldState("emergencyContactRelationship").isDirty) {
      setValue("emergencyContactRelationship", primary.relationship);
    }
    if (primary.phone && !getFieldState("emergencyContactPhone").isDirty) {
      setValue("emergencyContactPhone", primary.phone);
    }
  }, [contactsData, getFieldState, setValue]);

  useEffect(() => {
    const consents = consentsData?.myPatientConsents;
    if (!consents?.length) return;
    const tos = consents.find((c) => c?.policyType === "terms_of_service");
    if (tos) {
      setConsentAlreadyAccepted(true);
      setValue("consent", true);
    }
  }, [consentsData, setValue]);

  async function handleNext() {
    const fields = steps[currentStep].fields;
    const isValid = fields.length > 0 ? await methods.trigger(fields) : true;
    if (!isValid) return;
    setSubmitError(null);
    setErrorStep(null);
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

  function buildPatientProfileInput() {
    const values = methods.getValues();

    return {
      fullName: values.fullName || undefined,
      dateOfBirth: values.dateOfBirth || undefined,
      phone: values.phone || undefined,
      diabetesType: values.diabetesType ? values.diabetesType.toUpperCase() : undefined,
      diagnosisDate: values.diagnosisDate || undefined,
      allergies: values.allergies || undefined,
      currentMedications: values.currentMedications || undefined,
      additionalNotes: values.additionalNotes || undefined,
    };
  }

  async function persistPatientProfile() {
    await updateProfile({
      variables: {
        data: buildPatientProfileInput(),
      },
    });
    await refetchReadiness();
  }

  async function persistEmergencyContact() {
    const isValid = await methods.trigger([
      "emergencyContactName",
      "emergencyContactRelationship",
      "emergencyContactPhone",
    ]);
    if (!isValid) return false;

    const values = methods.getValues();
    if (existingContactId) {
      await updatePatientContact({
        variables: {
          contactId: existingContactId,
          data: {
            name: values.emergencyContactName,
            relationship: values.emergencyContactRelationship,
            phone: values.emergencyContactPhone,
            isPrimary: true,
          },
        },
      });
    } else {
      const { data } = await addPatientContact({
        variables: {
          data: {
            name: values.emergencyContactName,
            relationship: values.emergencyContactRelationship,
            phone: values.emergencyContactPhone,
            isPrimary: true,
          },
        },
      });
      const contactId = data?.addPatientContact?.contact?.id;
      if (contactId) setExistingContactId(contactId);
    }

    await refetchReadiness();
    return true;
  }

  const submitProfile = methods.handleSubmit(async () => {
    setSubmitError(null);
    setErrorStep(null);
    setSubmitMessage(null);
    setIsSubmitting(true);

    const values = methods.getValues();

    try {
      await completeProfile({
        variables: {
          data: {
            fullName: values.fullName,
            dateOfBirth: values.dateOfBirth,
            phone: values.phone || undefined,
            // diabetesType is a GraphQL enum (TYPE_1, TYPE_2, …); send the uppercase name.
            diabetesType: values.diabetesType.toUpperCase(),
            diagnosisDate: values.diagnosisDate,
            allergies: values.allergies || undefined,
            currentMedications: values.currentMedications || undefined,
            additionalNotes: values.additionalNotes || undefined,
          },
        },
      });

      if (existingContactId) {
        await updatePatientContact({
          variables: {
            contactId: existingContactId,
            data: {
              name: values.emergencyContactName,
              relationship: values.emergencyContactRelationship,
              phone: values.emergencyContactPhone,
              isPrimary: true,
            },
          },
        });
      } else {
        await addPatientContact({
          variables: {
            data: {
              name: values.emergencyContactName,
              relationship: values.emergencyContactRelationship,
              phone: values.emergencyContactPhone,
              isPrimary: true,
            },
          },
        });
      }

      if (!consentAlreadyAccepted) {
        await acceptConsent({
          variables: { policyType: "terms_of_service", version: "v1" },
        });
      }

      await refetchReadiness();
      setSubmitMessage("Profile saved. Complete the baseline questionnaire when prompted.");
    } catch (error) {
      const code = getGraphQLErrorCode(error);

      if (code === "INVALID_DIABETES_TYPE" || code === "INVALID_DIAGNOSIS_DATE") {
        setSubmitError(getGraphQLErrorMessage(error, "Please check your diabetes profile details."));
        setErrorStep(1);
      } else if (code === "INVALID_DATE_OF_BIRTH" || code === "INVALID_PHONE") {
        setSubmitError(getGraphQLErrorMessage(error, "Please check your basic information."));
        setErrorStep(0);
      } else if (code === "DUPLICATE_CONTACT" || code === "INVALID_CONTACT") {
        setSubmitError(getGraphQLErrorMessage(error, "There was an issue with your emergency contact details."));
        setErrorStep(3);
      } else if (code === "PATIENT_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
        setSubmitError(getGraphQLErrorMessage(error, "You do not have access to update this patient profile."));
      } else if (
        code === "AUTH_TOKEN_EXPIRED" ||
        code === "AUTH_TOKEN_INVALID" ||
        code === "AUTH_SESSION_REVOKED" ||
        code === "UNAUTHENTICATED"
      ) {
        router.replace("/login?next=/patient/onboarding");
      } else {
        setSubmitError(getGraphQLErrorMessage(error, "Unable to complete onboarding right now. Please try again."));
      }
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handlePrimaryAction() {
    setSubmitError(null);
    setSubmitMessage(null);

    if (nextAction === "OPEN_DASHBOARD") {
      router.push("/patient/dashboard");
      return;
    }

    if (nextAction === "COMPLETE_BASELINE_PCQ") {
      router.push("/patient/pcq/baseline");
      return;
    }

    if (nextAction === "ADD_EMERGENCY_CONTACT") {
      if (currentStep !== nextActionSteps.ADD_EMERGENCY_CONTACT) {
        setCurrentStep(nextActionSteps.ADD_EMERGENCY_CONTACT);
        return;
      }

      try {
        const saved = await persistEmergencyContact();
        if (saved) setSubmitMessage("Emergency contact saved.");
      } catch (error) {
        setSubmitError(getGraphQLErrorMessage(error, "Unable to save emergency contact."));
        setErrorStep(3);
      }
      return;
    }

    if (nextAction === "UPDATE_PRIVACY_PREFERENCES") {
      if (currentStep !== nextActionSteps.UPDATE_PRIVACY_PREFERENCES) {
        setCurrentStep(nextActionSteps.UPDATE_PRIVACY_PREFERENCES);
        return;
      }

      try {
        if (!consentAlreadyAccepted) {
          await acceptConsent({ variables: { policyType: "terms_of_service", version: "v1" } });
          setConsentAlreadyAccepted(true);
        }
        await refetchReadiness();
        setSubmitMessage("Preferences saved.");
      } catch (error) {
        setSubmitError(getGraphQLErrorMessage(error, "Unable to save preferences."));
        setErrorStep(4);
      }
      return;
    }

    if (nextAction === "UPDATE_PROFILE") {
      try {
        await persistPatientProfile();
        setSubmitMessage("Profile saved.");
      } catch (error) {
        setSubmitError(getGraphQLErrorMessage(error, "Unable to save profile."));
      }
      return;
    }

    if (isLastStep) {
      await submitProfile();
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
              <p className="font-semibold text-text">Required before consultations</p>
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
                  Required items, including the baseline questionnaire, cannot be skipped.
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
                  Recommended items can be finished now or updated later from settings.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <Card>
          <CardHeader className="border-b border-border pb-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <h2 className="text-xl font-semibold text-text">{currentStepMeta.title}</h2>
                <p className="text-sm text-muted">{currentStepMeta.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {currentStep === 0 ? (
              <StepBasicInfo
                isFullNameEditable={isFullNameEditable}
                onEnableFullNameEdit={() => setIsFullNameEditable(true)}
              />
            ) : isLastStep ? (
              <StepReview onEdit={handleEditStep} />
            ) : currentStep === 1 ? (
              <StepDiabetesProfile />
            ) : currentStep === 2 ? (
              <StepMedicalInfo />
            ) : currentStep === 3 ? (
              <StepEmergencyContact />
            ) : (
              <StepConsent />
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
              disabled={isSubmitting}
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
