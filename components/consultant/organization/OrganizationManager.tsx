"use client";

import { FormEvent, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  Building2,
  UserPlus,
  Camera,
  CheckCircle,
  AlertCircle,
  Users,
  Mail,
  Settings,
  Check,
  X,
} from "lucide-react";
import { getGraphQLErrorCode } from "@/features/auth/auth-context";
import {
  APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION,
  CREATE_PROVIDER_ORGANIZATION_MUTATION,
  DEACTIVATE_ORGANIZATION_MUTATION,
  INVITE_PROVIDER_TO_ORGANIZATION_MUTATION,
  MY_CONSULTANT_ORGANIZATIONS_QUERY,
  ORGANIZATION_PROVIDER_INVITES_QUERY,
  ORGANIZATION_PROVIDERS_QUERY,
  ORGANIZATION_TYPE_OPTIONS,
  REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION,
  UPDATE_ORGANIZATION_MUTATION,
  UPLOAD_ORGANIZATION_LOGO_MUTATION,
} from "@/lib/consultant/organization-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

// ─── Types ───────────────────────────────────────────────────────────────────

type OrgSummary = {
  id: string;
  name: string;
  type: string;
  status: string | null;
  regulatoryId: string | null;
  parentOrgId: string | null;
  logoUrl: string | null;
};

type OrgProvider = {
  id: string;
  displayName: string | null;
  lifecycleStatus: string | null;
  verificationStatus: string | null;
  organization: { id: string; name: string } | null;
  user: { id: string; email: string } | null;
};

type OrgInvite = {
  id: string;
  status: string;
  note: string | null;
  inviterProvider: { id: string; displayName: string | null } | null;
  invitedProvider: { id: string; displayName: string | null } | null;
  reviewedAt: string | null;
  createdAt: string;
};

type AlertState = { type: "success" | "error"; message: string } | null;
type Tab = "members" | "invites" | "edit";
type InviteFilter = "pending" | "approved" | "rejected" | "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mapOrgError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "INVALID_ORG_TYPE") return "Invalid organization type selected.";
  if (code === "ORGANIZATION_NOT_FOUND") return "Organization not found.";
  if (code === "ORGANIZATION_INACTIVE") return "This organization is inactive.";
  if (code === "ORGANIZATION_ADMIN_REQUIRED") return "You need admin access to perform this action.";
  if (code === "PROVIDER_PROFILE_NOT_FOUND") return "Provider profile not found. Check the provider ID.";
  if (code === "INVITE_ALREADY_EXISTS") return "A pending invite already exists for this provider.";
  if (code === "INVITE_NOT_FOUND") return "Invite not found.";
  if (code === "INVITE_NOT_PENDING") return "This invite is no longer pending.";
  if (code === "PROVIDER_ALREADY_IN_ORGANIZATION") return "This provider is already part of the organization.";
  if (code === "TENANT_ACCESS_DENIED") return "Access denied.";
  return "Something went wrong. Please try again.";
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function statusVariant(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED" || s === "ACTIVE" || s === "VERIFIED") return "success" as const;
  if (s === "PENDING") return "warning" as const;
  if (s === "REJECTED" || s === "SUSPENDED" || s === "INACTIVE" || s === "DEACTIVATED") return "danger" as const;
  return "secondary" as const;
}

function typeLabel(type: string) {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function orgInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBanner({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div className={cn(
      "flex items-start gap-3 rounded-2xl border px-4 py-3.5",
      isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
    )}>
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1 text-sm">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ─── Logo upload ──────────────────────────────────────────────────────────────

function OrgLogoUpload({ orgId, logoUrl, orgName, onSuccess, onError }: {
  orgId: string;
  logoUrl: string | null;
  orgName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadLogo, { loading }] = useMutation(UPLOAD_ORGANIZATION_LOGO_MUTATION);

  async function handleFile(file: File) {
    try {
      await uploadLogo({ variables: { organizationId: orgId, file } });
      onSuccess();
    } catch {
      onError("Logo upload failed. Please try again.");
    }
  }

  return (
    <div className="relative shrink-0">
      <div className="size-16 overflow-hidden rounded-2xl border-2 border-border bg-surface shadow-soft sm:size-20">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={orgName} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-primary/10 text-lg font-bold text-primary">
            {orgInitials(orgName)}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
        className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-xl border border-border bg-surface shadow-soft transition hover:bg-background disabled:opacity-50"
        title="Upload logo"
      >
        {loading
          ? <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          : <Camera className="size-3 text-muted" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Invite row ───────────────────────────────────────────────────────────────

function InviteRow({ invite, onRefresh }: { invite: OrgInvite; onRefresh: () => void }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [approveInvite, { loading: approving }] = useMutation(APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const [rejectInvite, { loading: rejecting }] = useMutation(REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const isPending = invite.status.toUpperCase() === "PENDING";

  async function handleApprove() {
    try {
      await approveInvite({ variables: { inviteId: invite.id } });
      onRefresh();
    } catch { /* silent */ }
  }

  async function handleReject(e: FormEvent) {
    e.preventDefault();
    try {
      await rejectInvite({ variables: { inviteId: invite.id, reason: reason || undefined } });
      setShowRejectForm(false);
      setReason("");
      onRefresh();
    } catch { /* silent */ }
  }

  return (
    <div className={cn(
      "rounded-2xl border-l-4 bg-surface px-4 py-4 shadow-subtle",
      isPending ? "border-l-warning/60" :
      invite.status.toUpperCase() === "APPROVED" ? "border-l-success/50" : "border-l-danger/40",
    )}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text">
              {invite.invitedProvider?.displayName ?? "Unknown Provider"}
            </p>
            <Badge variant={statusVariant(invite.status)}>
              {invite.status.charAt(0).toUpperCase() + invite.status.slice(1).toLowerCase()}
            </Badge>
          </div>
          {invite.inviterProvider?.displayName ? (
            <p className="text-xs text-muted">
              Invited by {invite.inviterProvider.displayName} · {formatDate(invite.createdAt)}
            </p>
          ) : null}
          {invite.note ? <p className="text-xs italic text-muted">&quot;{invite.note}&quot;</p> : null}
          {invite.reviewedAt ? (
            <p className="text-xs text-muted">Reviewed {formatDate(invite.reviewedAt)}</p>
          ) : null}
        </div>

        {isPending ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={approving}
              onClick={() => void handleApprove()} className="gap-1.5 text-success">
              <Check className="size-3.5" />
              {approving ? "Approving…" : "Approve"}
            </Button>
            <Button type="button" size="sm" variant="secondary"
              onClick={() => setShowRejectForm((v) => !v)} className="gap-1.5 text-danger">
              <X className="size-3.5" />
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      {showRejectForm ? (
        <form onSubmit={(e) => void handleReject(e)} className="mt-3 flex gap-2">
          <Input placeholder="Reason (optional)" value={reason}
            onChange={(e) => setReason(e.target.value)} className="flex-1" />
          <Button type="submit" size="sm" variant="primary" disabled={rejecting}>
            {rejecting ? "…" : "Confirm"}
          </Button>
          <Button type="button" size="sm" variant="secondary"
            onClick={() => { setShowRejectForm(false); setReason(""); }}>
            Cancel
          </Button>
        </form>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OrganizationManager() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("members");
  const [inviteFilter, setInviteFilter] = useState<InviteFilter>("pending");
  const [alert, setAlert] = useState<AlertState>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  const [createForm, setCreateForm] = useState({ name: "", type: "CLINIC", regulatoryId: "", parentOrgId: "" });
  const [editForm, setEditForm] = useState({ name: "", type: "CLINIC", regulatoryId: "", parentOrgId: "" });
  const [editFormReady, setEditFormReady] = useState(false);
  const [inviteForm, setInviteForm] = useState({ providerId: "", note: "" });

  // ── Queries ──
  const { data: orgsData, loading: orgsLoading, refetch: refetchOrgs } =
    useQuery<{ myConsultantOrganizations: OrgSummary[] }>(MY_CONSULTANT_ORGANIZATIONS_QUERY, {
      fetchPolicy: "network-only",
      onCompleted(data) {
        const orgs = data.myConsultantOrganizations;
        if (orgs.length > 0 && !selectedOrgId) {
          const first = orgs[0];
          setSelectedOrgId(first.id);
          setEditForm({
            name: first.name,
            type: first.type,
            regulatoryId: first.regulatoryId ?? "",
            parentOrgId: first.parentOrgId ?? "",
          });
          setEditFormReady(true);
        }
      },
    });

  const orgs = orgsData?.myConsultantOrganizations ?? [];
  const activeOrg = orgs.find((o) => o.id === selectedOrgId) ?? null;

  const { data: membersData } =
    useQuery<{ organizationProviders: OrgProvider[] }>(ORGANIZATION_PROVIDERS_QUERY, {
      variables: { organizationId: selectedOrgId },
      skip: !selectedOrgId,
      fetchPolicy: "network-only",
    });

  const { data: invitesData, refetch: refetchInvites } =
    useQuery<{ organizationProviderInvites: OrgInvite[] }>(ORGANIZATION_PROVIDER_INVITES_QUERY, {
      variables: { organizationId: selectedOrgId, status: inviteFilter || undefined },
      skip: !selectedOrgId,
      fetchPolicy: "network-only",
    });

  // ── Mutations ──
  const [createOrg, { loading: isCreating }] = useMutation(CREATE_PROVIDER_ORGANIZATION_MUTATION);
  const [updateOrg, { loading: isUpdating }] = useMutation(UPDATE_ORGANIZATION_MUTATION);
  const [deactivateOrg, { loading: isDeactivating }] = useMutation(DEACTIVATE_ORGANIZATION_MUTATION);
  const [inviteProvider, { loading: isInviting }] = useMutation(INVITE_PROVIDER_TO_ORGANIZATION_MUTATION);

  const members = membersData?.organizationProviders ?? [];
  const invites = invitesData?.organizationProviderInvites ?? [];

  // ── Handlers ──

  function selectOrg(org: OrgSummary) {
    setSelectedOrgId(org.id);
    setEditForm({
      name: org.name,
      type: org.type,
      regulatoryId: org.regulatoryId ?? "",
      parentOrgId: org.parentOrgId ?? "",
    });
    setEditFormReady(true);
    setActiveTab("members");
    setAlert(null);
  }

  async function handleCreateOrg(e: FormEvent) {
    e.preventDefault();
    setAlert(null);
    try {
      const { data } = await createOrg({
        variables: {
          name: createForm.name,
          type: createForm.type,
          regulatoryId: createForm.regulatoryId || undefined,
          parentOrgId: createForm.parentOrgId || undefined,
        },
      });
      const created = data?.createProviderOrganization?.organization;
      await refetchOrgs();
      if (created) {
        setSelectedOrgId(created.id);
        setEditForm({
          name: created.name,
          type: created.type,
          regulatoryId: created.regulatoryId ?? "",
          parentOrgId: created.parentOrgId ?? "",
        });
        setEditFormReady(true);
      }
      setAlert({ type: "success", message: `${createForm.name} created. You are now the organization admin.` });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  async function handleUpdateOrg(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId) return;
    setAlert(null);
    try {
      await updateOrg({
        variables: {
          organizationId: selectedOrgId,
          data: {
            name: editForm.name,
            type: editForm.type,
            regulatoryId: editForm.regulatoryId || undefined,
            parentOrgId: editForm.parentOrgId || null,
          },
        },
      });
      await refetchOrgs();
      setAlert({ type: "success", message: "Organization updated." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  async function handleDeactivate() {
    if (!selectedOrgId) return;
    setAlert(null);
    try {
      await deactivateOrg({ variables: { organizationId: selectedOrgId } });
      setConfirmDeactivate(false);
      await refetchOrgs();
      setAlert({ type: "success", message: "Organization deactivated." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  async function handleInviteProvider(e: FormEvent) {
    e.preventDefault();
    if (!selectedOrgId) return;
    setAlert(null);
    try {
      await inviteProvider({
        variables: {
          organizationId: selectedOrgId,
          providerId: inviteForm.providerId,
          note: inviteForm.note || undefined,
        },
      });
      setInviteForm({ providerId: "", note: "" });
      setShowInviteForm(false);
      await refetchInvites();
      setAlert({ type: "success", message: "Invitation sent." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  // ── Loading ──

  if (orgsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 animate-pulse rounded-2xl bg-border/40" />
        <div className="h-48 animate-pulse rounded-2xl bg-border/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Consultant Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Organization</h1>
        <p className="text-sm text-muted">
          Create or manage your practice, clinic, or healthcare organization.
        </p>
      </header>

      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      {/* ── No org: create form ── */}
      {orgs.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="text-base font-semibold text-text">Create your organization</p>
              <p className="text-sm text-muted">
                Set up a clinic, lab, or practice. You will become the admin and can invite other providers.
              </p>
            </div>
          </div>

          <form onSubmit={(e) => void handleCreateOrg(e)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="orgName">Organization name <span className="text-danger">*</span></Label>
                <Input id="orgName" placeholder="Nakubiana Clinic"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgType">Type <span className="text-danger">*</span></Label>
                <select id="orgType"
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={createForm.type}
                  onChange={(e) => setCreateForm((p) => ({ ...p, type: e.target.value }))}>
                  {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulatoryId">Regulatory ID</Label>
                <Input id="regulatoryId" placeholder="Optional"
                  value={createForm.regulatoryId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, regulatoryId: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="parentOrgId">Parent organization</Label>
                <select
                  id="parentOrgId"
                  className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={createForm.parentOrgId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, parentOrgId: e.target.value }))}
                >
                  <option value="">— None (independent) —</option>
                  {orgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({typeLabel(org.type)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" variant="primary" disabled={isCreating} className="gap-2">
              <Building2 className="size-4" />
              {isCreating ? "Creating…" : "Create Organization"}
            </Button>
          </form>
        </div>
      ) : (
        <>
          {/* ── Multi-org switcher ── */}
          {orgs.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {orgs.map((org) => (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => selectOrg(org)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition",
                    org.id === selectedOrgId
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface text-text hover:border-primary/30",
                  )}
                >
                  <Building2 className="size-4 shrink-0" />
                  {org.name}
                  {org.status ? (
                    <Badge variant={statusVariant(org.status)} className="ml-1 text-[10px]">
                      {org.status}
                    </Badge>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {/* ── Org header card ── */}
          {activeOrg ? (
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <OrgLogoUpload
                    orgId={activeOrg.id}
                    logoUrl={activeOrg.logoUrl}
                    orgName={activeOrg.name}
                    onSuccess={() => void refetchOrgs()}
                    onError={(message) => setAlert({ type: "error", message })}
                  />
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-text">{activeOrg.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{typeLabel(activeOrg.type)}</Badge>
                      {activeOrg.status ? (
                        <Badge variant={statusVariant(activeOrg.status)}>{activeOrg.status}</Badge>
                      ) : null}
                    </div>
                    {activeOrg.regulatoryId ? (
                      <p className="text-xs text-muted">Reg ID: {activeOrg.regulatoryId}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
                  <p className="text-muted">
                    <span className="font-semibold text-text">{members.length}</span>{" "}
                    {members.length === 1 ? "member" : "members"}
                  </p>
                  <p className="text-muted">
                    <span className="font-semibold text-text">
                      {invites.filter((i) => i.status.toUpperCase() === "PENDING").length}
                    </span>{" "}
                    pending invites
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Tabs ── */}
          <div className="border-b border-border">
            <nav className="-mb-px flex gap-6">
              {([
                { key: "members" as Tab, label: "Members", icon: <Users className="size-3.5" /> },
                { key: "invites" as Tab, label: "Invites", icon: <Mail className="size-3.5" /> },
                { key: "edit" as Tab, label: "Edit", icon: <Settings className="size-3.5" /> },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-1.5 pb-3 text-sm font-medium transition",
                    activeTab === tab.key
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted hover:text-text",
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Members tab ── */}
          {activeTab === "members" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">
                  {members.length} provider{members.length !== 1 ? "s" : ""} in this organization
                </p>
                <Button type="button" variant={showInviteForm ? "secondary" : "primary"} size="sm"
                  className="gap-1.5" onClick={() => setShowInviteForm((v) => !v)}>
                  <UserPlus className="size-4" />
                  {showInviteForm ? "Cancel" : "Invite Provider"}
                </Button>
              </div>

              {showInviteForm ? (
                <form onSubmit={(e) => void handleInviteProvider(e)}
                  className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                  <p className="mb-4 text-sm font-medium text-text">Invite a provider by their profile ID</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="inviteProviderId">
                        Provider ID <span className="text-danger">*</span>
                      </Label>
                      <Input id="inviteProviderId" placeholder="UUID of the provider to invite"
                        value={inviteForm.providerId}
                        onChange={(e) => setInviteForm((p) => ({ ...p, providerId: e.target.value }))} required />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="inviteNote">Note (optional)</Label>
                      <Input id="inviteNote" placeholder="e.g. Joining as a specialist for the Lusaka branch"
                        value={inviteForm.note}
                        onChange={(e) => setInviteForm((p) => ({ ...p, note: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button type="submit" variant="primary" size="sm" disabled={isInviting}>
                      {isInviting ? "Sending…" : "Send Invitation"}
                    </Button>
                  </div>
                </form>
              ) : null}

              {members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center">
                  <p className="text-sm font-medium text-text">No providers yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Invite providers using the button above. They will appear here once approved.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id}
                      className="flex flex-col gap-2 rounded-xl border-l-4 border-l-success/40 bg-surface px-4 py-3.5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-text">
                          {member.displayName ?? "Unnamed Provider"}
                        </p>
                        {member.user?.email ? (
                          <p className="text-xs text-muted">{member.user.email}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        {member.lifecycleStatus ? (
                          <Badge variant={statusVariant(member.lifecycleStatus)}>
                            {member.lifecycleStatus}
                          </Badge>
                        ) : null}
                        {member.verificationStatus ? (
                          <Badge variant={statusVariant(member.verificationStatus)}>
                            {member.verificationStatus}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ── Invites tab ── */}
          {activeTab === "invites" ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {(["pending", "approved", "rejected", ""] as InviteFilter[]).map((f) => (
                  <button key={f} type="button"
                    onClick={() => { setInviteFilter(f); void refetchInvites(); }}
                    className={cn(
                      "rounded-xl border px-3.5 py-1.5 text-sm font-medium transition",
                      inviteFilter === f
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-surface text-muted hover:text-text",
                    )}>
                    {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
                <Button type="button" variant="ghost" size="sm" className="ml-auto"
                  onClick={() => void refetchInvites()}>
                  Refresh
                </Button>
              </div>

              {invites.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-8 text-center">
                  <p className="text-sm font-medium text-text">No invites</p>
                  <p className="mt-1 text-xs text-muted">
                    {inviteFilter === "pending"
                      ? "No pending invites at this time."
                      : "No invites match this filter."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invites.map((invite) => (
                    <InviteRow key={invite.id} invite={invite} onRefresh={() => void refetchInvites()} />
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* ── Edit tab ── */}
          {activeTab === "edit" && editFormReady && activeOrg ? (
            <div className="space-y-6">
              <form onSubmit={(e) => void handleUpdateOrg(e)}
                className="space-y-5 rounded-2xl border border-border bg-surface p-5 sm:p-6">
                <p className="text-sm font-medium text-text">Organization details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="editOrgName">Name <span className="text-danger">*</span></Label>
                    <Input id="editOrgName" value={editForm.name}
                      onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editOrgType">Type <span className="text-danger">*</span></Label>
                    <select id="editOrgType"
                      className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={editForm.type}
                      onChange={(e) => setEditForm((p) => ({ ...p, type: e.target.value }))}>
                      {ORGANIZATION_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="editRegId">Regulatory ID</Label>
                    <Input id="editRegId" placeholder="Optional"
                      value={editForm.regulatoryId}
                      onChange={(e) => setEditForm((p) => ({ ...p, regulatoryId: e.target.value }))} />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="editParentOrgId">Parent organization</Label>
                    <select
                      id="editParentOrgId"
                      className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      value={editForm.parentOrgId}
                      onChange={(e) => setEditForm((p) => ({ ...p, parentOrgId: e.target.value }))}
                    >
                      <option value="">— None (independent) —</option>
                      {orgs
                        .filter((org) => org.id !== selectedOrgId)
                        .map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({typeLabel(org.type)})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                <Button type="submit" variant="primary" disabled={isUpdating}>
                  {isUpdating ? "Saving…" : "Save Changes"}
                </Button>
              </form>

              {/* Deactivate */}
              <div className="rounded-2xl border border-danger/20 bg-danger/5 p-5">
                <p className="text-sm font-semibold text-danger">Danger zone</p>
                <p className="mt-1 text-xs text-muted">
                  Deactivating this organization will prevent new bookings and hide it from the provider directory. Existing data is preserved.
                </p>
                {confirmDeactivate ? (
                  <div className="mt-4 flex items-center gap-3">
                    <p className="text-sm text-danger font-medium">Are you sure?</p>
                    <button
                      type="button"
                      disabled={isDeactivating}
                      onClick={() => void handleDeactivate()}
                      className="inline-flex h-9 items-center rounded-xl bg-danger px-4 text-xs font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
                    >
                      {isDeactivating ? "Deactivating…" : "Yes, deactivate"}
                    </button>
                    <Button type="button" variant="secondary" size="sm"
                      onClick={() => setConfirmDeactivate(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDeactivate(true)}
                    className="mt-4 inline-flex h-9 items-center rounded-xl border border-danger/40 px-4 text-xs font-medium text-danger transition hover:bg-danger/10"
                  >
                    Deactivate organization
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
