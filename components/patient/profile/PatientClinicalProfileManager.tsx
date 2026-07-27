"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Mail,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { getGraphQLErrorCode, getGraphQLErrorMessage, useAuth } from "@/features/auth/auth-context";
import {
  ACCEPT_CONSENT_MUTATION,
  ADD_ALLERGY_MUTATION,
  ADD_CONDITION_MUTATION,
  ADD_MEDICATION_MUTATION,
  ADD_PATIENT_CONTACT_MUTATION,
  UPDATE_PATIENT_CONTACT_MUTATION,
  ALLERGY_SEVERITY_OPTIONS,
  CONSENT_POLICY_TYPE_OPTIONS,
  CREATE_PATIENT_PROFILE_MUTATION,
  DIABETES_TYPE_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  PATIENT_CLINICAL_WORKSPACE_QUERY,
  UPDATE_PATIENT_PROFILE_MUTATION,
  UPLOAD_PATIENT_DOCUMENT_MUTATION,
} from "@/lib/patient/clinical-profile-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { cn } from "@/lib/utils/cn";

type AllergyRecord = {
  id: string;
  substance: string | null;
  reaction: string | null;
  severity: string | null;
  status: string | null;
};

type ConditionRecord = {
  id: string;
  description: string | null;
  codeSystem: string | null;
  code: string | null;
  diagnosedAt: string | null;
  status: string | null;
};

type MedicationRecord = {
  id: string;
  drugName: string | null;
  dose: string | null;
  frequency: string | null;
  route: string | null;
  status: string | null;
};

type ContactRecord = {
  id: string;
  name: string | null;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};

type DocumentRecord = {
  id: string;
  docType: string | null;
  recordedDate: string | null;
  originalName: string | null;
  fileUrl: string | null;
};

type ConsentRecord = {
  id: string;
  policyType: string | null;
  version: string | null;
  acceptedAt: string | null;
};

type WorkspaceResponse = {
  myPatientProfile: {
    id: string;
    fullName: string | null;
    email: string | null;
    dateOfBirth: string | null;
    diabetesType: string | null;
    diagnosisDate: string | null;
    phone: string | null;
    allergies: string | null;
    currentMedications: string | null;
    additionalNotes: string | null;
    profileComplete: boolean;
    onboardingStatus: string | null;
    baselineWeight: string | null;
    baselineBpSystolic: number | null;
    baselineBpDiastolic: number | null;
    notes: string | null;
  } | null;
  profileCompletionStatus: {
    isComplete: boolean;
    pcqComplete: boolean;
    consultationReady: boolean;
    percentComplete: number;
    missingItems: string[];
  } | null;
  myPatientAllergies: AllergyRecord[];
  myPatientConditions: ConditionRecord[];
  myPatientMedications: MedicationRecord[];
  myPatientContacts: ContactRecord[];
  myPatientDocuments: DocumentRecord[];
  myPatientConsents: ConsentRecord[];
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

const SELECT_CLASS =
  "flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type ProfileTab = "overview" | "profile" | "clinical" | "contacts" | "documents";

const PROFILE_TABS: { id: ProfileTab; label: string; icon: typeof UserRound }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "clinical", label: "Clinical", icon: HeartPulse },
  { id: "contacts", label: "Contacts", icon: Phone },
  { id: "documents", label: "Documents", icon: FileText },
];

const COMPLETION_REQUIREMENTS = [
  { key: "full_name", label: "Full name" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "diabetes_type", label: "Diabetes type" },
  { key: "diagnosis_date", label: "Diagnosis date" },
  { key: "emergency_contact", label: "Emergency contact" },
  { key: "baseline_pcq", label: "Baseline PCQ" },
] as const;

function toTitle(text: string) {
  return text.replaceAll("_", " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

// Normalize completion keys so "full_name", "fullName", and "Full name" all match,
// regardless of how the backend formats the strings in `missingItems`.
function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type BadgeVariant = "primary" | "secondary" | "success" | "warning" | "danger";

function severityVariant(value?: string | null): BadgeVariant {
  switch ((value ?? "").toLowerCase()) {
    case "severe":
    case "life_threatening":
      return "danger";
    case "moderate":
      return "warning";
    default:
      return "secondary";
  }
}

function statusVariant(value?: string | null): BadgeVariant {
  return (value ?? "").toLowerCase() === "active" ? "success" : "secondary";
}

function RecordItem({
  title,
  subtitle,
  badge,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-sm font-medium text-text">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted">{subtitle}</p> : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </li>
  );
}

function RecordList({
  count,
  empty,
  children,
}: {
  count: number;
  empty: string;
  children: ReactNode;
}) {
  if (count === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-3 py-4 text-center text-sm text-muted">
        {empty}
      </p>
    );
  }
  return <ul className="space-y-2">{children}</ul>;
}

function joinMeta(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ");
}

function mapProfileError(error: unknown) {
  const code = getGraphQLErrorCode(error);

  switch (code) {
    case "INVALID_DIABETES_TYPE":
      return "Invalid diabetes type selected.";
    case "INVALID_ALLERGY_SEVERITY":
      return "Invalid allergy severity selected.";
    case "INVALID_DOCUMENT_TYPE":
      return "Invalid document type selected.";
    case "FILE_REQUIRED":
      return "A file is required for this upload.";
    case "PATIENT_PROFILE_EXISTS":
      return "A patient profile already exists.";
    case "PATIENT_ACCESS_DENIED":
    case "TENANT_ACCESS_DENIED":
      return "Access denied for this tenant profile.";
    case "PATIENT_PROFILE_NOT_FOUND":
      return "Patient profile not found. Create the profile first.";
    default:
      return getGraphQLErrorMessage(error, "Request failed. Please try again.");
  }
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: typeof UserRound;
  title: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={cn("h-full", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </span>
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description ? <p className="text-sm text-muted">{description}</p> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function PatientClinicalProfileManager() {
  const { status, isAuthenticated, user } = useAuth();
  const [alert, setAlert] = useState<AlertState>(null);
  const [tab, setTab] = useState<ProfileTab>("overview");
  const canQueryProtectedProfile =
    status === "authenticated" && isAuthenticated && !!user?.isVerified;

  const {
    data: workspaceData,
    loading: isLoadingProfile,
    error: profileError,
    refetch: refetchWorkspace,
  } = useQuery<WorkspaceResponse>(PATIENT_CLINICAL_WORKSPACE_QUERY, {
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
  const [updatePatientContact, { loading: isUpdatingContact }] = useMutation(
    UPDATE_PATIENT_CONTACT_MUTATION,
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
    phone: "",
    allergies: "",
    currentMedications: "",
    additionalNotes: "",
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
  });
  const [medicationForm, setMedicationForm] = useState({
    drugName: "",
    dose: "",
    frequency: "",
    route: "",
    startedAt: "",
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    isPrimary: true,
  });
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editContactForm, setEditContactForm] = useState({
    name: "",
    relationship: "",
    phone: "",
    email: "",
    isPrimary: false,
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

  const profile = workspaceData?.myPatientProfile ?? null;
  const completion = workspaceData?.profileCompletionStatus ?? null;
  const allergies = workspaceData?.myPatientAllergies ?? [];
  const conditions = workspaceData?.myPatientConditions ?? [];
  const medications = workspaceData?.myPatientMedications ?? [];
  const contacts = workspaceData?.myPatientContacts ?? [];
  const documents = workspaceData?.myPatientDocuments ?? [];
  const consents = workspaceData?.myPatientConsents ?? [];
  const profileCode = getGraphQLErrorCode(profileError);
  const profileMissing = profileCode === "PATIENT_PROFILE_NOT_FOUND";
  const missingItems = completion?.missingItems ?? [];
  const missingSet = new Set(missingItems.map(normalizeKey));
  const knownKeys = new Set(COMPLETION_REQUIREMENTS.map((item) => normalizeKey(item.key)));
  const extraMissing = missingItems.filter((item) => !knownKeys.has(normalizeKey(item)));

  useEffect(() => {
    if (!profile) {
      return;
    }

    setProfileForm({
      fullName: profile.fullName ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      diabetesType: (profile.diabetesType ?? "type_2").toLowerCase(),
      diagnosisDate: profile.diagnosisDate ?? "",
      phone: profile.phone ?? "",
      allergies: profile.allergies ?? "",
      currentMedications: profile.currentMedications ?? "",
      additionalNotes: profile.additionalNotes ?? "",
    });
  }, [profile]);

  useEffect(() => {
    if (!alert) {
      return;
    }
    const timer = window.setTimeout(() => setAlert(null), 6000);
    return () => window.clearTimeout(timer);
  }, [alert]);

  async function refreshAll() {
    if (!canQueryProtectedProfile) {
      return;
    }
    await refetchWorkspace();
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
            // diabetesType is a GraphQL enum (TYPE_1, TYPE_2, …); send the uppercase name.
            diabetesType: profileForm.diabetesType.toUpperCase(),
            diagnosisDate: profileForm.diagnosisDate,
            // These round-trip from PatientSummary, so send the actual values
            // (including empty strings) to allow clearing a previously saved value.
            phone: profileForm.phone,
            allergies: profileForm.allergies,
            currentMedications: profileForm.currentMedications,
            additionalNotes: profileForm.additionalNotes,
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
      await refreshAll();
      setAlert({ type: "success", message: "Allergy added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddCondition(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addCondition({
        variables: {
          data: {
            ...conditionForm,
            diagnosedAt: conditionForm.diagnosedAt || undefined,
          },
        },
      });
      setConditionForm({
        description: "",
        codeSystem: "ICD-10",
        code: "",
        diagnosedAt: "",
      });
      await refreshAll();
      setAlert({ type: "success", message: "Condition added." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleAddMedication(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await addMedication({
        variables: {
          data: {
            ...medicationForm,
            startedAt: medicationForm.startedAt || undefined,
          },
        },
      });
      setMedicationForm({ drugName: "", dose: "", frequency: "", route: "", startedAt: "" });
      await refreshAll();
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

  function startEditContact(contact: ContactRecord) {
    setEditingContactId(contact.id);
    setEditContactForm({
      name: contact.name ?? "",
      relationship: contact.relationship ?? "",
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      isPrimary: contact.isPrimary,
    });
  }

  async function handleUpdateContact(event: FormEvent) {
    event.preventDefault();
    if (!editingContactId) {
      return;
    }
    setAlert(null);
    try {
      await updatePatientContact({
        variables: {
          contactId: editingContactId,
          data: {
            ...editContactForm,
            email: editContactForm.email || undefined,
          },
        },
      });
      setEditingContactId(null);
      await refreshAll();
      setAlert({ type: "success", message: "Contact updated." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  async function handleMakePrimaryContact(contactId: string) {
    setAlert(null);
    try {
      await updatePatientContact({
        variables: { contactId, data: { isPrimary: true } },
      });
      await refreshAll();
      setAlert({ type: "success", message: "Primary contact updated." });
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
      await refreshAll();
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
      await refreshAll();
      setAlert({ type: "success", message: "Consent recorded." });
    } catch (error) {
      setAlert({ type: "error", message: mapProfileError(error) });
    }
  }

  if (!canQueryProtectedProfile) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <Card>
          <CardContent className="flex items-center gap-3 pt-6 text-sm text-muted">
            {status === "loading" ? (
              <>
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
                Loading your session…
              </>
            ) : (
              "Waiting for an authenticated session before loading profile data."
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const diabetesLabel = profile?.diabetesType
    ? DIABETES_TYPE_OPTIONS.find(
        (option) => option.value === profile.diabetesType?.toLowerCase(),
      )?.label ?? toTitle(profile.diabetesType)
    : null;

  return (
    <div className="space-y-6">
      {alert ? (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
            alert.type === "error"
              ? "border-danger/30 bg-danger/5 text-danger"
              : "border-success/30 bg-success/5 text-success",
          )}
          role="status"
        >
          {alert.type === "error" ? (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{alert.message}</span>
          <button
            type="button"
            onClick={() => setAlert(null)}
            className="shrink-0 rounded-md p-0.5 opacity-70 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <PageHeader
        name={profile?.fullName}
        email={profile?.email ?? user?.email ?? null}
        badges={
          <>
            {diabetesLabel ? <Badge variant="primary">{diabetesLabel}</Badge> : null}
            {profile?.onboardingStatus ? (
              <Badge variant="secondary">{toTitle(profile.onboardingStatus.toLowerCase())}</Badge>
            ) : null}
            {completion ? (
              <Badge variant={completion.consultationReady ? "success" : "warning"}>
                {completion.consultationReady ? "Consultation ready" : "Consultation pending"}
              </Badge>
            ) : null}
          </>
        }
      />

      {profileError && !profileMissing ? (
        <Card>
          <CardContent className="flex items-center gap-2 pt-6 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Failed to load profile: {mapProfileError(profileError)}
          </CardContent>
        </Card>
      ) : null}

      {profileMissing ? (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-text">No clinical profile yet</p>
              <p className="text-sm text-muted">
                Create your profile to start recording clinical information.
              </p>
            </div>
            <Button type="button" onClick={handleCreateProfile} disabled={isCreatingProfile}>
              {isCreatingProfile ? "Creating…" : "Create profile"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {PROFILE_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === id
                ? "bg-primary text-white"
                : "text-muted hover:bg-background hover:text-text",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === "overview" ? (
      <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle>Profile completion</CardTitle>
            {completion ? (
              <Badge variant={completion.isComplete ? "success" : "warning"}>
                {completion.isComplete ? "Complete" : "In progress"}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Overall progress</span>
              <span className="text-2xl font-semibold text-text">
                {completion?.percentComplete ?? 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${completion?.percentComplete ?? 0}%` }}
              />
            </div>
          </div>

          <ul className="grid gap-2 sm:grid-cols-2">
            {COMPLETION_REQUIREMENTS.map((item) => {
              const done = !missingSet.has(normalizeKey(item.key));
              return (
                <li key={item.key} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted" />
                  )}
                  <span className={done ? "text-text" : "text-muted"}>{item.label}</span>
                </li>
              );
            })}
            {extraMissing.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <Circle className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-muted">{toTitle(item)}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2 border-t border-border pt-4">
            <Badge variant={completion?.pcqComplete ? "success" : "secondary"}>
              {completion?.pcqComplete ? "Baseline PCQ submitted" : "Baseline PCQ pending"}
            </Badge>
            <Badge variant={completion?.consultationReady ? "success" : "secondary"}>
              {completion?.consultationReady ? "Ready for consultation" : "Not yet consultation-ready"}
            </Badge>
            {completion && !completion.pcqComplete ? (
              <Button href="/patient/pcq/baseline" size="sm" className="ml-auto gap-1.5">
                <ClipboardList className="size-4" />
                Complete questionnaire
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Allergies", value: allergies.length, onClick: () => setTab("clinical") },
          { label: "Conditions", value: conditions.length, onClick: () => setTab("clinical") },
          { label: "Medications", value: medications.length, onClick: () => setTab("clinical") },
          { label: "Contacts", value: contacts.length, onClick: () => setTab("contacts") },
        ].map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={stat.onClick}
            className="rounded-xl border border-border bg-surface p-4 text-left transition hover:border-primary/40"
          >
            <p className="text-2xl font-semibold text-text">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </button>
        ))}
      </div>

      {profile &&
      (profile.baselineWeight ||
        profile.baselineBpSystolic ||
        profile.baselineBpDiastolic ||
        profile.notes) ? (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Baseline &amp; clinical notes</CardTitle>
              <Badge variant="secondary">Read-only</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted">Baseline weight</p>
                <p className="text-sm text-text">
                  {profile.baselineWeight ? `${profile.baselineWeight} kg` : "—"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted">Baseline blood pressure</p>
                <p className="text-sm text-text">
                  {profile.baselineBpSystolic && profile.baselineBpDiastolic
                    ? `${profile.baselineBpSystolic}/${profile.baselineBpDiastolic} mmHg`
                    : "—"}
                </p>
              </div>
            </div>
            {profile.notes ? (
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted">Clinical notes</p>
                <p className="whitespace-pre-line text-sm text-text">{profile.notes}</p>
              </div>
            ) : null}
            <p className="text-xs text-muted">
              These values are maintained by your care team and clinical sync, and cannot be edited
              here.
            </p>
          </CardContent>
        </Card>
      ) : null}
      </div>
      ) : null}

      {/* Profile tab */}
      {tab === "profile" ? (
      <SectionCard
        icon={UserRound}
        title="Profile details"
        description="Core demographic and diabetes information used across your care."
      >
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleUpdateProfile}>
          <Field label="Full name" htmlFor="fullName">
            <Input
              id="fullName"
              value={profileForm.fullName}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))
              }
            />
          </Field>
          <Field label="Phone" htmlFor="phone">
            <Input
              id="phone"
              type="tel"
              placeholder="+260971000000"
              value={profileForm.phone}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, phone: event.target.value }))
              }
            />
          </Field>
          <Field label="Date of birth" htmlFor="dateOfBirth">
            <Input
              id="dateOfBirth"
              type="date"
              value={profileForm.dateOfBirth}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))
              }
            />
          </Field>
          <Field label="Diabetes type" htmlFor="diabetesType">
            <select
              id="diabetesType"
              className={SELECT_CLASS}
              value={profileForm.diabetesType}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, diabetesType: event.target.value }))
              }
            >
              {DIABETES_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Diagnosis date" htmlFor="diagnosisDate">
            <Input
              id="diagnosisDate"
              type="date"
              value={profileForm.diagnosisDate}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, diagnosisDate: event.target.value }))
              }
            />
          </Field>
          <p className="text-xs text-muted md:col-span-2">
            Free-text summaries for quick reference. For structured records, use the Clinical tab.
          </p>
          <Field label="Allergies (summary)" htmlFor="allergiesSummary">
            <Input
              id="allergiesSummary"
              placeholder="e.g. Penicillin"
              value={profileForm.allergies}
              onChange={(event) =>
                setProfileForm((prev) => ({ ...prev, allergies: event.target.value }))
              }
            />
          </Field>
          <div className="md:col-span-2">
            <Field label="Current medications (summary)" htmlFor="medicationsSummary">
              <Textarea
                id="medicationsSummary"
                placeholder="e.g. Metformin 500mg twice daily"
                value={profileForm.currentMedications}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, currentMedications: event.target.value }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Additional notes" htmlFor="additionalNotes">
              <Textarea
                id="additionalNotes"
                placeholder="Anything else your care team should know"
                value={profileForm.additionalNotes}
                onChange={(event) =>
                  setProfileForm((prev) => ({ ...prev, additionalNotes: event.target.value }))
                }
              />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={isLoadingProfile || isUpdatingProfile || profileMissing}
            >
              {isUpdatingProfile ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </form>
      </SectionCard>
      ) : null}

      {/* Clinical tab */}
      {tab === "clinical" ? (
      <div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            icon={HeartPulse}
            title="Allergies"
            description="New entries are recorded as active."
          >
            <RecordList count={allergies.length} empty="No allergies recorded yet.">
              {allergies.map((item) => (
                <RecordItem
                  key={item.id}
                  title={item.substance ?? "Unknown substance"}
                  subtitle={item.reaction ?? undefined}
                  badge={
                    <div className="flex flex-wrap justify-end gap-1">
                      {item.severity ? (
                        <Badge variant={severityVariant(item.severity)}>
                          {toTitle(item.severity.toLowerCase())}
                        </Badge>
                      ) : null}
                      {item.status ? (
                        <Badge variant={statusVariant(item.status)}>
                          {toTitle(item.status.toLowerCase())}
                        </Badge>
                      ) : null}
                    </div>
                  }
                />
              ))}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleAddAllergy}>
              <Input
                placeholder="Substance"
                value={allergyForm.substance}
                onChange={(event) =>
                  setAllergyForm((prev) => ({ ...prev, substance: event.target.value }))
                }
                required
              />
              <Input
                placeholder="Reaction"
                value={allergyForm.reaction}
                onChange={(event) =>
                  setAllergyForm((prev) => ({ ...prev, reaction: event.target.value }))
                }
              />
              <select
                className={SELECT_CLASS}
                value={allergyForm.severity}
                onChange={(event) =>
                  setAllergyForm((prev) => ({ ...prev, severity: event.target.value }))
                }
              >
                {ALLERGY_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={isAddingAllergy} fullWidth>
                {isAddingAllergy ? "Adding…" : "Add allergy"}
              </Button>
            </form>
          </SectionCard>

          <SectionCard
            icon={ClipboardList}
            title="Conditions"
            description="New entries are created as active."
          >
            <RecordList count={conditions.length} empty="No conditions recorded yet.">
              {conditions.map((item) => (
                <RecordItem
                  key={item.id}
                  title={item.description ?? "Condition"}
                  subtitle={joinMeta([
                    item.code ? `${item.codeSystem ?? "Code"}: ${item.code}` : null,
                    item.diagnosedAt ? `Diagnosed ${item.diagnosedAt}` : null,
                  ])}
                  badge={
                    item.status ? (
                      <Badge variant={statusVariant(item.status)}>
                        {toTitle(item.status.toLowerCase())}
                      </Badge>
                    ) : null
                  }
                />
              ))}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleAddCondition}>
              <Input
                placeholder="Description"
                value={conditionForm.description}
                onChange={(event) =>
                  setConditionForm((prev) => ({ ...prev, description: event.target.value }))
                }
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Code system"
                  value={conditionForm.codeSystem}
                  onChange={(event) =>
                    setConditionForm((prev) => ({ ...prev, codeSystem: event.target.value }))
                  }
                />
                <Input
                  placeholder="Code"
                  value={conditionForm.code}
                  onChange={(event) =>
                    setConditionForm((prev) => ({ ...prev, code: event.target.value }))
                  }
                />
              </div>
              <Field label="Diagnosed at" htmlFor="diagnosedAt">
                <Input
                  id="diagnosedAt"
                  type="date"
                  value={conditionForm.diagnosedAt}
                  onChange={(event) =>
                    setConditionForm((prev) => ({ ...prev, diagnosedAt: event.target.value }))
                  }
                />
              </Field>
              <Button type="submit" disabled={isAddingCondition} fullWidth>
                {isAddingCondition ? "Adding…" : "Add condition"}
              </Button>
            </form>
          </SectionCard>

          <SectionCard
            icon={Pill}
            title="Medications"
            description="New entries are created as active."
          >
            <RecordList count={medications.length} empty="No medications recorded yet.">
              {medications.map((item) => (
                <RecordItem
                  key={item.id}
                  title={item.drugName ?? "Medication"}
                  subtitle={joinMeta([item.dose, item.frequency, item.route])}
                  badge={
                    item.status ? (
                      <Badge variant={statusVariant(item.status)}>
                        {toTitle(item.status.toLowerCase())}
                      </Badge>
                    ) : null
                  }
                />
              ))}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleAddMedication}>
              <Input
                placeholder="Drug name"
                value={medicationForm.drugName}
                onChange={(event) =>
                  setMedicationForm((prev) => ({ ...prev, drugName: event.target.value }))
                }
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Dose"
                  value={medicationForm.dose}
                  onChange={(event) =>
                    setMedicationForm((prev) => ({ ...prev, dose: event.target.value }))
                  }
                />
                <Input
                  placeholder="Route"
                  value={medicationForm.route}
                  onChange={(event) =>
                    setMedicationForm((prev) => ({ ...prev, route: event.target.value }))
                  }
                />
              </div>
              <Input
                placeholder="Frequency"
                value={medicationForm.frequency}
                onChange={(event) =>
                  setMedicationForm((prev) => ({ ...prev, frequency: event.target.value }))
                }
              />
              <Field label="Started at" htmlFor="startedAt">
                <Input
                  id="startedAt"
                  type="date"
                  value={medicationForm.startedAt}
                  onChange={(event) =>
                    setMedicationForm((prev) => ({ ...prev, startedAt: event.target.value }))
                  }
                />
              </Field>
              <Button type="submit" disabled={isAddingMedication} fullWidth>
                {isAddingMedication ? "Adding…" : "Add medication"}
              </Button>
            </form>
          </SectionCard>
        </div>
      </div>
      ) : null}

      {/* Contacts tab */}
      {tab === "contacts" ? (
      <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            icon={Phone}
            title="Emergency contacts"
            description="At least one contact is required for a complete profile."
          >
            <RecordList count={contacts.length} empty="No emergency contacts yet.">
              {contacts.map((item) =>
                editingContactId === item.id ? (
                  <li
                    key={item.id}
                    className="rounded-xl border border-primary/40 bg-background px-3 py-3"
                  >
                    <form className="space-y-3" onSubmit={handleUpdateContact}>
                      <Input
                        placeholder="Name"
                        value={editContactForm.name}
                        onChange={(event) =>
                          setEditContactForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        required
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          placeholder="Relationship"
                          value={editContactForm.relationship}
                          onChange={(event) =>
                            setEditContactForm((prev) => ({
                              ...prev,
                              relationship: event.target.value,
                            }))
                          }
                          required
                        />
                        <Input
                          placeholder="Phone"
                          value={editContactForm.phone}
                          onChange={(event) =>
                            setEditContactForm((prev) => ({ ...prev, phone: event.target.value }))
                          }
                          required
                        />
                      </div>
                      <Input
                        placeholder="Email (optional)"
                        type="email"
                        value={editContactForm.email}
                        onChange={(event) =>
                          setEditContactForm((prev) => ({ ...prev, email: event.target.value }))
                        }
                      />
                      <label className="flex items-center gap-2 text-sm text-text">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                          checked={editContactForm.isPrimary}
                          onChange={(event) =>
                            setEditContactForm((prev) => ({
                              ...prev,
                              isPrimary: event.target.checked,
                            }))
                          }
                        />
                        Primary contact
                      </label>
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={isUpdatingContact}>
                          {isUpdatingContact ? "Saving…" : "Save"}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingContactId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </li>
                ) : (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background px-3 py-2.5"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-sm font-medium text-text">
                        {item.name ?? "Contact"}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {joinMeta([item.relationship, item.phone, item.email])}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {item.isPrimary ? (
                        <Badge variant="primary">Primary</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMakePrimaryContact(item.id)}
                          disabled={isUpdatingContact}
                        >
                          Make primary
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => startEditContact(item)}
                      >
                        Edit
                      </Button>
                    </div>
                  </li>
                ),
              )}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleAddContact}>
              <Input
                placeholder="Name"
                value={contactForm.name}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, name: event.target.value }))
                }
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="Relationship"
                  value={contactForm.relationship}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, relationship: event.target.value }))
                  }
                  required
                />
                <Input
                  placeholder="Phone"
                  value={contactForm.phone}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                  }
                  required
                />
              </div>
              <Input
                placeholder="Email (optional)"
                type="email"
                value={contactForm.email}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                  checked={contactForm.isPrimary}
                  onChange={(event) =>
                    setContactForm((prev) => ({ ...prev, isPrimary: event.target.checked }))
                  }
                />
                Primary contact
              </label>
              <Button type="submit" disabled={isAddingContact} fullWidth>
                {isAddingContact ? "Adding…" : "Add contact"}
              </Button>
            </form>
          </SectionCard>
      </div>
      ) : null}

      {/* Documents tab */}
      {tab === "documents" ? (
      <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            icon={FileText}
            title="Documents"
            description="PDFs, images, or other clinical documents."
          >
            <RecordList count={documents.length} empty="No documents uploaded yet.">
              {documents.map((item) => (
                <RecordItem
                  key={item.id}
                  title={
                    item.fileUrl ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {item.originalName ?? "Document"}
                      </a>
                    ) : (
                      item.originalName ?? "Document"
                    )
                  }
                  subtitle={joinMeta([
                    item.docType ? toTitle(item.docType) : null,
                    item.recordedDate ?? null,
                  ])}
                />
              ))}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleUploadDocument}>
              <Field label="Document type" htmlFor="docType">
                <select
                  id="docType"
                  className={SELECT_CLASS}
                  value={documentForm.docType}
                  onChange={(event) =>
                    setDocumentForm((prev) => ({ ...prev, docType: event.target.value }))
                  }
                >
                  {DOCUMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Recorded date" htmlFor="recordedDate">
                <Input
                  id="recordedDate"
                  type="date"
                  value={documentForm.recordedDate}
                  onChange={(event) =>
                    setDocumentForm((prev) => ({ ...prev, recordedDate: event.target.value }))
                  }
                />
              </Field>
              <FileDropZone
                key={documentFileKey}
                value={documentForm.file}
                onChange={(file) => setDocumentForm((prev) => ({ ...prev, file }))}
                hint="PDF, images, or other clinical documents"
                loading={isUploadingDocument}
              />
              <Button type="submit" disabled={isUploadingDocument} fullWidth>
                {isUploadingDocument ? "Uploading…" : "Upload document"}
              </Button>
            </form>
          </SectionCard>

          <SectionCard
            icon={ShieldCheck}
            title="Consents"
            description="Record consent for a policy version."
          >
            <RecordList count={consents.length} empty="No consents recorded yet.">
              {consents.map((item) => (
                <RecordItem
                  key={item.id}
                  title={item.policyType ? toTitle(item.policyType) : "Consent"}
                  subtitle={joinMeta([
                    item.version,
                    item.acceptedAt ? `Accepted ${item.acceptedAt.slice(0, 10)}` : null,
                  ])}
                  badge={<Badge variant="success">Accepted</Badge>}
                />
              ))}
            </RecordList>
            <form className="mt-4 space-y-3 border-t border-border pt-4" onSubmit={handleAcceptConsent}>
              <Field label="Policy" htmlFor="policyType">
                <select
                  id="policyType"
                  className={SELECT_CLASS}
                  value={consentForm.policyType}
                  onChange={(event) =>
                    setConsentForm((prev) => ({ ...prev, policyType: event.target.value }))
                  }
                >
                  {CONSENT_POLICY_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Version" htmlFor="version">
                <Input
                  id="version"
                  placeholder="e.g. v1"
                  value={consentForm.version}
                  onChange={(event) =>
                    setConsentForm((prev) => ({ ...prev, version: event.target.value }))
                  }
                />
              </Field>
              <Button type="submit" disabled={isAcceptingConsent} fullWidth>
                {isAcceptingConsent ? "Saving…" : "Accept consent"}
              </Button>
            </form>
          </SectionCard>
      </div>
      ) : null}
    </div>
  );
}

function PageHeader({
  name,
  email,
  badges,
}: {
  name?: string | null;
  email?: string | null;
  badges?: ReactNode;
}) {
  const displayName = name?.trim() || "Your profile";
  return (
    <header className="rounded-lg border border-border bg-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Stethoscope className="h-7 w-7" />
          </span>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
              Clinical profile
            </p>
            <h1 className="text-2xl font-semibold text-text sm:text-3xl">{displayName}</h1>
            {email ? (
              <p className="flex items-center gap-1.5 text-sm text-muted">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </p>
            ) : null}
          </div>
        </div>
        {badges ? <div className="flex flex-wrap gap-2">{badges}</div> : null}
      </div>
    </header>
  );
}
