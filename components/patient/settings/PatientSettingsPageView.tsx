"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { User, ShieldCheck, Bell, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PATIENT_SETTINGS_PROFILE_QUERY,
  PATIENT_UPDATE_PROFILE_MUTATION,
  PATIENT_PRIVACY_PREFERENCES_QUERY,
  PATIENT_UPDATE_PRIVACY_PREFERENCES_MUTATION,
  PATIENT_NOTIFICATION_PREFERENCES_QUERY,
  PATIENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  PATIENT_CONSENTS_QUERY,
} from "@/lib/patient/settings-graphql";

type Tab = "profile" | "privacy" | "notifications" | "consents";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "privacy", label: "Privacy", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "consents", label: "Consents", icon: FileCheck },
];

const DIABETES_TYPES = [
  { value: "", label: "Select type…" },
  { value: "TYPE_1", label: "Type 1" },
  { value: "TYPE_2", label: "Type 2" },
  { value: "PREDIABETES", label: "Pre-diabetes" },
  { value: "GESTATIONAL", label: "Gestational" },
  { value: "OTHER", label: "Other" },
];

function InlineAlert({
  tone,
  message,
}: Readonly<{ tone: "success" | "error"; message: string | null }>) {
  if (!message) return null;
  return (
    <p className={`text-sm ${tone === "success" ? "text-success" : "text-danger"}`}>
      {message}
    </p>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: Readonly<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-text">{label}</p>
        <p className="text-sm text-muted">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
          checked ? "bg-primary" : "bg-slate-300"
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow-soft transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Profile Tab ─────────────────────────────────────────────────────────────

type ProfileForm = {
  fullName: string;
  phone: string;
  dateOfBirth: string;
  diabetesType: string;
  diagnosisDate: string;
  allergies: string;
  currentMedications: string;
  additionalNotes: string;
};

function ProfileTab() {
  const { data, loading } = useQuery(PATIENT_SETTINGS_PROFILE_QUERY, {
    fetchPolicy: "network-only",
  });

  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    diabetesType: "",
    diagnosisDate: "",
    allergies: "",
    currentMedications: "",
    additionalNotes: "",
  });

  const [initialized, setInitialized] = useState(false);
  const profile = data?.myPatientProfile;

  if (profile && !initialized) {
    setInitialized(true);
    setForm({
      fullName: profile.fullName ?? "",
      phone: profile.phone ?? "",
      dateOfBirth: profile.dateOfBirth ?? "",
      diabetesType: profile.diabetesType ?? "",
      diagnosisDate: profile.diagnosisDate ?? "",
      allergies: profile.allergies ?? "",
      currentMedications: profile.currentMedications ?? "",
      additionalNotes: profile.additionalNotes ?? "",
    });
  }

  const [updateProfile, { loading: saving }] = useMutation(PATIENT_UPDATE_PROFILE_MUTATION);
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      await updateProfile({
        variables: {
          data: {
            fullName: form.fullName || null,
            phone: form.phone || null,
            dateOfBirth: form.dateOfBirth || null,
            diabetesType: form.diabetesType || null,
            diagnosisDate: form.diagnosisDate || null,
            allergies: form.allergies || null,
            currentMedications: form.currentMedications || null,
            additionalNotes: form.additionalNotes || null,
          },
        },
      });
      setStatus({ tone: "success", msg: "Profile updated successfully." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to update profile. Please try again." });
    }
  }

  function field(key: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {profile?.email ? (
        <div className="space-y-2">
          <Label>Email address</Label>
          <Input value={profile.email} readOnly className="cursor-default opacity-60" />
          <p className="text-xs text-muted">Email cannot be changed here. Contact support to update it.</p>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="p-name">Full name</Label>
          <Input id="p-name" value={form.fullName} onChange={field("fullName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-phone">Phone</Label>
          <Input id="p-phone" type="tel" value={form.phone} onChange={field("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-dob">Date of birth</Label>
          <Input id="p-dob" type="date" value={form.dateOfBirth} onChange={field("dateOfBirth")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-dtype">Diabetes type</Label>
          <select
            id="p-dtype"
            value={form.diabetesType}
            onChange={field("diabetesType")}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {DIABETES_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-dxdate">Diagnosis date</Label>
          <Input
            id="p-dxdate"
            type="date"
            value={form.diagnosisDate}
            onChange={field("diagnosisDate")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="p-allergies">Allergies</Label>
        <Input
          id="p-allergies"
          value={form.allergies}
          onChange={field("allergies")}
          placeholder="e.g. Penicillin, Sulfa drugs"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-meds">Current medications</Label>
        <Input
          id="p-meds"
          value={form.currentMedications}
          onChange={field("currentMedications")}
          placeholder="e.g. Metformin 500mg, Insulin"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-notes">Additional notes</Label>
        <textarea
          id="p-notes"
          value={form.additionalNotes}
          onChange={field("additionalNotes")}
          rows={3}
          placeholder="Any other clinical notes for your care team…"
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save Profile"}
      </Button>
    </form>
  );
}

// ─── Privacy Tab ─────────────────────────────────────────────────────────────

type PrivacyForm = {
  allowConsultantRecordAccess: boolean;
  allowDeviceDataSharing: boolean;
  allowLabResultSharing: boolean;
  allowPharmacySharing: boolean;
  allowMarketing: boolean;
  researchDataSharing: boolean;
};

function PrivacyTab() {
  const { data, loading } = useQuery(PATIENT_PRIVACY_PREFERENCES_QUERY, {
    fetchPolicy: "network-only",
  });

  const [form, setForm] = useState<PrivacyForm>({
    allowConsultantRecordAccess: true,
    allowDeviceDataSharing: false,
    allowLabResultSharing: true,
    allowPharmacySharing: false,
    allowMarketing: false,
    researchDataSharing: false,
  });

  const [initialized, setInitialized] = useState(false);
  const prefs = data?.myPatientPrivacyPreferences;

  if (prefs && !initialized) {
    setInitialized(true);
    const overrides =
      typeof prefs.consentOverridesJson === "object" && prefs.consentOverridesJson !== null
        ? (prefs.consentOverridesJson as Record<string, unknown>)
        : {};
    setForm({
      allowConsultantRecordAccess: prefs.allowConsultantRecordAccess ?? true,
      allowDeviceDataSharing: prefs.allowDeviceDataSharing ?? false,
      allowLabResultSharing: prefs.allowLabResultSharing ?? true,
      allowPharmacySharing: prefs.allowPharmacySharing ?? false,
      allowMarketing: prefs.allowMarketing ?? false,
      researchDataSharing: (overrides.researchDataSharing as boolean) ?? false,
    });
  }

  const [updatePrivacy, { loading: saving }] = useMutation(
    PATIENT_UPDATE_PRIVACY_PREFERENCES_MUTATION,
  );
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  async function handleSave() {
    setStatus(null);
    try {
      await updatePrivacy({
        variables: {
          data: {
            allowConsultantRecordAccess: form.allowConsultantRecordAccess,
            allowDeviceDataSharing: form.allowDeviceDataSharing,
            allowLabResultSharing: form.allowLabResultSharing,
            allowPharmacySharing: form.allowPharmacySharing,
            allowMarketing: form.allowMarketing,
            consentOverridesJson: JSON.stringify({
              researchDataSharing: form.researchDataSharing,
            }),
          },
        },
      });
      setStatus({ tone: "success", msg: "Privacy preferences saved." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to save privacy preferences." });
    }
  }

  function toggle(key: keyof PrivacyForm) {
    return (v: boolean) => setForm((f) => ({ ...f, [key]: v }));
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Data Sharing</p>
        <div className="space-y-3">
          <ToggleRow
            label="Consultant record access"
            description="Allow your care providers to view your full medical record."
            checked={form.allowConsultantRecordAccess}
            onChange={toggle("allowConsultantRecordAccess")}
          />
          <ToggleRow
            label="Device data sharing"
            description="Share glucose monitor and wearable data with your care team."
            checked={form.allowDeviceDataSharing}
            onChange={toggle("allowDeviceDataSharing")}
          />
          <ToggleRow
            label="Lab result sharing"
            description="Allow lab results to be shared with connected providers."
            checked={form.allowLabResultSharing}
            onChange={toggle("allowLabResultSharing")}
          />
          <ToggleRow
            label="Pharmacy sharing"
            description="Share prescription information with linked pharmacies."
            checked={form.allowPharmacySharing}
            onChange={toggle("allowPharmacySharing")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Communication</p>
        <div className="space-y-3">
          <ToggleRow
            label="Marketing communications"
            description="Receive platform news, health tips, and promotional content."
            checked={form.allowMarketing}
            onChange={toggle("allowMarketing")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Research</p>
        <div className="space-y-3">
          <ToggleRow
            label="Research data sharing"
            description="Allow anonymised data to be used in diabetes research programmes."
            checked={form.researchDataSharing}
            onChange={toggle("researchDataSharing")}
          />
        </div>
      </div>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Privacy Settings"}
      </Button>
    </div>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

type NotifForm = {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  messageAlertsEnabled: boolean;
  labResultAlertsEnabled: boolean;
  prescriptionRemindersEnabled: boolean;
  marketingEnabled: boolean;
  glucoseCheckTimes: string;
  medicationTimes: string;
};

function NotificationsTab() {
  const { data, loading } = useQuery(PATIENT_NOTIFICATION_PREFERENCES_QUERY, {
    fetchPolicy: "network-only",
  });

  const [form, setForm] = useState<NotifForm>({
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: false,
    appointmentRemindersEnabled: true,
    messageAlertsEnabled: true,
    labResultAlertsEnabled: true,
    prescriptionRemindersEnabled: true,
    marketingEnabled: false,
    glucoseCheckTimes: "07:00, 19:00",
    medicationTimes: "08:00, 20:00",
  });

  const [initialized, setInitialized] = useState(false);
  const raw = data?.myNotificationPreferences;

  if (raw && !initialized) {
    setInitialized(true);
    const reminder =
      typeof raw.reminderSettingsJson === "object" && raw.reminderSettingsJson !== null
        ? (raw.reminderSettingsJson as Record<string, unknown>)
        : {};
    const glucoseArr = Array.isArray(reminder.glucoseCheck) ? reminder.glucoseCheck : [];
    const medArr = Array.isArray(reminder.medication) ? reminder.medication : [];
    setForm({
      emailEnabled: raw.emailEnabled ?? true,
      smsEnabled: raw.smsEnabled ?? false,
      pushEnabled: raw.pushEnabled ?? false,
      appointmentRemindersEnabled: raw.appointmentRemindersEnabled ?? true,
      messageAlertsEnabled: raw.messageAlertsEnabled ?? true,
      labResultAlertsEnabled: raw.labResultAlertsEnabled ?? true,
      prescriptionRemindersEnabled: raw.prescriptionRemindersEnabled ?? true,
      marketingEnabled: raw.marketingEnabled ?? false,
      glucoseCheckTimes: glucoseArr.join(", ") || "07:00, 19:00",
      medicationTimes: medArr.join(", ") || "08:00, 20:00",
    });
  }

  const [updateNotif, { loading: saving }] = useMutation(
    PATIENT_UPDATE_NOTIFICATION_PREFERENCES_MUTATION,
  );
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);

  function parseTimes(csv: string): string[] {
    return csv
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  async function handleSave() {
    setStatus(null);
    try {
      await updateNotif({
        variables: {
          data: {
            emailEnabled: form.emailEnabled,
            smsEnabled: form.smsEnabled,
            pushEnabled: form.pushEnabled,
            appointmentRemindersEnabled: form.appointmentRemindersEnabled,
            messageAlertsEnabled: form.messageAlertsEnabled,
            labResultAlertsEnabled: form.labResultAlertsEnabled,
            prescriptionRemindersEnabled: form.prescriptionRemindersEnabled,
            marketingEnabled: form.marketingEnabled,
            reminderSettingsJson: JSON.stringify({
              glucoseCheck: parseTimes(form.glucoseCheckTimes),
              medication: parseTimes(form.medicationTimes),
            }),
          },
        },
      });
      setStatus({ tone: "success", msg: "Notification preferences saved." });
    } catch {
      setStatus({ tone: "error", msg: "Failed to save notification preferences." });
    }
  }

  function toggle(key: keyof NotifForm) {
    return (v: boolean) => setForm((f) => ({ ...f, [key]: v }));
  }

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-border/40" />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Channels</p>
        <div className="space-y-3">
          <ToggleRow
            label="Email"
            description="Receive alerts and reminders by email."
            checked={form.emailEnabled}
            onChange={toggle("emailEnabled")}
          />
          <ToggleRow
            label="SMS"
            description="Receive important alerts by text message."
            checked={form.smsEnabled}
            onChange={toggle("smsEnabled")}
          />
          <ToggleRow
            label="Push notifications"
            description="Receive alerts on your mobile device."
            checked={form.pushEnabled}
            onChange={toggle("pushEnabled")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Events</p>
        <div className="space-y-3">
          <ToggleRow
            label="Appointment reminders"
            description="Reminders before your upcoming appointments."
            checked={form.appointmentRemindersEnabled}
            onChange={toggle("appointmentRemindersEnabled")}
          />
          <ToggleRow
            label="Message alerts"
            description="Notify when you receive a message from your care team."
            checked={form.messageAlertsEnabled}
            onChange={toggle("messageAlertsEnabled")}
          />
          <ToggleRow
            label="Lab result alerts"
            description="Notify when new lab results are available."
            checked={form.labResultAlertsEnabled}
            onChange={toggle("labResultAlertsEnabled")}
          />
          <ToggleRow
            label="Prescription reminders"
            description="Remind when prescriptions are ready or due for renewal."
            checked={form.prescriptionRemindersEnabled}
            onChange={toggle("prescriptionRemindersEnabled")}
          />
          <ToggleRow
            label="Marketing"
            description="Health tips, platform news, and promotional content."
            checked={form.marketingEnabled}
            onChange={toggle("marketingEnabled")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted">Reminder Schedule</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="n-glucose">Glucose check times</Label>
            <Input
              id="n-glucose"
              value={form.glucoseCheckTimes}
              onChange={(e) => setForm((f) => ({ ...f, glucoseCheckTimes: e.target.value }))}
              placeholder="07:00, 13:00, 19:00"
            />
            <p className="text-xs text-muted">Comma-separated times (24-hour format)</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="n-meds">Medication times</Label>
            <Input
              id="n-meds"
              value={form.medicationTimes}
              onChange={(e) => setForm((f) => ({ ...f, medicationTimes: e.target.value }))}
              placeholder="08:00, 20:00"
            />
            <p className="text-xs text-muted">Comma-separated times (24-hour format)</p>
          </div>
        </div>
      </div>

      <InlineAlert tone={status?.tone ?? "success"} message={status?.msg ?? null} />
      <Button type="button" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Preferences"}
      </Button>
    </div>
  );
}

// ─── Consents Tab ─────────────────────────────────────────────────────────────

type ConsentItem = {
  id: string;
  policyType: string;
  version: string;
  acceptedAt: string;
};

const POLICY_LABELS: Record<string, string> = {
  TERMS_OF_SERVICE: "Terms of Service",
  PRIVACY_POLICY: "Privacy Policy",
  DATA_PROCESSING: "Data Processing Agreement",
  RESEARCH_CONSENT: "Research Consent",
  CLINICAL_CONSENT: "Clinical Data Consent",
};

function ConsentsTab() {
  const { data, loading } = useQuery<{ myPatientConsents: ConsentItem[] }>(
    PATIENT_CONSENTS_QUERY,
    { fetchPolicy: "network-only" },
  );

  const consents = data?.myPatientConsents ?? [];

  function formatDate(value: string) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
  }

  if (loading) {
    return <div className="h-48 animate-pulse rounded-xl bg-border/40" />;
  }

  if (consents.length === 0) {
    return (
      <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted">
        No consents have been recorded for your account.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {consents.map((c) => (
        <div key={c.id} className="flex items-center justify-between gap-4 px-4 py-4">
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-text">
              {POLICY_LABELS[c.policyType] ?? c.policyType}
            </p>
            <p className="text-xs text-muted">Version {c.version}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              Accepted
            </span>
            <p className="mt-1 text-xs text-muted">{formatDate(c.acceptedAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function PatientSettingsPageView() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">Account</p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Settings</h1>
      </header>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-surface p-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? "bg-primary text-white shadow-soft"
                : "text-muted hover:bg-background hover:text-text"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>{TABS.find((t) => t.id === tab)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {tab === "profile" && <ProfileTab />}
          {tab === "privacy" && <PrivacyTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "consents" && <ConsentsTab />}
        </CardContent>
      </Card>
    </div>
  );
}
