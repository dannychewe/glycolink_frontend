"use client";

import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { getGraphQLErrorCode, getGraphQLErrorMessage, useAuth } from "@/features/auth/auth-context";
import {
  ACCEPT_CONSENT_MUTATION,
  ADD_ALLERGY_MUTATION,
  ADD_CONDITION_MUTATION,
  ADD_MEDICATION_MUTATION,
  ADD_PATIENT_CONTACT_MUTATION,
  ALLERGY_SEVERITY_OPTIONS,
  CONDITION_STATUS_OPTIONS,
  CONSENT_POLICY_TYPE_OPTIONS,
  CREATE_PATIENT_PROFILE_MUTATION,
  DIABETES_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  MEDICATION_STATUS_OPTIONS,
  MY_PATIENT_PROFILE_QUERY,
  PROFILE_COMPLETION_STATUS_QUERY,
  UPDATE_PATIENT_PROFILE_MUTATION,
  UPLOAD_PATIENT_DOCUMENT_MUTATION,
} from "@/lib/patient/clinical-profile-graphql";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileDropZone } from "@/components/ui/file-drop-zone";

type PatientProfileResponse = {
  myPatientProfile: {
    id: string;
    fullName: string | null;
    dateOfBirth: string | null;
    diabetesType: string | null;
    diagnosisDate: string | null;
    profileComplete: boolean;
    onboardingStatus: string | null;
  } | null;
};

type CompletionStatusResponse = {
  profileCompletionStatus: {
    isComplete: boolean;
    percentComplete: number;
    missingItems: string[];
  };
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

function toTitle(text: string) {
  return text
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function mapProfileError(error: unknown) {
  const code = getGraphQLErrorCode(error);

  if (code === "INVALID_DIABETES_TYPE") {
    return "Invalid diabetes type selected.";
  }

  if (code === "PATIENT_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") {
    return "Access denied for this tenant profile.";
  }

  if (code === "PATIENT_PROFILE_NOT_FOUND") {
    return "Patient profile not found. Create the profile first.";
  }

  return getGraphQLErrorMessage(error, "Request failed. Please try again.");
}

export function PatientClinicalProfileManager() {
  const { status, isAuthenticated, user } = useAuth();
  const [alert, setAlert] = useState<AlertState>(null);
  const canQueryProtectedProfile = status === "authenticated" && isAuthenticated && !!user?.isVerified;

  const {
    data: profileData,
    loading: isLoadingProfile,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery<PatientProfileResponse>(MY_PATIENT_PROFILE_QUERY, {
    fetchPolicy: "network-only",
    skip: !canQueryProtectedProfile,
  });

  const {
    data: completionData,
    refetch: refetchCompletion,
  } = useQuery<CompletionStatusResponse>(PROFILE_COMPLETION_STATUS_QUERY, {
    fetchPolicy: "network-only",
    skip: !canQueryProtectedProfile,
  });

  const [createPatientProfile, { loading: isCreatingProfile }] = useMutation(
    CREATE_PATIENT_PROFILE_MUTATION,
  );
  const [updatePatientProfile, { loading: isUpdatingProfile }] = useMutation(
    UPDATE_PATIENT_PROFILE_MUTATION,
  );
  const [addAllergy, { loading: isAddingAllergy }] = useMutation(ADD_ALLERGY_MUTATION);
  const [addCondition, { loading: isAddingCondition }] = useMutation(ADD_CONDITION_MUTATION);
  const [addMedication, { loading: isAddingMedication }] = useMutation(ADD_MEDICATION_MUTATION);
  const [addPatientContact, { loading: isAddingContact }] = useMutation(
    ADD_PATIENT_CONTACT_MUTATION,
  );
  const [uploadPatientDocument, { loading: isUploadingDocument }] = useMutation(
    UPLOAD_PATIENT_DOCUMENT_MUTATION,
  );
  const [acceptConsent, { loading: isAcceptingConsent }] = useMutation(ACCEPT_CONSENT_MUTATION);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    dateOfBirth: "",
    diabetesType: "type_2",
    diagnosisDate: "",
  });
  const [allergyForm, setAllergyForm] = useState({
    substance: "",
    reaction: "",
    severity: "moderate",
  });
  const [conditionForm, setConditionForm] = useState({
    description: "",
    codeSystem: "ICD-10",
    code: "",
    diagnosedAt: "",
    status: "active",
  });
  const [medicationForm, setMedicationForm] = useState({
    drugName: "",
    dose: "",
    frequency: "",
    route: "",
    status: "active",
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    isPrimary: true,
  });
  const [documentForm, setDocumentForm] = useState({
    docType: "other",
    recordedDate: "",
    file: null as File | null,
  });
  const [documentFileKey, setDocumentFileKey] = useState(0);
  const [consentForm, setConsentForm] = useState({
    policyType: "terms_of_service",
    version: "v1",
  });

  const profile = profileData?.myPatientProfile ?? null;
  const profileCode = getGraphQLErrorCode(profileError);
  const profileMissing = profileCode === "PATIENT_PROFILE_NOT_FOUND";

  useEffect(() => {
    if (!profile) {
      return;
    }

    setProfileForm({
      fullName: profile.fullName ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      diabetesType: profile.diabetesType ?? "type_2",
      diagnosisDate: profile.diagnosisDate ?? "",
    });
  }, [profile]);

  async function refreshAll() {
    if (!canQueryProtectedProfile) {
      return;
    }
    await Promise.all([refetchProfile(), refetchCompletion()]);
  }

  async function handleCreateProfile() {
    setAlert(null);
    try {
      await createPatientProfile();
      await refreshAll();
      setAlert({ type: "success", message: "Patient profile created." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleUpdateProfile(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await updatePatientProfile({
        variables: {
          data: {
            fullName: profileForm.fullName,
            dateOfBirth: profileForm.dateOfBirth,
            diabetesType: profileForm.diabetesType,
            diagnosisDate: profileForm.diagnosisDate,
          },
        },
      });
      await refreshAll();
      setAlert({ type: "success", message: "Profile updated." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddAllergy(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addAllergy({ variables: { data: allergyForm } });
      setAllergyForm({ substance: "", reaction: "", severity: "moderate" });
      setAlert({ type: "success", message: "Allergy added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddCondition(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addCondition({ variables: { data: conditionForm } });
      setConditionForm({
        description: "",
        codeSystem: "ICD-10",
        code: "",
        diagnosedAt: "",
        status: "active",
      });
      setAlert({ type: "success", message: "Condition added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddMedication(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addMedication({ variables: { data: medicationForm } });
      setMedicationForm({ drugName: "", dose: "", frequency: "", route: "", status: "active" });
      setAlert({ type: "success", message: "Medication added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddContact(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addPatientContact({
        variables: {
          data: {
            ...contactForm,
            email: contactForm.email || undefined,
          },
        },
      });
      setContactForm({ name: "", relationship: "", phone: "", email: "", isPrimary: true });
      await refreshAll();
      setAlert({ type: "success", message: "Emergency contact added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleUploadDocument(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    if (!documentForm.file) {
      setAlert({ type: "error", message: "Please select a file to upload." });
      return;
    }

    try {
      await uploadPatientDocument({
        variables: {
          file: documentForm.file,
          docType: documentForm.docType,
          recordedDate: documentForm.recordedDate || undefined,
        },
      });
      setDocumentForm({ docType: "other", recordedDate: "", file: null });
      setDocumentFileKey((k) => k + 1);
      setAlert({ type: "success", message: "Document uploaded." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAcceptConsent(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await acceptConsent({ variables: consentForm });
      setAlert({ type: "success", message: "Consent recorded." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  if (!canQueryProtectedProfile) {
    return (
      <div className="space-y-6">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
            Patient Clinical Profile
          </p>
          <h1 className="text-3xl font-semibold text-text sm:text-4xl">Clinical Profile Management</h1>
        </header>

        <Card>
          <CardContent className="pt-6 text-sm text-muted">
            {status === "loading"
              ? "Loading your session..."
              : "Waiting for an authenticated session before loading profile data."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Patient Clinical Profile
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Clinical Profile Management</h1>
      </header>

      {alert ? (
        <div
          className={
            alert.type === "error"
              ? "rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger"
              : "rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success"
          }
        >
          {alert.message}
        </div>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Completion Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-text">
          <p>Complete: {completionData?.profileCompletionStatus?.isComplete ? "Yes" : "No"}</p>
          <p>Percent: {completionData?.profileCompletionStatus?.percentComplete ?? 0}%</p>
          <p>
            Missing:{" "}
            {(completionData?.profileCompletionStatus?.missingItems ?? [])
              .map(toTitle)
              .join(", ") || "None"}
          </p>
        </CardContent>
      </Card>

      {profileMissing ? (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Create Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={handleCreateProfile} disabled={isCreatingProfile}>
              {isCreatingProfile ? "Creating..." : "Create Patient Profile"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {profileError && !profileMissing ? (
        <Card>
          <CardContent className="pt-6 text-sm text-danger">
            Failed to load profile: {mapProfileError(profileError)}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateProfile}>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input
                id="fullName"
                value={profileForm.fullName}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={profileForm.dateOfBirth}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diabetesType">Diabetes type</Label>
              <select
                id="diabetesType"
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={profileForm.diabetesType}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, diabetesType: event.target.value }))}
              >
                {DIABETES_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="diagnosisDate">Diagnosis date</Label>
              <Input
                id="diagnosisDate"
                type="date"
                value={profileForm.diagnosisDate}
                onChange={(event) => setProfileForm((prev) => ({ ...prev, diagnosisDate: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isLoadingProfile || isUpdatingProfile || profileMissing}>
                {isUpdatingProfile ? "Saving..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Add Allergy</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAddAllergy}>
              <Input
                placeholder="Substance"
                value={allergyForm.substance}
                onChange={(event) => setAllergyForm((prev) => ({ ...prev, substance: event.target.value }))}
              />
              <Input
                placeholder="Reaction"
                value={allergyForm.reaction}
                onChange={(event) => setAllergyForm((prev) => ({ ...prev, reaction: event.target.value }))}
              />
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={allergyForm.severity}
                onChange={(event) => setAllergyForm((prev) => ({ ...prev, severity: event.target.value }))}
              >
                {ALLERGY_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={isAddingAllergy}>
                {isAddingAllergy ? "Adding..." : "Add Allergy"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Add Condition</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAddCondition}>
              <Input
                placeholder="Description"
                value={conditionForm.description}
                onChange={(event) => setConditionForm((prev) => ({ ...prev, description: event.target.value }))}
              />
              <Input
                placeholder="Code system (e.g. ICD-10)"
                value={conditionForm.codeSystem}
                onChange={(event) => setConditionForm((prev) => ({ ...prev, codeSystem: event.target.value }))}
              />
              <Input
                placeholder="Code"
                value={conditionForm.code}
                onChange={(event) => setConditionForm((prev) => ({ ...prev, code: event.target.value }))}
              />
              <Input
                type="date"
                value={conditionForm.diagnosedAt}
                onChange={(event) => setConditionForm((prev) => ({ ...prev, diagnosedAt: event.target.value }))}
              />
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={conditionForm.status}
                onChange={(event) => setConditionForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {CONDITION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={isAddingCondition}>
                {isAddingCondition ? "Adding..." : "Add Condition"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Add Medication</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAddMedication}>
              <Input
                placeholder="Drug name"
                value={medicationForm.drugName}
                onChange={(event) => setMedicationForm((prev) => ({ ...prev, drugName: event.target.value }))}
              />
              <Input
                placeholder="Dose"
                value={medicationForm.dose}
                onChange={(event) => setMedicationForm((prev) => ({ ...prev, dose: event.target.value }))}
              />
              <Input
                placeholder="Frequency"
                value={medicationForm.frequency}
                onChange={(event) => setMedicationForm((prev) => ({ ...prev, frequency: event.target.value }))}
              />
              <Input
                placeholder="Route"
                value={medicationForm.route}
                onChange={(event) => setMedicationForm((prev) => ({ ...prev, route: event.target.value }))}
              />
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={medicationForm.status}
                onChange={(event) => setMedicationForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                {MEDICATION_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={isAddingMedication}>
                {isAddingMedication ? "Adding..." : "Add Medication"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Add Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAddContact}>
              <Input
                placeholder="Name"
                value={contactForm.name}
                onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
              />
              <Input
                placeholder="Relationship"
                value={contactForm.relationship}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, relationship: event.target.value }))
                }
              />
              <Input
                placeholder="Phone"
                value={contactForm.phone}
                onChange={(event) => setContactForm((prev) => ({ ...prev, phone: event.target.value }))}
              />
              <Input
                placeholder="Email (optional)"
                type="email"
                value={contactForm.email}
                onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, isPrimary: event.target.checked }))
                  }
                />
                Primary contact
              </label>
              <Button type="submit" disabled={isAddingContact}>
                {isAddingContact ? "Adding..." : "Add Contact"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Upload Patient Document</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleUploadDocument}>
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={documentForm.docType}
                onChange={(event) => setDocumentForm((prev) => ({ ...prev, docType: event.target.value }))}
              >
                {DOCUMENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                type="date"
                value={documentForm.recordedDate}
                onChange={(event) =>
                  setDocumentForm((prev) => ({ ...prev, recordedDate: event.target.value }))
                }
              />
              <FileDropZone
                key={documentFileKey}
                value={documentForm.file}
                onChange={(file) => setDocumentForm((prev) => ({ ...prev, file }))}
                hint="PDF, images, or other clinical documents"
                loading={isUploadingDocument}
              />
              <Button type="submit" disabled={isUploadingDocument}>
                {isUploadingDocument ? "Uploading..." : "Upload Document"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Accept Consent</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAcceptConsent}>
              <select
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={consentForm.policyType}
                onChange={(event) => setConsentForm((prev) => ({ ...prev, policyType: event.target.value }))}
              >
                {CONSENT_POLICY_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Version (e.g. v1)"
                value={consentForm.version}
                onChange={(event) => setConsentForm((prev) => ({ ...prev, version: event.target.value }))}
              />
              <Button type="submit" disabled={isAcceptingConsent}>
                {isAcceptingConsent ? "Saving..." : "Accept Consent"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
