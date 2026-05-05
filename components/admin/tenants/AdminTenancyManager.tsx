"use client";

import { FormEvent, useEffect, useState } from "react";
import { gql, useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ORGANIZATION_TYPE_OPTIONS } from "@/lib/consultant/organization-graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

const ADMIN_TENANTS_QUERY = gql`
  query AdminTenants {
    myTenants {
      id
      name
      slug
      status
    }
  }
`;

const SYSTEM_TENANTS_QUERY = gql`
  query SystemTenants($page: Int, $limit: Int, $search: String, $status: String) {
    systemTenants(page: $page, limit: $limit, search: $search, status: $status) {
      items {
        id
        name
        slug
        status
      }
      total
      page
      limit
    }
  }
`;

const SYSTEM_UPDATE_TENANT_STATUS_MUTATION = gql`
  mutation SystemUpdateTenantStatus($tenantId: UUID!, $status: String!) {
    systemUpdateTenantStatus(tenantId: $tenantId, status: $status) {
      tenant {
        id
        name
        status
      }
    }
  }
`;

const ADMIN_CREATE_TENANT_MUTATION = gql`
  mutation AdminCreateTenant($name: String!) {
    createTenant(name: $name) {
      tenant {
        id
        name
        slug
        status
      }
    }
  }
`;

const ADMIN_ASSIGN_USER_TO_TENANT_MUTATION = gql`
  mutation AdminAssignUserToTenant($userId: UUID!, $tenantId: UUID!, $role: String!) {
    assignUserToTenant(userId: $userId, tenantId: $tenantId, role: $role) {
      membership {
        id
        tenantRole
        status
        tenant {
          id
          name
        }
        user {
          id
          email
        }
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
      }
      total
      page
      limit
    }
  }
`;

const ADMIN_TENANT_ORGANIZATIONS_QUERY = gql`
  query AdminTenantOrganizations($tenantId: UUID!) {
    myOrganizations(tenantId: $tenantId) {
      id
      name
      type
      status
      regulatoryId
      parentOrgId
      logoUrl
    }
  }
`;

const ADMIN_CREATE_ORGANIZATION_MUTATION = gql`
  mutation AdminCreateOrganization($tenantId: UUID!, $name: String!, $type: String!) {
    createOrganization(tenantId: $tenantId, name: $name, type: $type) {
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

type AlertState = { type: "success" | "error"; message: string } | null;

type Tenant = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

type Organization = {
  id: string;
  tenantId?: string;
  name: string;
  type: string;
  status: string;
  regulatoryId: string | null;
  parentOrgId: string | null;
  logoUrl: string | null;
};

type AdminOrganizationsData = {
  systemOrganizations: {
    items: Organization[];
    total: number;
    page: number;
    limit: number;
  } | null;
};

const ROLE_OPTIONS = ["ADMIN", "TENANT_ADMIN", "ORG_ADMIN", "MEMBER"] as const;
const TENANT_STATUS_OPTIONS = ["active", "inactive", "suspended", "archived"] as const;

function statusVariant(status: string | null | undefined) {
  const normalized = status?.toUpperCase();
  if (normalized === "ACTIVE" || normalized === "APPROVED") return "success" as const;
  if (normalized === "PENDING") return "warning" as const;
  if (normalized === "INACTIVE" || normalized === "DEACTIVATED" || normalized === "SUSPENDED") {
    return "danger" as const;
  }
  return "secondary" as const;
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function TenantControls({
  activeTenantId,
  setActiveTenantId,
  setAlert,
}: Readonly<{
  activeTenantId: string;
  setActiveTenantId: (id: string) => void;
  setAlert: (alert: AlertState) => void;
}>) {
  const [tenantName, setTenantName] = useState("");
  const [systemFilters, setSystemFilters] = useState({
    searchInput: "",
    search: "",
    status: "",
    page: 1,
    limit: 10,
  });
  const [assignment, setAssignment] = useState({
    userId: "",
    tenantId: activeTenantId,
    role: "TENANT_ADMIN",
  });
  const { data, loading, error } = useQuery<{ myTenants: Tenant[] }>(ADMIN_TENANTS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const {
    data: systemTenantsData,
    loading: systemTenantsLoading,
    error: systemTenantsError,
    refetch: refetchSystemTenants,
  } = useQuery<{
    systemTenants: {
      items: Tenant[];
      total: number;
      page: number;
      limit: number;
    } | null;
  }>(SYSTEM_TENANTS_QUERY, {
    variables: {
      page: systemFilters.page,
      limit: systemFilters.limit,
      search: systemFilters.search || undefined,
      status: systemFilters.status || undefined,
    },
    fetchPolicy: "cache-and-network",
  });
  const [createTenant, { loading: creatingTenant }] = useMutation(ADMIN_CREATE_TENANT_MUTATION);
  const [updateTenantStatus, { loading: updatingTenantStatus }] = useMutation(
    SYSTEM_UPDATE_TENANT_STATUS_MUTATION,
  );
  const [assignUserToTenant, { loading: assigningUser }] = useMutation(
    ADMIN_ASSIGN_USER_TO_TENANT_MUTATION,
  );
  const tenants = data?.myTenants ?? [];
  const systemTenants = systemTenantsData?.systemTenants?.items ?? [];
  const systemTenantTotal = systemTenantsData?.systemTenants?.total ?? 0;
  const systemTenantTotalPages = Math.max(1, Math.ceil(systemTenantTotal / systemFilters.limit));

  useEffect(() => {
    setAssignment((current) => ({ ...current, tenantId: activeTenantId }));
  }, [activeTenantId]);

  async function handleCreateTenant(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      const result = await createTenant({
        variables: { name: tenantName },
        refetchQueries: [ADMIN_TENANTS_QUERY],
      });
      const tenantId = result.data?.createTenant?.tenant?.id;
      if (tenantId) setActiveTenantId(tenantId);
      setTenantName("");
      setAlert({ type: "success", message: "Tenant created." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to create tenant.") });
    }
  }

  function handleSystemTenantSearch(event: FormEvent) {
    event.preventDefault();
    setSystemFilters((current) => ({
      ...current,
      search: current.searchInput.trim(),
      page: 1,
    }));
  }

  async function handleTenantStatusChange(tenantId: string, status: string) {
    setAlert(null);
    try {
      await updateTenantStatus({
        variables: { tenantId, status },
      });
      await refetchSystemTenants();
      setAlert({ type: "success", message: "Tenant status updated." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to update tenant status.") });
    }
  }

  async function handleAssignUser(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await assignUserToTenant({
        variables: {
          userId: assignment.userId,
          tenantId: assignment.tenantId,
          role: assignment.role,
        },
      });
      setAssignment((current) => ({ ...current, userId: "" }));
      setAlert({ type: "success", message: "User assigned to tenant." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to assign user to tenant.") });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                System Tenants
              </CardTitle>
              <p className="mt-2 text-sm text-muted">
                Platform-wide tenant table for system administrators.
              </p>
            </div>
            <form onSubmit={handleSystemTenantSearch} className="flex w-full gap-2 xl:max-w-md">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={systemFilters.searchInput}
                  onChange={(event) =>
                    setSystemFilters((current) => ({ ...current, searchInput: event.target.value }))
                  }
                  placeholder="Search tenants"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>
          <div className="space-y-2">
            <Label htmlFor="system-tenant-status">Status</Label>
            <select
              id="system-tenant-status"
              className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              value={systemFilters.status}
              onChange={(event) =>
                setSystemFilters((current) => ({
                  ...current,
                  status: event.target.value,
                  page: 1,
                }))
              }
            >
              <option value="">All statuses</option>
              {TENANT_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {systemTenantsError ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{getGraphQLErrorMessage(systemTenantsError, "Unable to load system tenants.")}</p> : null}
          {systemTenantsLoading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="hidden grid-cols-[1.2fr_0.9fr_0.8fr_1fr_0.6fr] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted lg:grid">
              <span>Name</span>
              <span>Slug</span>
              <span>Status</span>
              <span>Update Status</span>
              <span className="text-right">Context</span>
            </div>
            <div className="divide-y divide-border">
              {systemTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.2fr_0.9fr_0.8fr_1fr_0.6fr] lg:items-center lg:gap-4"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-text">{tenant.name}</p>
                    <p className="text-xs text-muted">{tenant.id}</p>
                  </div>
                  <p className="text-muted">{tenant.slug}</p>
                  <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                  <select
                    className="flex h-10 rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={tenant.status}
                    disabled={updatingTenantStatus}
                    onChange={(event) => void handleTenantStatusChange(tenant.id, event.target.value)}
                  >
                    {TENANT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {formatLabel(status)}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-start lg:justify-end">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setActiveTenantId(tenant.id)}>
                      Use
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {!systemTenantsLoading && systemTenants.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
              No system tenants match the current filters.
            </p>
          ) : null}
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              Page {systemFilters.page} of {systemTenantTotalPages} · {systemTenantTotal} total tenants
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={systemFilters.page <= 1}
                onClick={() =>
                  setSystemFilters((current) => ({ ...current, page: Math.max(1, current.page - 1) }))
                }
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={systemFilters.page >= systemTenantTotalPages}
                onClick={() =>
                  setSystemFilters((current) => ({
                    ...current,
                    page: Math.min(systemTenantTotalPages, current.page + 1),
                  }))
                }
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Tenant Memberships</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{getGraphQLErrorMessage(error, "Unable to load my tenants.")}</p> : null}
            {loading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
            {!loading && tenants.length === 0 ? <p className="text-sm text-muted">No tenant memberships available.</p> : null}
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => setActiveTenantId(tenant.id)}
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-left transition",
                  activeTenantId === tenant.id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{tenant.name}</p>
                    <p className="text-xs text-muted">{tenant.slug}</p>
                  </div>
                  <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create Tenant</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleCreateTenant(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant-name">Tenant name</Label>
              <Input
                id="tenant-name"
                value={tenantName}
                onChange={(event) => setTenantName(event.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={creatingTenant}>
              <Plus className="size-4" />
              {creatingTenant ? "Creating..." : "Create Tenant"}
            </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="size-5 text-primary" />
              Assign User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(event) => void handleAssignUser(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assign-user-id">User ID</Label>
              <Input
                id="assign-user-id"
                value={assignment.userId}
                placeholder="User UUID"
                onChange={(event) =>
                  setAssignment((current) => ({ ...current, userId: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assign-tenant-id">Tenant ID</Label>
              <Input
                id="assign-tenant-id"
                value={assignment.tenantId}
                placeholder="Tenant UUID"
                onChange={(event) =>
                  setAssignment((current) => ({ ...current, tenantId: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenant-role">Role</Label>
              <select
                id="tenant-role"
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={assignment.role}
                onChange={(event) =>
                  setAssignment((current) => ({ ...current, role: event.target.value }))
                }
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={assigningUser}>
              <UserPlus className="size-4" />
              {assigningUser ? "Assigning..." : "Assign User"}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrganizationEditor({
  organization,
  onClose,
  setAlert,
  refetchList,
}: Readonly<{
  organization: Organization;
  onClose: () => void;
  setAlert: (alert: AlertState) => void;
  refetchList: () => Promise<unknown>;
}>) {
  const [form, setForm] = useState({
    name: organization.name,
    type: organization.type,
    status: organization.status,
    regulatoryId: organization.regulatoryId ?? "",
    parentOrgId: organization.parentOrgId ?? "",
  });
  const [updateOrganization, { loading: updating }] = useMutation(ADMIN_UPDATE_ORGANIZATION_MUTATION);
  const [deactivateOrganization, { loading: deactivating }] = useMutation(
    ADMIN_DEACTIVATE_ORGANIZATION_MUTATION,
  );

  async function handleUpdate(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await updateOrganization({
        variables: {
          organizationId: organization.id,
          data: {
            name: form.name,
            type: form.type,
            status: form.status || undefined,
            regulatoryId: form.regulatoryId.trim() || undefined,
            parentOrgId: form.parentOrgId.trim() || undefined,
          },
        },
      });
      await refetchList();
      setAlert({ type: "success", message: "Organization updated." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to update organization.") });
    }
  }

  async function handleDeactivate() {
    setAlert(null);
    try {
      await deactivateOrganization({ variables: { organizationId: organization.id } });
      await refetchList();
      setAlert({ type: "success", message: "Organization deactivated." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to deactivate organization.") });
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Edit Organization</CardTitle>
          <p className="mt-2 text-sm text-muted">{organization.id}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" />
          Close
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleUpdate(event)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-org-name">Name</Label>
              <Input
                id="edit-org-name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-org-type">Type</Label>
              <select
                id="edit-org-type"
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              <Label htmlFor="edit-org-status">Status</Label>
              <Input
                id="edit-org-status"
                value={form.status}
                onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reg-id">Regulatory ID</Label>
              <Input
                id="edit-reg-id"
                value={form.regulatoryId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, regulatoryId: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-parent-id">Parent organization ID</Label>
              <Input
                id="edit-parent-id"
                value={form.parentOrgId}
                onChange={(event) =>
                  setForm((current) => ({ ...current, parentOrgId: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={updating}>
              <Save className="size-4" />
              {updating ? "Saving..." : "Save"}
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
  );
}

function OrganizationsPanel({
  activeTenantId,
  setAlert,
}: Readonly<{
  activeTenantId: string;
  setAlert: (alert: AlertState) => void;
}>) {
  const [filters, setFilters] = useState({
    searchInput: "",
    search: "",
    type: "",
    status: "",
    tenantId: "",
    page: 1,
    limit: 10,
  });
  const [tenantLookupId, setTenantLookupId] = useState(activeTenantId);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [createForm, setCreateForm] = useState({
    tenantId: activeTenantId,
    name: "",
    type: "CLINIC",
  });

  useEffect(() => {
    setTenantLookupId(activeTenantId);
    setCreateForm((current) => ({ ...current, tenantId: activeTenantId }));
  }, [activeTenantId]);

  const {
    data: adminOrgsData,
    loading: adminOrgsLoading,
    error: adminOrgsError,
    refetch: refetchAdminOrganizations,
  } = useQuery<AdminOrganizationsData>(SYSTEM_ORGANIZATIONS_QUERY, {
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

  const {
    data: tenantOrgsData,
    loading: tenantOrgsLoading,
    error: tenantOrgsError,
    refetch: refetchTenantOrganizations,
  } = useQuery<{ myOrganizations: Organization[] }>(ADMIN_TENANT_ORGANIZATIONS_QUERY, {
    variables: { tenantId: tenantLookupId },
    skip: !tenantLookupId,
    fetchPolicy: "cache-and-network",
  });

  const [createOrganization, { loading: creatingOrganization }] = useMutation(
    ADMIN_CREATE_ORGANIZATION_MUTATION,
  );

  const adminOrganizations = adminOrgsData?.systemOrganizations?.items ?? [];
  const total = adminOrgsData?.systemOrganizations?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / filters.limit));
  const tenantOrganizations = tenantOrgsData?.myOrganizations ?? [];

  async function refetchLists() {
    await Promise.all([
      refetchAdminOrganizations(),
      tenantLookupId ? refetchTenantOrganizations() : Promise.resolve(null),
    ]);
  }

  function handleFilterSubmit(event: FormEvent) {
    event.preventDefault();
    setFilters((current) => ({ ...current, search: current.searchInput.trim(), page: 1 }));
  }

  async function handleCreateOrganization(event: FormEvent) {
    event.preventDefault();
    setAlert(null);
    try {
      await createOrganization({
        variables: {
          tenantId: createForm.tenantId,
          name: createForm.name,
          type: createForm.type,
        },
      });
      setCreateForm((current) => ({ ...current, name: "", type: "CLINIC" }));
      await refetchLists();
      setAlert({ type: "success", message: "Organization created." });
    } catch (error) {
      setAlert({ type: "error", message: getGraphQLErrorMessage(error, "Unable to create organization.") });
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(event) => void handleCreateOrganization(event)} className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
            <div className="space-y-2">
              <Label htmlFor="create-org-tenant">Tenant ID</Label>
              <Input
                id="create-org-tenant"
                value={createForm.tenantId}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, tenantId: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-org-name">Name</Label>
              <Input
                id="create-org-name"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-org-type">Type</Label>
              <select
                id="create-org-type"
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                value={createForm.type}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, type: event.target.value }))
                }
              >
                {ORGANIZATION_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={creatingOrganization}>
              <Plus className="size-4" />
              {creatingOrganization ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <CardTitle>System Organizations</CardTitle>
              <p className="mt-2 text-sm text-muted">
                Platform-wide organization search through `systemOrganizations`.
              </p>
            </div>
            <form onSubmit={handleFilterSubmit} className="flex w-full gap-2 xl:max-w-md">
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
              <Label htmlFor="org-type-filter">Type</Label>
              <select
                id="org-type-filter"
                className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
              <Label htmlFor="org-status-filter">Status</Label>
              <Input
                id="org-status-filter"
                value={filters.status}
                placeholder="e.g. ACTIVE"
                onChange={(event) =>
                  setFilters((current) => ({ ...current, status: event.target.value, page: 1 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-tenant-filter">Tenant ID</Label>
              <Input
                id="org-tenant-filter"
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
          {adminOrgsError ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{getGraphQLErrorMessage(adminOrgsError, "Unable to load admin organizations.")}</p> : null}
          {adminOrgsLoading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
          <OrganizationTable
            organizations={adminOrganizations}
            emptyLabel="No organizations match the current filters."
            onSelect={setSelectedOrganization}
          />
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

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Tenant Organizations</CardTitle>
            <p className="mt-2 text-sm text-muted">
              Uses `myOrganizations` when the UI already has a specific tenant id.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <Input
              value={tenantLookupId}
              placeholder="Tenant UUID"
              onChange={(event) => setTenantLookupId(event.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!tenantLookupId.trim()}
              onClick={() => void refetchTenantOrganizations()}
            >
              Load
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {tenantOrgsError ? <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">{getGraphQLErrorMessage(tenantOrgsError, "Unable to load tenant organizations.")}</p> : null}
          {tenantOrgsLoading ? <div className="h-20 animate-pulse rounded-xl bg-border/50" /> : null}
          <OrganizationTable
            organizations={tenantOrganizations}
            emptyLabel="No organizations visible for this tenant."
            onSelect={setSelectedOrganization}
          />
        </CardContent>
      </Card>

      {selectedOrganization ? (
        <OrganizationEditor
          organization={selectedOrganization}
          onClose={() => setSelectedOrganization(null)}
          setAlert={setAlert}
          refetchList={refetchLists}
        />
      ) : null}
    </div>
  );
}

function OrganizationTable({
  organizations,
  emptyLabel,
  onSelect,
}: Readonly<{
  organizations: Organization[];
  emptyLabel: string;
  onSelect: (organization: Organization) => void;
}>) {
  if (organizations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="hidden grid-cols-[1.25fr_0.8fr_0.8fr_1fr_0.45fr] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted lg:grid">
        <span>Name</span>
        <span>Type</span>
        <span>Status</span>
        <span>Regulatory</span>
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-border">
        {organizations.map((organization) => (
          <div
            key={organization.id}
            className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr_0.45fr] lg:items-center lg:gap-4"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-text">{organization.name}</p>
              <p className="text-xs text-muted">{organization.id}</p>
            </div>
            <Badge variant="secondary">{formatLabel(organization.type)}</Badge>
            <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge>
            <p className="truncate text-muted">{organization.regulatoryId ?? "Not set"}</p>
            <div className="flex justify-start lg:justify-end">
              <Button type="button" size="sm" variant="secondary" onClick={() => onSelect(organization)}>
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminTenancyManager() {
  const [activeTenantId, setActiveTenantId] = useState("");
  const [alert, setAlert] = useState<AlertState>(null);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Tenancy</h1>
        <p className="max-w-3xl text-sm text-muted">
          Manage tenants, assign tenant users, and administer organizations in the active or selected tenant.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <TenantControls
        activeTenantId={activeTenantId}
        setActiveTenantId={setActiveTenantId}
        setAlert={setAlert}
      />

      <OrganizationsPanel activeTenantId={activeTenantId} setAlert={setAlert} />
    </div>
  );
}
