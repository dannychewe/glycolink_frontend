"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Camera, ShieldCheck, Clock, Upload, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { getGraphQLErrorCode } from "@/features/auth/auth-context";
import {
  CREATE_PROVIDER_PROFILE_MUTATION,
  MY_PROVIDER_PROFILE_QUERY,
  PROVIDER_LICENSE_TYPE_OPTIONS,
  PROVIDER_STATUS_SUMMARY_QUERY,
  SUBMIT_PROVIDER_PROFILE_MUTATION,
  UPDATE_PROVIDER_PROFILE_MUTATION,
  UPLOAD_PROVIDER_PROFILE_PICTURE_MUTATION,
  UPLOAD_PROVIDER_LICENSE_MUTATION,
} from "@/lib/consultant/provider-lifecycle-graphql";
import { MY_CONSULTANT_ORGANIZATIONS_QUERY } from "@/lib/consultant/organization-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────

type ProviderProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
  profilePictureUrl: string | null;
  status: string | null;
  verificationStatus: string | null;
  hpczNumber: string | null;
  bio: string | null;
  languages: string[] | null;
  languagesJson: string[] | null;
  specialties: string[] | null;
  subSpecialties: string[] | null;
  consultationFeeInitial: string | null;
  consultationFeeFollowup: string | null;
  certificateExpiryDate: string | null;
  telemedApprovalExpiryDate: string | null;
  organization: { id: string; name: string; type: string } | null;
};

type ProviderProfileData = { myProviderProfile: ProviderProfile | null };

type ExpiryWarning = {
  type: string;
  label: string;
  status: string;
  expiryDate: string | null;
  daysRemaining: number | null;
  currentStatus: string | null;
};

type StatusSummaryData = {
  providerStatusSummary: {
    status: string | null;
    isApproved: boolean;
    isSuspended: boolean;
    verificationStatus: string | null;
    verifiedAt: string | null;
    suspendedAt: string | null;
    suspensionReason: string | null;
    warningWindowDays: number;
    expiryWarnings: ExpiryWarning[];
  } | null;
};

type AlertState = { type: "success" | "error"; message: string } | null;

// ─── Helpers ─────────────────────────────────────────────

function mapProviderError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "PROFILE_INCOMPLETE") return "Profile is incomplete. Please fill in all required fields.";
  if (code === "PROVIDER_ACCESS_DENIED" || code === "TENANT_ACCESS_DENIED") return "Access denied for this action.";
  if (code === "PROVIDER_NOT_FOUND") return "Provider profile not found.";
  if (code === "INVALID_PROVIDER_STATE" || code === "INVALID_STATE_TRANSITION") return "This action is not allowed in the current profile state.";
  if (code === "PROFILE_ALREADY_EXISTS") return "A provider profile already exists for this account.";
  if (code === "PROFILE_INVALID_FOR_APPROVAL") return "Profile is not complete enough for submission.";
  if (code === "HPCZ_ALREADY_EXISTS") return "This HPCZ number is already registered on the platform.";
  return "Something went wrong. Please try again.";
}

function statusVariant(status: string | null) {
  if (!status) return "secondary" as const;
  const s = status.toUpperCase();
  if (s === "APPROVED") return "success" as const;
  if (s === "SUBMITTED") return "primary" as const;
  if (s === "REJECTED" || s === "SUSPENDED") return "danger" as const;
  return "warning" as const;
}

function verificationVariant(vs: string | null) {
  if (!vs) return "secondary" as const;
  if (vs.toUpperCase() === "VERIFIED") return "success" as const;
  if (vs.toUpperCase() === "REJECTED") return "danger" as const;
  return "warning" as const;
}

function warningVariant(wStatus: string) {
  if (wStatus === "EXPIRED") return "danger" as const;
  return "warning" as const;
}

function formatDate(value: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────

function AlertBanner({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1 text-sm">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="text-xs opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

function ProfileAvatar({
  src,
  name,
  onUpload,
  uploading,
}: {
  src: string | null;
  name: string | null;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initials = name ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  return (
    <div className="relative shrink-0">
      <div className="size-20 overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-soft sm:size-24">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={name ?? "Profile"} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-primary/10 text-xl font-bold text-primary sm:text-2xl">
            {initials}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-xl border border-border bg-surface shadow-soft transition hover:bg-background disabled:opacity-50"
        title="Change photo"
      >
        {uploading ? (
          <span className="size-3.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Camera className="size-3.5 text-muted" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Tabs ────────────────────────────────────────────────

type Tab = "profile" | "credentials";

// ─── Main component ───────────────────────────────────────

export function ProviderLifecycleManager() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [alert, setAlert] = useState<AlertState>(null);
  const [profileForm, setProfileForm] = useState({
    displayName: "",
    hpczNumber: "",
    bio: "",
    languagesCsv: "",
    consultationFeeInitial: "",
    consultationFeeFollowup: "",
    certificateExpiryDate: "",
    telemedApprovalExpiryDate: "",
    organizationId: "",
  });
  const [licenseForm, setLicenseForm] = useState({
    licenseType: "hpcz",
    expiryDate: "",
    issuedAt: "",
    file: null as File | null,
  });
  const [licenseFileKey, setLicenseFileKey] = useState(0);

  const { data: providerData, error: providerError, refetch: refetchProvider } =
    useQuery<ProviderProfileData>(MY_PROVIDER_PROFILE_QUERY, { fetchPolicy: "network-only" });

  const { data: statusData, refetch: refetchStatus } =
    useQuery<StatusSummaryData>(PROVIDER_STATUS_SUMMARY_QUERY, {
      variables: { warningWindowDays: 60 },
      fetchPolicy: "network-only",
    });

  const { data: orgsData } = useQuery<{
    myConsultantOrganizations: { id: string; name: string; type: string }[];
  }>(MY_CONSULTANT_ORGANIZATIONS_QUERY, { fetchPolicy: "cache-first" });

  const organizations = orgsData?.myConsultantOrganizations ?? [];

  const profile = providerData?.myProviderProfile ?? null;
  const status = statusData?.providerStatusSummary ?? null;
  const providerMissing = getGraphQLErrorCode(providerError) === "PROVIDER_NOT_FOUND";
  const avatarSrc = profile?.profilePictureUrl ?? profile?.avatarUrl ?? null;

  useEffect(() => {
    if (!profile) return;
    const langs = profile.languages ?? profile.languagesJson ?? [];
    setProfileForm({
      displayName: profile.displayName ?? "",
      hpczNumber: profile.hpczNumber ?? "",
      bio: profile.bio ?? "",
      languagesCsv: langs.join(", "),
      consultationFeeInitial: profile.consultationFeeInitial ?? "",
      consultationFeeFollowup: profile.consultationFeeFollowup ?? "",
      certificateExpiryDate: profile.certificateExpiryDate ?? "",
      telemedApprovalExpiryDate: profile.telemedApprovalExpiryDate ?? "",
      organizationId: profile.organization?.id ?? "",
    });
  }, [profile]);

  const [createProviderProfile, { loading: isCreating }] = useMutation(CREATE_PROVIDER_PROFILE_MUTATION);
  const [updateProviderProfile, { loading: isUpdating }] = useMutation(UPDATE_PROVIDER_PROFILE_MUTATION);
  const [submitProviderProfile, { loading: isSubmitting }] = useMutation(SUBMIT_PROVIDER_PROFILE_MUTATION);
  const [uploadProviderLicense, { loading: isUploadingLicense }] = useMutation(UPLOAD_PROVIDER_LICENSE_MUTATION);
  const [uploadProviderProfilePicture, { loading: isUploadingPicture }] = useMutation(UPLOAD_PROVIDER_PROFILE_PICTURE_MUTATION);

  async function refreshAll() {
    await Promise.all([refetchProvider(), refetchStatus({ warningWindowDays: 60 })]);
  }

  function buildProfileData() {
    return {
      displayName: profileForm.displayName,
      hpczNumber: profileForm.hpczNumber || undefined,
      bio: profileForm.bio || undefined,
      languagesJson: profileForm.languagesCsv
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean),
      consultationFeeInitial: profileForm.consultationFeeInitial || undefined,
      consultationFeeFollowup: profileForm.consultationFeeFollowup || undefined,
      certificateExpiryDate: profileForm.certificateExpiryDate || undefined,
      telemedApprovalExpiryDate: profileForm.telemedApprovalExpiryDate || undefined,
      organizationId: profileForm.organizationId || undefined,
    };
  }

  async function handleSaveProfile(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      if (providerMissing) {
        await createProviderProfile({ variables: { data: buildProfileData() } });
        setAlert({ type: "success", message: "Profile created successfully." });
      } else {
        await updateProviderProfile({ variables: { data: buildProfileData() } });
        setAlert({ type: "success", message: "Profile saved successfully." });
      }
      await refreshAll();
    } catch (error) {
      setAlert({ type: "error", message: mapProviderError(error) });
    }
  }

  async function handleSubmitForReview() {
    setAlert(null);
    try {
      await submitProviderProfile();
      await refreshAll();
      setAlert({ type: "success", message: "Profile submitted for review. You will be notified once approved." });
    } catch (error) {
      setAlert({ type: "error", message: mapProviderError(error) });
    }
  }

  async function handleAvatarUpload(file: File) {
    setAlert(null);
    try {
      await uploadProviderProfilePicture({ variables: { file } });
      await refreshAll();
      setAlert({ type: "success", message: "Profile picture updated." });
    } catch (error) {
      setAlert({ type: "error", message: mapProviderError(error) });
    }
  }

  async function handleUploadLicense(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    if (!licenseForm.file) {
      setAlert({ type: "error", message: "Please select a license file to upload." });
      return;
    }
    try {
      await uploadProviderLicense({
        variables: {
          file: licenseForm.file,
          licenseType: licenseForm.licenseType,
          expiryDate: licenseForm.expiryDate || undefined,
          issuedAt: licenseForm.issuedAt || undefined,
        },
      });
      setLicenseForm({ licenseType: "hpcz", expiryDate: "", issuedAt: "", file: null });
      setLicenseFileKey((k) => k + 1);
      await refreshAll();
      setAlert({ type: "success", message: "License uploaded successfully." });
    } catch (error) {
      setAlert({ type: "error", message: mapProviderError(error) });
    }
  }

  const canSubmit = profile && profile.status?.toUpperCase() === "DRAFT";
  const isSubmitted = profile?.status?.toUpperCase() === "SUBMITTED";
  const isApproved = status?.isApproved ?? false;
  const criticalWarnings = (status?.expiryWarnings ?? []).filter(
    (w) => w.status === "EXPIRING_SOON" || w.status === "EXPIRED",
  );

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">My Profile</h1>
        <p className="text-sm text-muted">
          Manage your provider identity, credentials, and availability settings.
        </p>
      </header>

      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      {/* Profile header card */}
      {!providerMissing ? (
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatar
                src={avatarSrc}
                name={profile?.displayName ?? null}
                onUpload={(file) => void handleAvatarUpload(file)}
                uploading={isUploadingPicture}
              />
              <div className="space-y-1.5">
                <p className="text-lg font-semibold text-text">
                  {profile?.displayName ?? "Unnamed Provider"}
                </p>
                {profile?.hpczNumber ? (
                  <p className="text-sm text-muted">HPCZ {profile.hpczNumber}</p>
                ) : null}
                {profile?.specialties && profile.specialties.length > 0 ? (
                  <p className="text-sm text-muted">{profile.specialties.join(" · ")}</p>
                ) : null}
                {profile?.subSpecialties && profile.subSpecialties.length > 0 ? (
                  <p className="text-xs text-muted">{profile.subSpecialties.join(", ")}</p>
                ) : null}
                {profile?.organization?.name ? (
                  <p className="text-xs text-muted">{profile.organization.name}</p>
                ) : null}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <Badge variant={statusVariant(profile?.status ?? null)}>
                    {profile?.status ?? "No status"}
                  </Badge>
                  <Badge variant={verificationVariant(profile?.verificationStatus ?? null)}>
                    {profile?.verificationStatus ?? "Unverified"}
                  </Badge>
                  {isApproved ? (
                    <span className="flex items-center gap-1 text-xs text-success">
                      <ShieldCheck className="size-3.5" />
                      Approved provider
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              {profile?.consultationFeeInitial ? (
                <div className="text-right">
                  <p className="text-xs text-muted">Initial consultation</p>
                  <p className="text-sm font-semibold text-text">
                    ZMW {Number(profile.consultationFeeInitial).toLocaleString()}
                  </p>
                </div>
              ) : null}
              {profile?.consultationFeeFollowup ? (
                <div className="text-right">
                  <p className="text-xs text-muted">Follow-up</p>
                  <p className="text-sm font-semibold text-text">
                    ZMW {Number(profile.consultationFeeFollowup).toLocaleString()}
                  </p>
                </div>
              ) : null}
              {canSubmit ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => void handleSubmitForReview()}
                >
                  {isSubmitting ? "Submitting..." : "Submit for Review"}
                </Button>
              ) : null}
              {isSubmitted ? (
                <span className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                  <Clock className="size-3.5" />
                  Under review
                </span>
              ) : null}
            </div>
          </div>

          {criticalWarnings.length > 0 ? (
            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Credential Alerts
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalWarnings.map((w) => (
                  <div
                    key={w.type}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                      w.status === "EXPIRED"
                        ? "bg-danger/10 text-danger"
                        : "bg-warning/10 text-warning",
                    )}
                  >
                    <Clock className="size-3 shrink-0" />
                    <span className="font-medium">{w.label}</span>
                    {w.daysRemaining != null ? (
                      <span className="opacity-75">
                        {w.status === "EXPIRED" ? "— expired" : `— ${w.daysRemaining}d left`}
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-8 text-center">
          <p className="text-base font-semibold text-text">No provider profile yet</p>
          <p className="mt-1 text-sm text-muted">
            Fill in your details below to create your provider profile and start accepting patients.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6">
          {([
            { key: "profile", label: "Profile Details" },
            { key: "credentials", label: "Credentials & Licenses" },
          ] as { key: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 text-sm font-medium transition",
                activeTab === tab.key
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-text",
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Details tab */}
      {activeTab === "profile" ? (
        <form className="space-y-6" onSubmit={(e) => void handleSaveProfile(e)}>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="displayName">
                Display name <span className="text-danger">*</span>
              </Label>
              <Input
                id="displayName"
                placeholder="Dr Jane Doe"
                value={profileForm.displayName}
                onChange={(e) => setProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hpczNumber">HPCZ number</Label>
              <Input
                id="hpczNumber"
                placeholder="HPCZ-12345"
                value={profileForm.hpczNumber}
                onChange={(e) => setProfileForm((p) => ({ ...p, hpczNumber: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultationFeeInitial">Initial consultation fee (ZMW)</Label>
              <Input
                id="consultationFeeInitial"
                type="number"
                min="0"
                step="0.01"
                placeholder="350.00"
                value={profileForm.consultationFeeInitial}
                onChange={(e) => setProfileForm((p) => ({ ...p, consultationFeeInitial: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="consultationFeeFollowup">Follow-up consultation fee (ZMW)</Label>
              <Input
                id="consultationFeeFollowup"
                type="number"
                min="0"
                step="0.01"
                placeholder="200.00"
                value={profileForm.consultationFeeFollowup}
                onChange={(e) => setProfileForm((p) => ({ ...p, consultationFeeFollowup: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificateExpiryDate">Practicing certificate expiry</Label>
              <Input
                id="certificateExpiryDate"
                type="date"
                value={profileForm.certificateExpiryDate}
                onChange={(e) => setProfileForm((p) => ({ ...p, certificateExpiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telemedApprovalExpiryDate">Telemedicine approval expiry</Label>
              <Input
                id="telemedApprovalExpiryDate"
                type="date"
                value={profileForm.telemedApprovalExpiryDate}
                onChange={(e) => setProfileForm((p) => ({ ...p, telemedApprovalExpiryDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationId">Organization</Label>
              <select
                id="organizationId"
                className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={profileForm.organizationId}
                onChange={(e) => setProfileForm((p) => ({ ...p, organizationId: e.target.value }))}
              >
                <option value="">— No organization —</option>
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name} ({org.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="languagesCsv">Languages spoken</Label>
              <Input
                id="languagesCsv"
                placeholder="English, Bemba, Nyanja"
                value={profileForm.languagesCsv}
                onChange={(e) => setProfileForm((p) => ({ ...p, languagesCsv: e.target.value }))}
              />
              <p className="text-xs text-muted">Separate multiple languages with commas.</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bio">Professional bio</Label>
              <Textarea
                id="bio"
                rows={4}
                placeholder="Brief description of your specialisation, experience, and approach to care..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm((p) => ({ ...p, bio: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={isCreating || isUpdating}>
              {isCreating
                ? "Creating profile..."
                : isUpdating
                  ? "Saving..."
                  : providerMissing
                    ? "Create Profile"
                    : "Save Changes"}
            </Button>
            {canSubmit ? (
              <Button
                type="button"
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => void handleSubmitForReview()}
              >
                {isSubmitting ? "Submitting..." : "Submit for Review"}
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}

      {/* Credentials tab */}
      {activeTab === "credentials" ? (
        <div className="space-y-6">
          {/* Expiry warnings list */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-3.5" />
              </span>
              <h2 className="text-base font-semibold text-text">Credential Health</h2>
            </div>

            {(status?.expiryWarnings ?? []).length === 0 ? (
              <div className="rounded-2xl border border-success/25 bg-success/5 px-5 py-5">
                <div className="flex items-center gap-2 text-sm font-medium text-success">
                  <ShieldCheck className="size-4" />
                  All credentials are valid
                </div>
                <p className="mt-1 text-xs text-muted">
                  No expiring or expired credentials in the next 60 days.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(status?.expiryWarnings ?? []).map((w) => (
                  <div
                    key={w.type}
                    className={cn(
                      "flex flex-col gap-2 rounded-2xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between",
                      w.status === "EXPIRED"
                        ? "border-danger/30 bg-danger/5"
                        : "border-warning/30 bg-warning/5",
                    )}
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-text">{w.label}</p>
                      <p className="text-xs text-muted">
                        Expiry:{" "}
                        <span className={w.status === "EXPIRED" ? "font-medium text-danger" : "font-medium text-warning"}>
                          {formatDate(w.expiryDate)}
                        </span>
                      </p>
                    </div>
                    <Badge variant={warningVariant(w.status)}>
                      {w.status === "EXPIRED"
                        ? "Expired"
                        : w.daysRemaining != null
                          ? `Expires in ${w.daysRemaining}d`
                          : "Expiring soon"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verification dates */}
          {status ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Verified At</p>
                <p className="mt-1.5 text-sm font-semibold text-text">{formatDate(status.verifiedAt)}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Verification Status</p>
                <p className="mt-1.5 text-sm font-semibold text-text">{status.verificationStatus ?? "Pending"}</p>
              </div>
              <div className="rounded-2xl border border-border bg-surface px-4 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Suspended At</p>
                <p className="mt-1.5 text-sm font-semibold text-text">{formatDate(status.suspendedAt)}</p>
              </div>
            </div>
          ) : null}

          {/* License upload */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileText className="size-3.5" />
              </span>
              <h2 className="text-base font-semibold text-text">Upload License Document</h2>
            </div>

            <form
              onSubmit={(e) => void handleUploadLicense(e)}
              className="rounded-2xl border border-border bg-surface p-5 sm:p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="licenseType">License type</Label>
                  <select
                    id="licenseType"
                    className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={licenseForm.licenseType}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, licenseType: e.target.value }))}
                  >
                    {PROVIDER_LICENSE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>License document</Label>
                  <FileDropZone
                    key={licenseFileKey}
                    value={licenseForm.file}
                    onChange={(file) => setLicenseForm((p) => ({ ...p, file }))}
                    accept=".pdf,.jpg,.jpeg,.png"
                    hint="PDF, JPG or PNG accepted"
                    loading={isUploadingLicense}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseIssuedAt">Date issued</Label>
                  <Input
                    id="licenseIssuedAt"
                    type="date"
                    value={licenseForm.issuedAt}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, issuedAt: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licenseExpiryDate">Expiry date</Label>
                  <Input
                    id="licenseExpiryDate"
                    type="date"
                    value={licenseForm.expiryDate}
                    onChange={(e) => setLicenseForm((p) => ({ ...p, expiryDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="mt-4">
                <Button type="submit" variant="primary" disabled={isUploadingLicense} className="gap-2">
                  <Upload className="size-4" />
                  {isUploadingLicense ? "Uploading..." : "Upload License"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
