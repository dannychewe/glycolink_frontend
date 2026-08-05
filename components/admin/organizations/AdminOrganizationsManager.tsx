"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Mail,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropZone } from "@/components/ui/file-drop-zone";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ORGANIZATION_TYPE_OPTIONS } from "@/lib/consultant/organization-graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

const ADMIN_ORGANIZATION_DETAIL_QUERY = gql`
  query AdminOrganizationDetail($organizationId: UUID!) {
    organization(organizationId: $organizationId) {
      id
      tenantId
      name
      type
      status
      regulatoryId
      parentOrgId
      logoUrl
      parentOrg {
        id
        name
        type
      }
    }
  }
`;

const SYSTEM_ORGANIZATIONS_QUERY = gql`
  query SystemOrganizations($page: Int, $limit: Int, $search: String, $type: String, $status: String, $tenantId: UUID) {
    systemOrganizations(page: $page, limit: $limit, search: $search, type: $type, status: $status, tenantId: $tenantId) {
      items {
        id
        tenantId
        name
        type
        status
        regulatoryId
        parentOrgId
        logoUrl
        parentOrg {
          id
          name
          type
        }
      }
      total
      page
      limit
    }
  }
`;

const ADMIN_UPDATE_ORGANIZATION_MUTATION = gql`
  mutation AdminUpdateOrganization($organizationId: UUID!, $data: OrganizationInput!) {
    updateOrganization(organizationId: $organizationId, data: $data) {
      organization {
        id
        name
        type
        status
        regulatoryId
        parentOrgId
        logoUrl
      }
    }
  }
`;

const ADMIN_DEACTIVATE_ORGANIZATION_MUTATION = gql`
  mutation AdminDeactivateOrganization($organizationId: UUID!) {
    deactivateOrganization(organizationId: $organizationId) {
      organization {
        id
        status
      }
    }
  }
`;

const ADMIN_ORGANIZATION_PROVIDERS_QUERY = gql`
  query AdminOrganizationProviders($organizationId: UUID!) {
    organizationProviders(organizationId: $organizationId) {
      id
      displayName
      lifecycleStatus
      verificationStatus
      organization {
        id
        name
        type
      }
      user {
        id
        email
      }
    }
  }
`;

const ADMIN_ORGANIZATION_INVITES_QUERY = gql`
  query AdminOrganizationInvites($organizationId: UUID!, $status: String) {
    organizationProviderInvites(organizationId: $organizationId, status: $status) {
      id
      status
      invitedEmail
      note
      organization {
        id
        name
      }
      inviterProvider {
        id
        displayName
      }
      invitedProvider {
        id
        displayName
      }
      invitedUser {
        id
        email
      }
      acceptedAt
      expiresAt
      reviewedAt
      createdAt
    }
  }
`;

const ADMIN_INVITE_PROVIDER_TO_ORGANIZATION_MUTATION = gql`
  mutation AdminInviteProviderToOrganization($organizationId: UUID!, $email: String!, $note: String) {
    inviteProviderToOrganization(organizationId: $organizationId, email: $email, note: $note) {
      invite {
        id
        status
        invitedEmail
        note
        expiresAt
        createdAt
      }
    }
  }
`;

const ADMIN_APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION = gql`
  mutation AdminApproveProviderOrganizationInvite($inviteId: UUID!) {
    approveProviderOrganizationInvite(inviteId: $inviteId) {
      invite {
        id
        status
        reviewedAt
      }
    }
  }
`;

const ADMIN_REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION = gql`
  mutation AdminRejectProviderOrganizationInvite($inviteId: UUID!, $reason: String) {
    rejectProviderOrganizationInvite(inviteId: $inviteId, reason: $reason) {
      invite {
        id
        status
        note
        reviewedAt
      }
    }
  }
`;

const ADMIN_UPLOAD_ORGANIZATION_LOGO_MUTATION = gql`
  mutation AdminUploadOrganizationLogo($organizationId: UUID!, $file: Upload!) {
    uploadOrganizationLogo(organizationId: $organizationId, file: $file) {
      organization {
        id
        name
        logoUrl
      }
    }
  }
`;

type AlertState = { type: "success" | "error"; message: string } | null;
type Tab = "detail" | "providers" | "invites";
type InviteStatus = "" | "pending" | "accepted" | "approved" | "rejected" | "expired";

type Organization = {
  id: string;
  tenantId: string;
  name: string;
  type: string;
  status: string;
  regulatoryId: string | null;
  parentOrgId: string | null;
  logoUrl: string | null;
  parentOrg: { id: string; name: string; type: string } | null;
};

type OrganizationListData = {
  systemOrganizations: {
    items: Organization[];
    total: number;
    page: number;
    limit: number;
  } | null;
};

type OrganizationProvider = {
  id: string;
  displayName: string | null;
  lifecycleStatus: string | null;
  verificationStatus: string | null;
  organization: { id: string; name: string; type: string } | null;
  user: { id: string; email: string } | null;
};

type OrganizationInvite = {
  id: string;
  status: string;
  invitedEmail: string;
  note: string | null;
  organization: { id: string; name: string } | null;
  inviterProvider: { id: string; displayName: string | null } | null;
  invitedProvider: { id: string; displayName: string | null } | null;
  invitedUser: { id: string; email: string } | null;
  acceptedAt: string | null;
  expiresAt: string | null;
  reviewedAt: string | null;
  createdAt: string;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Not reviewed";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(status: string | null | undefined) {
  const normalized = status?.toUpperCase();
  if (normalized === "ACTIVE" || normalized === "APPROVED" || normalized === "VERIFIED") return "success" as const;
  if (normalized === "PENDING" || normalized === "ACCEPTED" || normalized === "SUBMITTED") return "warning" as const;
  if (normalized === "INACTIVE" || normalized === "DEACTIVATED" || normalized === "REJECTED" || normalized === "EXPIRED" || normalized === "SUSPENDED") return "danger" as const;
  return "secondary" as const;
}

function InlineAlert({ alert, onDismiss }: Readonly<{ alert: AlertState; onDismiss: () => void }>) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isError ? "border-danger/30 bg-danger/5 text-danger" : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? <AlertCircle className="mt-0.5 size-4 shrink-0" /> : <CheckCircle className="mt-0.5 size-4 shrink-0" />}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function SystemOrganizationsTable() {
  const [filters, setFilters] = useState({
    searchInput: "",
    search: "",
    type: "",
    status: "",
    tenantId: "",
    page: 1,
    limit: 20,
  });
  const { data, loading, error } = useQuery<OrganizationListData>(SYSTEM_ORGANIZATIONS_QUERY, {
    variables: {
      page: filters.page,
      limit: filters.limit,
      search: filters.search || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      tenantId: filters.tenantId || undefined,
    },
    fetchPolicy: "cache-and-network",
  });

  const organizations = data?.systemOrganizations?.items ?? [];
  const total = data?.systemOrganizations?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setFilters((current) => ({
      ...current,
      search: current.searchInput.trim(),
      page: 1,
    }));
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-primary" />
              System Organizations
            </CardTitle>
            <p className="mt-2 text-sm text-muted">
              Platform-wide organization visibility across tenants.
            </p>
          </div>
          <form onSubmit={handleSearch} className="flex w-full gap-2 xl:max-w-md">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
              <Input
                value={filters.searchInput}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, searchInput: event.target.value }))
                }
                placeholder="Search organizations"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="system-org-type">Type</Label>
            <select
              id="system-org-type"
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={filters.type}
              onChange={(event) =>
                setFilters((current) => ({ ...current, type: event.target.value, page: 1 }))
              }
            >
              <option value="">All types</option>
              {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-org-status">Status</Label>
            <select
              id="system-org-status"
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
              }
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-org-tenant">Tenant ID</Label>
            <Input
              id="system-org-tenant"
              value={filters.tenantId}
              placeholder="Optional tenant UUID"
              onChange={(event) =>
                setFilters((current) => ({ ...current, tenantId: event.target.value, page: 1 }))
              }
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
            {getGraphQLErrorMessage(error, "Unable to load system organizations.")}
          </p>
        ) : null}
        {loading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
        {organizations.length === 0 && !loading ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            No organizations match the current filters.
          </p>
        ) : null}
        {organizations.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[1.2fr_0.8fr_0.7fr_1fr_0.9fr_0.45fr] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted xl:grid">
              <span>Name</span>
              <span>Type</span>
              <span>Status</span>
              <span>Tenant</span>
              <span>Parent</span>
              <span className="text-right">Action</span>
            </div>
            <div className="divide-y divide-border">
              {organizations.map((organization) => (
                <div
                  key={organization.id}
                  className="grid gap-3 px-4 py-4 text-sm xl:grid-cols-[1.2fr_0.8fr_0.7fr_1fr_0.9fr_0.45fr] xl:items-center xl:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">{organization.name}</p>
                    <p className="text-xs text-muted">{organization.id}</p>
                  </div>
                  <Badge variant="secondary">{formatLabel(organization.type)}</Badge>
                  <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge>
                  <p className="truncate text-muted">{organization.tenantId}</p>
                  <p className="truncate text-muted">{organization.parentOrg?.name ?? "None"}</p>
                  <div className="flex justify-start xl:justify-end">
                    <Button href={`/admin/organizations/${organization.id}`} size="sm" variant="secondary">
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Page {filters.page} of {totalPages} · {total} total organizations
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={filters.page <= 1}
              onClick={() => setFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={filters.page >= totalPages}
              onClick={() =>
                setFilters((current) => ({ ...current, page: Math.min(totalPages, current.page + 1) }))
              }
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationDetailPanel({
  organizationId,
  organization,
  loading,
  setAlert,
  refetch,
}: Readonly<{
  organizationId: string;
  organization: Organization | null;
  loading: boolean;
  setAlert: (alert: AlertState) => void;
  refetch: () => Promise<unknown>;
}>) {
  const [form, setForm] = useState({
    name: "",
    type: "CLINIC",
    status: "",
    regulatoryId: "",
    parentOrgId: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [updateOrganization, { loading: updating }] = useMutation(ADMIN_UPDATE_ORGANIZATION_MUTATION);
  const [deactivateOrganization, { loading: deactivating }] = useMutation(ADMIN_DEACTIVATE_ORGANIZATION_MUTATION);
  const [uploadLogo, { loading: uploadingLogo }] = useMutation(ADMIN_UPLOAD_ORGANIZATION_LOGO_MUTATION);

  useEffect(() => {
    if (!organization) return;
    setForm({
      name: organization.name,
      type: organization.type,
      status: organization.status,
      regulatoryId: organization.regulatoryId ?? "",
      parentOrgId: organization.parentOrgId ?? "",
    });
  }, [organization]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await updateOrganization({
        variables: {
          organizationId,
          data: {
            name: form.name,
            type: form.type,
            status: form.status || undefined,
            regulatoryId: form.regulatoryId.trim() || undefined,
            parentOrgId: form.parentOrgId.trim() || undefined,
          },
        },
      });
      await refetch();
      setAlert({ type: "success", message: "Organization updated." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to update organization.") });
    }
  }

  async function handleDeactivate() {
    setAlert(null);
    try {
      await deactivateOrganization({ variables: { organizationId } });
      await refetch();
      setAlert({ type: "success", message: "Organization deactivated." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to deactivate organization.") });
    }
  }

  async function handleUploadLogo() {
    if (!logoFile) return;
    setAlert(null);
    try {
      await uploadLogo({ variables: { organizationId, file: logoFile } });
      setLogoFile(null);
      await refetch();
      setAlert({ type: "success", message: "Organization logo uploaded." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to upload logo.") });
    }
  }

  if (loading && !organization) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-border/50" />
        ))}
      </div>
    );
  }

  if (!organization) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Load an organization to edit details.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.4fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImagePlus className="size-5 text-primary" />
            Logo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-background">
            {organization.logoUrl ? (
              <div className="relative aspect-video">
                <Image
                  src={organization.logoUrl}
                  alt={organization.name}
                  fill
                  className="object-cover"
                  sizes="420px"
                />
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center text-3xl font-semibold text-primary">
                {organization.name.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <FileDropZone
            value={logoFile}
            onChange={setLogoFile}
            accept="image/*"
            hint="PNG, JPG, or WEBP"
            loading={uploadingLogo}
            id="organization-logo"
          />
          <Button type="button" disabled={!logoFile || uploadingLogo} onClick={() => void handleUploadLogo()}>
            <ImagePlus className="size-4" />
            {uploadingLogo ? "Uploading..." : "Upload Logo"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            Edit Organization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Name</Label>
                <Input
                  id="org-name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-type">Type</Label>
                <select
                  id="org-type"
                  className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                >
                  {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-status">Status</Label>
                <Input
                  id="org-status"
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regulatory-id">Regulatory ID</Label>
                <Input
                  id="regulatory-id"
                  value={form.regulatoryId}
                  onChange={(event) => setForm((current) => ({ ...current, regulatoryId: event.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="parent-org-id">Parent Organization ID</Label>
                <Input
                  id="parent-org-id"
                  value={form.parentOrgId}
                  onChange={(event) => setForm((current) => ({ ...current, parentOrgId: event.target.value }))}
                  placeholder="Optional parent organization UUID"
                />
              </div>
            </div>

            <div className="grid gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm md:grid-cols-2">
              <p className="text-muted">Tenant: <span className="text-text">{organization.tenantId}</span></p>
              <p className="text-muted">Parent: <span className="text-text">{organization.parentOrg?.name ?? "None"}</span></p>
              <div className="flex items-center gap-2 text-muted">
                <span>Current status:</span>
                <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge>
              </div>
              <p className="text-muted">Organization ID: <span className="text-text">{organization.id}</span></p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={updating}>
                <Save className="size-4" />
                {updating ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={deactivating}
                onClick={() => void handleDeactivate()}
              >
                <Trash2 className="size-4" />
                {deactivating ? "Deactivating..." : "Deactivate"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function OrganizationProvidersPanel({ organizationId }: Readonly<{ organizationId: string }>) {
  const { data, loading, error } = useQuery<{ organizationProviders: OrganizationProvider[] }>(
    ADMIN_ORGANIZATION_PROVIDERS_QUERY,
    { variables: { organizationId }, skip: !organizationId, fetchPolicy: "cache-and-network" },
  );
  const providers = data?.organizationProviders ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          Organization Providers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{getGraphQLErrorMessage(error, "Unable to load providers.")}</p> : null}
        {loading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
        {!loading && providers.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            No providers found for this organization.
          </p>
        ) : null}
        <div className="overflow-hidden rounded-xl border border-border">
          {providers.map((provider) => (
            <div key={provider.id} className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[1.2fr_1fr_0.9fr] md:items-center">
              <div>
                <p className="text-sm font-semibold text-text">{provider.displayName ?? "Unnamed provider"}</p>
                <p className="text-xs text-muted">{provider.user?.email ?? "No email"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(provider.lifecycleStatus)}>{formatLabel(provider.lifecycleStatus)}</Badge>
                <Badge variant={statusVariant(provider.verificationStatus)}>{formatLabel(provider.verificationStatus)}</Badge>
              </div>
              <p className="text-sm text-muted">{provider.organization?.name ?? "No organization"}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function OrganizationInvitesPanel({
  organizationId,
  setAlert,
}: Readonly<{
  organizationId: string;
  setAlert: (alert: AlertState) => void;
}>) {
  const [status, setStatus] = useState<InviteStatus>("pending");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [rejectInviteId, setRejectInviteId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const { data, loading, error, refetch } = useQuery<{ organizationProviderInvites: OrganizationInvite[] }>(
    ADMIN_ORGANIZATION_INVITES_QUERY,
    {
      variables: { organizationId, status: status || undefined },
      skip: !organizationId,
      fetchPolicy: "cache-and-network",
    },
  );
  const [inviteProvider, { loading: inviting }] = useMutation(ADMIN_INVITE_PROVIDER_TO_ORGANIZATION_MUTATION);
  const [approveInvite, { loading: approving }] = useMutation(ADMIN_APPROVE_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const [rejectInvite, { loading: rejecting }] = useMutation(ADMIN_REJECT_PROVIDER_ORGANIZATION_INVITE_MUTATION);
  const invites = data?.organizationProviderInvites ?? [];

  async function handleInvite(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await inviteProvider({
        variables: { organizationId, email: email.trim(), note: note.trim() || undefined },
      });
      setEmail("");
      setNote("");
      await refetch();
      setAlert({ type: "success", message: "Provider invite created." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to invite provider.") });
    }
  }

  async function handleApprove(inviteId: string) {
    setAlert(null);
    try {
      await approveInvite({ variables: { inviteId } });
      await refetch();
      setAlert({ type: "success", message: "Invite approved." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to approve invite.") });
    }
  }

  async function handleReject(event: FormEvent) {
    event.preventDefault();
    if (!rejectInviteId) return;
    setAlert(null);
    try {
      await rejectInvite({
        variables: { inviteId: rejectInviteId, reason: rejectReason.trim() || undefined },
      });
      setRejectInviteId(null);
      setRejectReason("");
      await refetch();
      setAlert({ type: "success", message: "Invite rejected." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to reject invite.") });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            Invite Provider
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleInvite(event)} className="grid gap-4 md:grid-cols-[1fr_1.2fr_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="provider-email">Provider email</Label>
              <Input
                id="provider-email"
                type="email"
                value={email}
                placeholder="doctor@example.com"
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-note">Note</Label>
              <Input
                id="invite-note"
                value={note}
                placeholder="Optional invite note"
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <Button type="submit" disabled={inviting}>
              <Mail className="size-4" />
              {inviting ? "Inviting..." : "Invite"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Organization Invites</CardTitle>
              <p className="mt-2 text-sm text-muted">Review pending provider organization invites.</p>
            </div>
            <Badge variant="secondary">{invites.length}</Badge>
          </div>
          <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
            {(["pending", "accepted", "approved", "rejected", "expired", ""] as InviteStatus[]).map((item) => (
              <button
                key={item || "all"}
                type="button"
                onClick={() => setStatus(item)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  status === item ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                )}
              >
                {item || "all"}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {error ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">Unable to load invites.</p> : null}
          {loading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
          {!loading && invites.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No invites found.
            </p>
          ) : null}
          {invites.map((invite) => {
            const normalizedStatus = invite.status.toLowerCase();
            const isAccepted = normalizedStatus === "accepted";
            const isOpen = normalizedStatus === "pending" || normalizedStatus === "accepted";
            return (
              <div key={invite.id} className="rounded-xl border border-border bg-surface px-4 py-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-text">{invite.invitedProvider?.displayName ?? invite.invitedEmail}</p>
                      <Badge variant={statusVariant(invite.status)}>{formatLabel(invite.status)}</Badge>
                    </div>
                    <p className="text-xs text-muted">
                      Invited by {invite.inviterProvider?.displayName ?? "Unknown"} · {formatDate(invite.createdAt)}
                    </p>
                    <p className="text-xs text-muted">
                      {invite.invitedUser?.email ?? invite.invitedEmail}
                      {invite.expiresAt ? ` · Expires ${formatDate(invite.expiresAt)}` : ""}
                    </p>
                    {invite.acceptedAt ? (
                      <p className="text-xs text-muted">Accepted: {formatDate(invite.acceptedAt)}</p>
                    ) : null}
                    {invite.note ? (
                      <p className="text-xs italic text-muted">&quot;{invite.note}&quot;</p>
                    ) : null}
                    <p className="text-xs text-muted">Reviewed: {formatDate(invite.reviewedAt)}</p>
                  </div>
                  {isOpen ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" disabled={approving || !isAccepted} onClick={() => void handleApprove(invite.id)}>
                        <Check className="size-4" />
                        Approve
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => setRejectInviteId(invite.id)}>
                        <X className="size-4" />
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </div>
                {rejectInviteId === invite.id ? (
                  <form onSubmit={(event) => void handleReject(event)} className="mt-3 space-y-3 rounded-xl border border-border bg-background p-3">
                    <div className="space-y-2">
                      <Label htmlFor={`reject-${invite.id}`}>Reason</Label>
                      <Textarea
                        id={`reject-${invite.id}`}
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder="Optional rejection reason"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={rejecting}>Confirm Reject</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setRejectInviteId(null)}>Cancel</Button>
                    </div>
                  </form>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export function AdminOrganizationsManager() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Organizations</h1>
        <p className="max-w-3xl text-sm text-muted">
          Edit organizations, upload logos, manage providers, and review organization invites.
        </p>
      </header>

      <SystemOrganizationsTable />
    </div>
  );
}

export function AdminOrganizationDetailView({
  organizationId,
}: Readonly<{
  organizationId: string;
}>) {
  const [activeTab, setActiveTab] = useState<Tab>("detail");
  const [alert, setAlert] = useState<AlertState>(null);
  const { data, loading, error, refetch } = useQuery<{ organization: Organization | null }>(
    ADMIN_ORGANIZATION_DETAIL_QUERY,
    {
      variables: { organizationId },
      fetchPolicy: "cache-and-network",
    },
  );
  const organization = data?.organization ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-text sm:text-4xl">
              {organization?.name ?? "Organization Detail"}
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Edit organization details, upload logos, manage providers, and review invites.
            </p>
          </div>
          <Button href="/admin/organizations" variant="secondary">
            Back to Organizations
          </Button>
        </div>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          Unable to load organization detail.
        </div>
      ) : null}

      {organization ? (
        <Card>
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-text">{organization.name}</h2>
                <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge>
                <Badge variant="secondary">{formatLabel(organization.type)}</Badge>
              </div>
              <p className="text-sm text-muted">
                {organization.regulatoryId ?? "No regulatory ID"} · Tenant {organization.tenantId}
              </p>
            </div>
            <div className="flex w-fit gap-1 rounded-xl border border-border bg-surface p-1">
              {[
                { key: "detail", label: "Detail" },
                { key: "providers", label: "Providers" },
                { key: "invites", label: "Invites" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as Tab)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-muted hover:text-text",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "detail" ? (
        <OrganizationDetailPanel
          organizationId={organizationId}
          organization={organization}
          loading={loading}
          setAlert={setAlert}
          refetch={refetch}
        />
      ) : null}

      {activeTab === "providers" && organizationId ? (
        <OrganizationProvidersPanel organizationId={organizationId} />
      ) : null}

      {activeTab === "invites" && organizationId ? (
        <OrganizationInvitesPanel organizationId={organizationId} setAlert={setAlert} />
      ) : null}
    </div>
  );
}
