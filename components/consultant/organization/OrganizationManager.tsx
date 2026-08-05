"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Camera,
  Check,
  CheckCircle,
  Mail,
  Settings,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getGraphQLErrorCode, getGraphQLErrorMessage } from "@/features/auth/auth-context";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils/cn";

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
  user: { id: string; email: string } | null;
};

type OrgInvite = {
  id: string;
  status: string;
  invitedEmail: string;
  note: string | null;
  inviterProvider: { id: string; displayName: string | null } | null;
  invitedProvider: { id: string; displayName: string | null } | null;
  invitedUser: { id: string; email: string } | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

type AlertState = { type: "success" | "error"; message: string } | null;
type InviteFilter = "pending" | "accepted" | "approved" | "rejected" | "expired" | "";

const orgBase = "/consultant/organization";

function mapOrgError(error: unknown) {
  const code = getGraphQLErrorCode(error);
  if (code === "INVALID_ORG_TYPE") return "Invalid organization type selected.";
  if (code === "ORGANIZATION_NOT_FOUND") return "Organization not found.";
  if (code === "ORGANIZATION_INACTIVE") return "This organization is inactive.";
  if (code === "ORGANIZATION_ADMIN_REQUIRED") return "You need admin access to perform this action.";
  if (code === "PROVIDER_PROFILE_NOT_FOUND") return "Provider profile not found. Check the provider ID.";
  if (code === "PROVIDER_INVITE_EMAIL_REQUIRED") return "Provider email is required.";
  if (code === "INVITE_ALREADY_EXISTS") return "An open invite already exists for this provider.";
  if (code === "INVITE_NOT_FOUND") return "Invite not found.";
  if (code === "INVITE_NOT_PENDING") return "This invite is no longer pending.";
  if (code === "INVITE_NOT_ACCEPTED") return "The provider must accept this invitation before approval.";
  if (code === "PROVIDER_ALREADY_IN_ORGANIZATION") return "This provider is already part of the organization.";
  if (code === "TENANT_ACCESS_DENIED") return "Access denied.";
  return getGraphQLErrorMessage(error, "Something went wrong. Please try again.");
}

function statusVariant(status?: string | null) {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED" || s === "ACTIVE" || s === "VERIFIED") return "success" as const;
  if (s === "PENDING" || s === "ACCEPTED") return "warning" as const;
  if (s === "REJECTED" || s === "EXPIRED" || s === "SUSPENDED" || s === "INACTIVE" || s === "DEACTIVATED") {
    return "danger" as const;
  }
  return "secondary" as const;
}

function typeLabel(type: string) {
  return ORGANIZATION_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function orgInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function AlertBanner({ alert, onDismiss }: { alert: AlertState; onDismiss: () => void }) {
  if (!alert) return null;
  const isError = alert.type === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3.5",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1 text-sm">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function LoadingBlocks() {
  return (
    <div className="space-y-4">
      <div className="h-28 animate-pulse rounded-lg bg-border/40" />
      <div className="h-44 animate-pulse rounded-lg bg-border/40" />
    </div>
  );
}

function useMyOrganizations() {
  return useQuery<{ myConsultantOrganizations: OrgSummary[] }>(MY_CONSULTANT_ORGANIZATIONS_QUERY, {
    fetchPolicy: "network-only",
  });
}

function useOrganization(organizationId: string) {
  const query = useMyOrganizations();
  const organization = query.data?.myConsultantOrganizations.find((org) => org.id === organizationId) ?? null;

  return { ...query, organization };
}

function OrganizationLogo({
  orgId,
  logoUrl,
  orgName,
  onSuccess,
  onError,
}: {
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
      <div className="size-16 overflow-hidden rounded-lg border-2 border-border bg-surface sm:size-20">
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
        className="absolute -bottom-2 -right-2 flex size-7 items-center justify-center rounded-lg border border-border bg-surface transition hover:bg-background disabled:opacity-50"
        title="Upload logo"
      >
        {loading ? (
          <span className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : (
          <Camera className="size-3 text-muted" />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}

function OrganizationNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Organization not found"
        description="The organization could not be loaded, or you do not have access to it."
        breadcrumbs={[
          { label: "Organization", href: orgBase },
          { label: "Not found" },
        ]}
        actions={
          <Button href={orgBase} variant="secondary" className="gap-2">
            <ArrowLeft className="size-4" />
            Back to organizations
          </Button>
        }
      />
      <div className="rounded-lg border border-border bg-surface px-5 py-8 text-sm text-muted">
        Choose an organization from your organization list.
      </div>
    </div>
  );
}

function OrganizationSubnav({ organizationId, current }: { organizationId: string; current: "overview" | "members" | "invites" | "settings" }) {
  const items = [
    { key: "overview", label: "Overview", href: `${orgBase}/${organizationId}` },
    { key: "members", label: "Members", href: `${orgBase}/${organizationId}/members` },
    { key: "invites", label: "Invites", href: `${orgBase}/${organizationId}/invites` },
    { key: "settings", label: "Settings", href: `${orgBase}/${organizationId}/settings` },
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-border pb-3" aria-label="Organization sections">
      {items.map((item) => (
        <Button
          key={item.key}
          href={item.href}
          variant={current === item.key ? "primary" : "secondary"}
          size="sm"
        >
          {item.label}
        </Button>
      ))}
    </nav>
  );
}

function OrganizationPageHeader({
  organization,
  current,
  actions,
}: {
  organization: OrgSummary;
  current: "overview" | "members" | "invites" | "settings";
  actions?: ReactNode;
}) {
  return (
    <>
      <PageHeader
        eyebrow="Consultant Workspace"
        title={organization.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{typeLabel(organization.type)}</Badge>
            {organization.status ? <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge> : null}
            {organization.regulatoryId ? <span>Reg ID: {organization.regulatoryId}</span> : null}
          </span>
        }
        breadcrumbs={[
          { label: "Organization", href: orgBase },
          { label: organization.name },
        ]}
        actions={actions}
      />
      <OrganizationSubnav organizationId={organization.id} current={current} />
    </>
  );
}

export function OrganizationManager() {
  const { data, loading, error } = useMyOrganizations();
  const organizations = data?.myConsultantOrganizations ?? [];

  if (loading) return <LoadingBlocks />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Consultant Workspace"
        title="Organizations"
        description="Keep organization work ordered by starting from a list, then opening the section you need."
        actions={
          <Button href={`${orgBase}/new`} className="gap-2">
            <Building2 className="size-4" />
            New organization
          </Button>
        }
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {getGraphQLErrorMessage(error, "Unable to load organizations.")}
        </div>
      ) : null}

      {organizations.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface px-5 py-8">
          <div className="max-w-2xl space-y-3">
            <p className="text-base font-semibold text-text">No organization yet</p>
            <p className="text-sm leading-6 text-muted">
              Create a clinic, lab, or practice first. After creation, member management, provider invites, and settings each have their own page.
            </p>
            <Button href={`${orgBase}/new`} className="gap-2">
              <Building2 className="size-4" />
              Create organization
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {organizations.map((organization) => (
            <div key={organization.id} className="rounded-lg border border-border bg-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Building2 className="size-5 text-primary" />
                    <h2 className="truncate text-lg font-semibold text-text">{organization.name}</h2>
                    {organization.status ? <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Badge variant="secondary">{typeLabel(organization.type)}</Badge>
                    <span>{organization.regulatoryId ?? "No regulatory ID"}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <Button href={`${orgBase}/${organization.id}`} variant="secondary" size="sm">
                    Overview
                  </Button>
                  <Button href={`${orgBase}/${organization.id}/members`} variant="secondary" size="sm">
                    Members
                  </Button>
                  <Button href={`${orgBase}/${organization.id}/invites`} variant="secondary" size="sm">
                    Invites
                  </Button>
                  <Button href={`${orgBase}/${organization.id}/settings`} variant="secondary" size="sm">
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizationCreatePageView() {
  const router = useRouter();
  const [alert, setAlert] = useState<AlertState>(null);
  const [form, setForm] = useState({ name: "", type: "CLINIC", regulatoryId: "", parentOrgId: "" });
  const { data } = useMyOrganizations();
  const [createOrg, { loading }] = useMutation(CREATE_PROVIDER_ORGANIZATION_MUTATION);
  const organizations = data?.myConsultantOrganizations ?? [];

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    try {
      const { data: result } = await createOrg({
        variables: {
          name: form.name.trim(),
          type: form.type,
          regulatoryId: form.regulatoryId.trim() || undefined,
          parentOrgId: form.parentOrgId || undefined,
        },
      });
      const created = result?.createProviderOrganization?.organization;
      router.push(created?.id ? `${orgBase}/${created.id}` : orgBase);
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Create organization"
        description="Set up the organization record first. Members, invites, and settings are managed after creation."
        breadcrumbs={[
          { label: "Organization", href: orgBase },
          { label: "Create" },
        ]}
      />
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      <form onSubmit={(event) => void handleSubmit(event)} className="max-w-3xl space-y-5 rounded-lg border border-border bg-surface p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="orgName">Organization name <span className="text-danger">*</span></Label>
            <Input id="orgName" placeholder="Nakubiana Clinic" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgType">Type <span className="text-danger">*</span></Label>
            <select
              id="orgType"
              className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.type}
              onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
            >
              {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="regulatoryId">Regulatory ID</Label>
            <Input id="regulatoryId" placeholder="Optional" value={form.regulatoryId} onChange={(event) => setForm((current) => ({ ...current, regulatoryId: event.target.value }))} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="parentOrgId">Parent organization</Label>
            <select
              id="parentOrgId"
              className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={form.parentOrgId}
              onChange={(event) => setForm((current) => ({ ...current, parentOrgId: event.target.value }))}
            >
              <option value="">None, independent organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name} ({typeLabel(org.type)})</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create organization"}</Button>
          <Button href={orgBase} variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
}

export function OrganizationDetailPageView({ organizationId }: { organizationId: string }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const { organization, loading, refetch } = useOrganization(organizationId);
  const { data: membersData } = useQuery<{ organizationProviders: OrgProvider[] }>(ORGANIZATION_PROVIDERS_QUERY, {
    variables: { organizationId },
    fetchPolicy: "network-only",
  });
  const { data: invitesData } = useQuery<{ organizationProviderInvites: OrgInvite[] }>(ORGANIZATION_PROVIDER_INVITES_QUERY, {
    variables: { organizationId, status: "pending" },
    fetchPolicy: "network-only",
  });
  const members = membersData?.organizationProviders ?? [];
  const pendingInvites = invitesData?.organizationProviderInvites ?? [];

  if (loading) return <LoadingBlocks />;
  if (!organization) return <OrganizationNotFound />;

  return (
    <div className="space-y-6">
      <OrganizationPageHeader organization={organization} current="overview" />
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <OrganizationLogo
            orgId={organization.id}
            logoUrl={organization.logoUrl}
            orgName={organization.name}
            onSuccess={() => void refetch()}
            onError={(message) => setAlert({ type: "error", message })}
          />
          <div className="space-y-1">
            <p className="text-lg font-semibold text-text">{organization.name}</p>
            <p className="text-sm text-muted">{organization.regulatoryId ?? "No regulatory ID recorded"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href={`${orgBase}/${organization.id}/members`} className="rounded-lg border border-border bg-surface p-5 transition hover:border-primary/40">
          <Users className="mb-3 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">{members.length}</p>
          <p className="text-sm font-medium text-text">Members</p>
          <p className="mt-1 text-sm text-muted">Review providers and invite new members.</p>
        </Link>
        <Link href={`${orgBase}/${organization.id}/invites`} className="rounded-lg border border-border bg-surface p-5 transition hover:border-primary/40">
          <Mail className="mb-3 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">{pendingInvites.length}</p>
          <p className="text-sm font-medium text-text">Pending invites</p>
          <p className="mt-1 text-sm text-muted">Approve accepted invitations and track invite state.</p>
        </Link>
        <Link href={`${orgBase}/${organization.id}/settings`} className="rounded-lg border border-border bg-surface p-5 transition hover:border-primary/40">
          <Settings className="mb-3 size-5 text-primary" />
          <p className="text-2xl font-semibold text-text">1</p>
          <p className="text-sm font-medium text-text">Settings page</p>
          <p className="mt-1 text-sm text-muted">Edit details, upload the logo, or deactivate.</p>
        </Link>
      </div>
    </div>
  );
}

export function OrganizationMembersPageView({ organizationId }: { organizationId: string }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", note: "" });
  const { organization, loading } = useOrganization(organizationId);
  const { data, refetch } = useQuery<{ organizationProviders: OrgProvider[] }>(ORGANIZATION_PROVIDERS_QUERY, {
    variables: { organizationId },
    fetchPolicy: "network-only",
  });
  const [inviteProvider, { loading: inviting }] = useMutation(INVITE_PROVIDER_TO_ORGANIZATION_MUTATION);
  const members = data?.organizationProviders ?? [];

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    try {
      await inviteProvider({
        variables: {
          organizationId,
          email: inviteForm.email.trim(),
          note: inviteForm.note.trim() || undefined,
        },
      });
      setInviteForm({ email: "", note: "" });
      setShowInviteForm(false);
      setAlert({ type: "success", message: "Invitation sent." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  if (loading) return <LoadingBlocks />;
  if (!organization) return <OrganizationNotFound />;

  return (
    <div className="space-y-6">
      <OrganizationPageHeader
        organization={organization}
        current="members"
        actions={
          <Button type="button" size="sm" onClick={() => setShowInviteForm((value) => !value)} className="gap-2">
            <UserPlus className="size-4" />
            Invite provider
          </Button>
        }
      />
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      {showInviteForm ? (
        <form onSubmit={(event) => void handleInvite(event)} className="max-w-3xl space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-5">
          <div className="space-y-2">
            <Label htmlFor="inviteProviderEmail">Provider email <span className="text-danger">*</span></Label>
            <Input id="inviteProviderEmail" type="email" placeholder="doctor@example.com" value={inviteForm.email} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inviteNote">Note</Label>
            <Input id="inviteNote" placeholder="Optional context for the provider" value={inviteForm.note} onChange={(event) => setInviteForm((current) => ({ ...current, note: event.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={inviting}>{inviting ? "Sending..." : "Send invitation"}</Button>
            <Button type="button" variant="secondary" onClick={() => setShowInviteForm(false)}>Cancel</Button>
          </div>
        </form>
      ) : null}

      {members.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm font-medium text-text">No providers yet</p>
          <p className="mt-1 text-sm text-muted">Invite providers first. Approved providers will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {members.map((member) => (
            <div key={member.id} className="flex flex-col gap-3 rounded-lg border border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-text">{member.displayName ?? "Unnamed Provider"}</p>
                {member.user?.email ? <p className="text-xs text-muted">{member.user.email}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {member.lifecycleStatus ? <Badge variant={statusVariant(member.lifecycleStatus)}>{member.lifecycleStatus}</Badge> : null}
                {member.verificationStatus ? <Badge variant={statusVariant(member.verificationStatus)}>{member.verificationStatus}</Badge> : null}
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="ghost" size="sm" onClick={() => void refetch()}>
        Refresh members
      </Button>
    </div>
  );
}

function InviteRow({ invite, onRefresh }: { invite: OrgInvite; onRefresh: () => void }) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState("");
  const [approveInvite, { loading: approving }] = useMutation(APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const [rejectInvite, { loading: rejecting }] = useMutation(REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const normalizedStatus = invite.status.toUpperCase();
  const canReview = normalizedStatus === "ACCEPTED";

  async function handleApprove() {
    await approveInvite({ variables: { inviteId: invite.id } });
    onRefresh();
  }

  async function handleReject(event: FormEvent) {
    event.preventDefault();
    await rejectInvite({ variables: { inviteId: invite.id, reason: reason || undefined } });
    setShowRejectForm(false);
    setReason("");
    onRefresh();
  }

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text">{invite.invitedProvider?.displayName ?? invite.invitedEmail}</p>
            <Badge variant={statusVariant(invite.status)}>{invite.status}</Badge>
          </div>
          <p className="text-xs text-muted">
            {invite.invitedUser?.email ?? invite.invitedEmail} · Invited {formatDate(invite.createdAt)}
            {invite.expiresAt ? ` · Expires ${formatDate(invite.expiresAt)}` : ""}
          </p>
          {invite.acceptedAt ? <p className="text-xs text-muted">Accepted {formatDate(invite.acceptedAt)}</p> : null}
          {invite.reviewedAt ? <p className="text-xs text-muted">Reviewed {formatDate(invite.reviewedAt)}</p> : null}
          {invite.note ? <p className="text-xs italic text-muted">&quot;{invite.note}&quot;</p> : null}
        </div>

        {canReview ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={approving} onClick={() => void handleApprove()} className="gap-1.5 text-success">
              <Check className="size-3.5" />
              {approving ? "Approving..." : "Approve"}
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => setShowRejectForm((value) => !value)} className="gap-1.5 text-danger">
              <X className="size-3.5" />
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      {showRejectForm ? (
        <form onSubmit={(event) => void handleReject(event)} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Reason, optional" value={reason} onChange={(event) => setReason(event.target.value)} className="flex-1" />
          <Button type="submit" size="sm" disabled={rejecting}>{rejecting ? "Saving..." : "Confirm"}</Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setShowRejectForm(false)}>Cancel</Button>
        </form>
      ) : null}
    </div>
  );
}

export function OrganizationInvitesPageView({ organizationId }: { organizationId: string }) {
  const [filter, setFilter] = useState<InviteFilter>("pending");
  const { organization, loading } = useOrganization(organizationId);
  const { data, refetch } = useQuery<{ organizationProviderInvites: OrgInvite[] }>(ORGANIZATION_PROVIDER_INVITES_QUERY, {
    variables: { organizationId, status: filter || undefined },
    fetchPolicy: "network-only",
  });
  const invites = data?.organizationProviderInvites ?? [];

  if (loading) return <LoadingBlocks />;
  if (!organization) return <OrganizationNotFound />;

  return (
    <div className="space-y-6">
      <OrganizationPageHeader organization={organization} current="invites" />

      <div className="flex flex-wrap items-center gap-2">
        {(["pending", "accepted", "approved", "rejected", "expired", ""] as InviteFilter[]).map((nextFilter) => (
          <Button
            key={nextFilter || "all"}
            type="button"
            variant={filter === nextFilter ? "primary" : "secondary"}
            size="sm"
            onClick={() => {
              setFilter(nextFilter);
              void refetch({ organizationId, status: nextFilter || undefined });
            }}
          >
            {nextFilter === "" ? "All" : nextFilter.charAt(0).toUpperCase() + nextFilter.slice(1)}
          </Button>
        ))}
        <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>

      {invites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-5 py-8 text-center">
          <p className="text-sm font-medium text-text">No invites</p>
          <p className="mt-1 text-sm text-muted">{filter === "pending" ? "No pending invites at this time." : "No invites match this filter."}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {invites.map((invite) => (
            <InviteRow key={invite.id} invite={invite} onRefresh={() => void refetch()} />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrganizationSettingsPageView({ organizationId }: { organizationId: string }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [form, setForm] = useState({ name: "", type: "CLINIC", regulatoryId: "", parentOrgId: "" });
  const { organization, loading, data, refetch } = useOrganization(organizationId);
  const [updateOrg, { loading: updating }] = useMutation(UPDATE_ORGANIZATION_MUTATION);
  const [deactivateOrg, { loading: deactivating }] = useMutation(DEACTIVATE_ORGANIZATION_MUTATION);
  const organizations = data?.myConsultantOrganizations ?? [];

  useEffect(() => {
    if (!organization) return;
    setForm({
      name: organization.name,
      type: organization.type,
      regulatoryId: organization.regulatoryId ?? "",
      parentOrgId: organization.parentOrgId ?? "",
    });
  }, [organization]);

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    setAlert(null);

    try {
      await updateOrg({
        variables: {
          organizationId,
          data: {
            name: form.name.trim(),
            type: form.type,
            regulatoryId: form.regulatoryId.trim() || undefined,
            parentOrgId: form.parentOrgId || null,
          },
        },
      });
      await refetch();
      setAlert({ type: "success", message: "Organization settings saved." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  async function handleDeactivate() {
    setAlert(null);

    try {
      await deactivateOrg({ variables: { organizationId } });
      await refetch();
      setConfirmDeactivate(false);
      setAlert({ type: "success", message: "Organization deactivated." });
    } catch (error) {
      setAlert({ type: "error", message: mapOrgError(error) });
    }
  }

  if (loading) return <LoadingBlocks />;
  if (!organization) return <OrganizationNotFound />;

  return (
    <div className="space-y-6">
      <OrganizationPageHeader organization={organization} current="settings" />
      <AlertBanner alert={alert} onDismiss={() => setAlert(null)} />

      <div className="rounded-lg border border-border bg-surface p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-4">
          <OrganizationLogo
            orgId={organization.id}
            logoUrl={organization.logoUrl}
            orgName={organization.name}
            onSuccess={() => void refetch()}
            onError={(message) => setAlert({ type: "error", message })}
          />
          <div>
            <p className="text-sm font-semibold text-text">Organization logo</p>
            <p className="text-sm text-muted">Upload a logo used across organization-facing views.</p>
          </div>
        </div>

        <form onSubmit={(event) => void handleUpdate(event)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="editOrgName">Name <span className="text-danger">*</span></Label>
              <Input id="editOrgName" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editOrgType">Type <span className="text-danger">*</span></Label>
              <select
                id="editOrgType"
                className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              >
                {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editRegId">Regulatory ID</Label>
              <Input id="editRegId" placeholder="Optional" value={form.regulatoryId} onChange={(event) => setForm((current) => ({ ...current, regulatoryId: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="editParentOrgId">Parent organization</Label>
              <select
                id="editParentOrgId"
                className="flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={form.parentOrgId}
                onChange={(event) => setForm((current) => ({ ...current, parentOrgId: event.target.value }))}
              >
                <option value="">None, independent organization</option>
                {organizations
                  .filter((org) => org.id !== organizationId)
                  .map((org) => (
                    <option key={org.id} value={org.id}>{org.name} ({typeLabel(org.type)})</option>
                  ))}
              </select>
            </div>
          </div>
          <Button type="submit" disabled={updating}>{updating ? "Saving..." : "Save settings"}</Button>
        </form>
      </div>

      <div className="rounded-lg border border-danger/20 bg-danger/5 p-5">
        <p className="text-sm font-semibold text-danger">Deactivate organization</p>
        <p className="mt-1 text-sm text-muted">
          Deactivation prevents new bookings and hides the organization from the provider directory. Existing records are preserved.
        </p>
        {confirmDeactivate ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-danger">Confirm deactivation?</p>
            <button
              type="button"
              disabled={deactivating}
              onClick={() => void handleDeactivate()}
              className="inline-flex h-9 items-center rounded-lg bg-danger px-4 text-xs font-semibold text-white transition hover:bg-danger/90 disabled:opacity-50"
            >
              {deactivating ? "Deactivating..." : "Yes, deactivate"}
            </button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmDeactivate(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDeactivate(true)}
            className="mt-4 inline-flex h-9 items-center rounded-lg border border-danger/40 px-4 text-xs font-medium text-danger transition hover:bg-danger/10"
          >
            Deactivate organization
          </button>
        )}
      </div>
    </div>
  );
}
