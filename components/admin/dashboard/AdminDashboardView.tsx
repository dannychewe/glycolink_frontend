"use client";

import { useMemo } from "react";
import { useQuery } from "@apollo/client";
import {
  Activity,
  Bell,
  Building2,
  ClipboardCheck,
  FileSearch,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ADMIN_DASHBOARD_ORGANIZATIONS_QUERY,
  ADMIN_DASHBOARD_REVIEW_QUEUE_QUERY,
  ADMIN_DASHBOARD_BOOTSTRAP_QUERY,
  ADMIN_DASHBOARD_TENANTS_QUERY,
  ADMIN_DASHBOARD_USERS_QUERY,
  ADMIN_PROVIDER_REVIEW_QUEUE_QUERY,
} from "@/lib/admin/graphql";
import { cn } from "@/lib/utils/cn";

type AdminDashboardData = {
  me: {
    id: string;
    email: string;
    accountType: string | null;
    primaryRole: string | null;
    isSuperuser: boolean;
  } | null;
  systemTenants: {
    total: number;
  };
  notificationsPreview: {
    unreadCount: number;
    items: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: string;
    }>;
  } | null;
  auditEvents: {
    total: number;
    items: Array<{
      id: string;
      actionType: string;
      entityType: string;
      entityId: string;
      createdAt: string;
    }>;
  } | null;
};

type TenantsData = {
  systemTenants: {
    items: Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
    }>;
    total: number;
  } | null;
};

type UsersData = {
  systemUsers: {
    items: Array<{
      id: string;
      email: string;
      fullName: string | null;
      primaryRole: string | null;
      isActive: boolean;
      isVerified: boolean;
    }>;
    total: number;
  } | null;
};

type OrganizationsData = {
  systemOrganizations: {
    items: Array<{
      id: string;
      tenantId: string;
      name: string;
      type: string;
      status: string;
      logoUrl: string | null;
    }>;
    total: number;
  } | null;
};

type ReviewQueueData = {
  reviewQueue: {
    items: Array<{
      id: string;
      rating: number;
      comment: string | null;
      moderationStatus: string;
      reviewerName: string | null;
      createdAt: string;
    }>;
    total: number;
  } | null;
};

type ProviderReviewQueueData = {
  providers: {
    items: Array<{
      id: string;
      displayName: string | null;
      hpczNumber: string | null;
      status: string | null;
      verificationStatus: string | null;
      createdAt: string | null;
    }>;
    total: number;
    page: number;
    limit: number;
  } | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(status: string | null | undefined) {
  const normalized = status?.toUpperCase();
  if (normalized === "APPROVED" || normalized === "ACTIVE" || normalized === "VERIFIED") {
    return "success" as const;
  }
  if (normalized === "PENDING" || normalized === "SUBMITTED" || normalized === "IN_REVIEW") {
    return "warning" as const;
  }
  if (normalized === "REJECTED" || normalized === "SUSPENDED" || normalized === "INACTIVE") {
    return "danger" as const;
  }
  return "secondary" as const;
}

function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "primary",
}: Readonly<{
  icon: typeof ShieldCheck;
  label: string;
  value: string | number;
  detail: string;
  tone?: "primary" | "success" | "warning";
}>) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 space-y-1">
          <p className="text-sm text-muted">{label}</p>
          <p className="text-2xl font-semibold text-text">{value}</p>
          <p className="text-xs text-muted">{detail}</p>
        </div>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone === "success" && "bg-success/10 text-success",
            tone === "warning" && "bg-warning/15 text-warning",
            tone === "primary" && "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniListCard({
  title,
  icon: Icon,
  total,
  loading,
  children,
}: Readonly<{
  title: string;
  icon: typeof ShieldCheck;
  total: number;
  loading: boolean;
  children: React.ReactNode;
}>) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-5 text-primary" />
          {title}
        </CardTitle>
        <Badge variant="secondary">{loading ? "..." : total}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? <LoadingRows /> : children}
      </CardContent>
    </Card>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-xl bg-border/50" />
      ))}
    </div>
  );
}

export function AdminDashboardView() {
  const {
    data: dashboardData,
    loading: dashboardLoading,
    error: dashboardError,
  } = useQuery<AdminDashboardData>(ADMIN_DASHBOARD_BOOTSTRAP_QUERY, {
    fetchPolicy: "cache-and-network",
  });

  const {
    data: providersData,
    loading: providersLoading,
    error: providersError,
  } = useQuery<ProviderReviewQueueData>(ADMIN_PROVIDER_REVIEW_QUEUE_QUERY, {
    variables: { page: 1, limit: 10 },
    fetchPolicy: "cache-and-network",
  });
  const { data: tenantsData, loading: tenantsLoading, error: tenantsError } = useQuery<TenantsData>(
    ADMIN_DASHBOARD_TENANTS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const { data: usersData, loading: usersLoading, error: usersError } = useQuery<UsersData>(
    ADMIN_DASHBOARD_USERS_QUERY,
    { fetchPolicy: "cache-and-network" },
  );
  const {
    data: organizationsData,
    loading: organizationsLoading,
    error: organizationsError,
  } = useQuery<OrganizationsData>(ADMIN_DASHBOARD_ORGANIZATIONS_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const { data: reviewData, loading: reviewLoading, error: reviewError } = useQuery<ReviewQueueData>(
    ADMIN_DASHBOARD_REVIEW_QUEUE_QUERY,
    { fetchPolicy: "cache-and-network" },
  );

  const reviewQueue = useMemo(
    () => {
      const providers = providersData?.providers?.items ?? [];
      return providers.filter((provider) => {
        const status = `${provider.status ?? ""} ${provider.verificationStatus ?? ""}`.toUpperCase();
        return status.includes("PENDING") || status.includes("SUBMITTED") || status.includes("REVIEW");
      });
    },
    [providersData?.providers?.items],
  );

  const tenantTotal = dashboardData?.systemTenants?.total ?? 0;
  const auditTotal = dashboardData?.auditEvents?.total ?? 0;
  const unreadCount = dashboardData?.notificationsPreview?.unreadCount ?? 0;
  const notifications = dashboardData?.notificationsPreview?.items ?? [];
  const auditEvents = dashboardData?.auditEvents?.items ?? [];
  const tenants = tenantsData?.systemTenants?.items ?? [];
  const users = usersData?.systemUsers?.items ?? [];
  const organizations = organizationsData?.systemOrganizations?.items ?? [];
  const reviews = reviewData?.reviewQueue?.items ?? [];
  const me = dashboardData?.me;

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Dashboard</h1>
        <p className="max-w-3xl text-sm text-muted">
          System administration for platform-level services and review queues.
        </p>
      </header>

      {dashboardError || providersError || tenantsError || usersError || organizationsError || reviewError ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Some dashboard data could not be loaded. The page is showing the sections that are available.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShieldCheck}
          label="Signed in as"
          value={me?.primaryRole ?? "Admin"}
          detail={me?.email ?? "Loading account"}
        />
        <StatCard
          icon={Building2}
          label="System tenants"
          value={dashboardLoading ? "..." : tenantTotal}
          detail="Platform tenant count"
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Audit events"
          value={dashboardLoading ? "..." : auditTotal}
          detail="Recent platform activity"
        />
        <StatCard
          icon={Bell}
          label="Unread notifications"
          value={dashboardLoading ? "..." : unreadCount}
          detail="Latest system notices"
          tone={unreadCount > 0 ? "warning" : "primary"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                Provider Review Queue
              </CardTitle>
              <p className="text-sm text-muted">
                Built from the existing provider list contract until a dedicated pending approvals query exists.
              </p>
            </div>
            <Badge variant={reviewQueue.length > 0 ? "warning" : "secondary"}>
              {reviewQueue.length} pending
            </Badge>
          </CardHeader>
          <CardContent>
            {providersLoading ? <LoadingRows /> : null}

            {!providersLoading && reviewQueue.length === 0 ? (
              <div className="rounded-xl border border-border bg-background px-4 py-5 text-sm text-muted">
                No pending provider reviews were found in the current provider page.
              </div>
            ) : null}

            {!providersLoading && reviewQueue.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="hidden grid-cols-[1.4fr_1fr_0.9fr_0.9fr] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted md:grid">
                  <span>Provider</span>
                  <span>HPCZ</span>
                  <span>Status</span>
                  <span>Submitted</span>
                </div>
                <div className="divide-y divide-border">
                  {reviewQueue.map((provider) => (
                    <div
                      key={provider.id}
                      className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.4fr_1fr_0.9fr_0.9fr] md:items-center md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-text">
                          {provider.displayName ?? "Unnamed provider"}
                        </p>
                        <p className="text-xs text-muted">{provider.id}</p>
                      </div>
                      <p className="text-muted">{provider.hpczNumber ?? "Not provided"}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={statusVariant(provider.status)}>
                          {titleCase(provider.status)}
                        </Badge>
                        <Badge variant={statusVariant(provider.verificationStatus)}>
                          {titleCase(provider.verificationStatus)}
                        </Badge>
                      </div>
                      <p className="text-muted">{formatDateTime(provider.createdAt)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <MiniListCard
            title="Review Moderation"
            icon={ClipboardCheck}
            total={reviewData?.reviewQueue?.total ?? 0}
            loading={reviewLoading}
          >
            {reviews.length === 0 ? (
              <p className="text-sm text-muted">No pending reviews.</p>
            ) : (
              reviews.slice(0, 4).map((review) => (
                <div key={review.id} className="rounded-xl border border-border px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-text">
                      {review.reviewerName ?? "Reviewer"} · {review.rating}/5
                    </p>
                    <Badge variant="warning">{titleCase(review.moderationStatus)}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">
                    {review.comment ?? "No comment provided."}
                  </p>
                  <p className="mt-2 text-xs text-muted">{formatDateTime(review.createdAt)}</p>
                </div>
              ))
            )}
          </MiniListCard>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="size-5 text-primary" />
                Operational Gaps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted">
              <p>System admins are platform admins, not tenant admins.</p>
              <p>Tenant-admin screens require tenant membership with admin or owner privileges.</p>
              <p>No dedicated dashboard summary aggregate.</p>
              <p>No dedicated pending provider approval queue.</p>
              <p>No dedicated pending claims queue beyond accessible claim list/detail.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <MiniListCard
          title="Tenants"
          icon={Building2}
          total={tenantsData?.systemTenants?.total ?? 0}
          loading={tenantsLoading}
        >
          {tenants.length === 0 ? (
            <p className="text-sm text-muted">No tenants returned.</p>
          ) : (
            tenants.slice(0, 5).map((tenant) => (
              <div key={tenant.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{tenant.name}</p>
                    <p className="text-xs text-muted">{tenant.slug}</p>
                  </div>
                  <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                </div>
              </div>
            ))
          )}
        </MiniListCard>

        <MiniListCard
          title="Users"
          icon={Users}
          total={usersData?.systemUsers?.total ?? 0}
          loading={usersLoading}
        >
          {users.length === 0 ? (
            <p className="text-sm text-muted">No users returned.</p>
          ) : (
            users.slice(0, 5).map((user) => (
              <div key={user.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">
                      {user.fullName ?? user.email}
                    </p>
                    <p className="text-xs text-muted">{user.email}</p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Badge variant={user.isActive ? "success" : "danger"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant={user.isVerified ? "success" : "warning"}>
                      {user.isVerified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </MiniListCard>

        <MiniListCard
          title="Organizations"
          icon={Building2}
          total={organizationsData?.systemOrganizations?.total ?? 0}
          loading={organizationsLoading}
        >
          {organizations.length === 0 ? (
            <p className="text-sm text-muted">No organizations returned.</p>
          ) : (
            organizations.slice(0, 5).map((organization) => (
              <div key={organization.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{organization.name}</p>
                    <p className="text-xs text-muted">{titleCase(organization.type)}</p>
                  </div>
                  <Badge variant={statusVariant(organization.status)}>{organization.status}</Badge>
                </div>
              </div>
            ))
          )}
        </MiniListCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <MiniListCard
          title="Notifications"
          icon={Bell}
          total={unreadCount}
          loading={dashboardLoading}
        >
          {notifications.length === 0 ? (
            <p className="text-sm text-muted">No notifications returned.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-text">{notification.title}</p>
                  <Badge variant={notification.isRead ? "secondary" : "primary"}>
                    {notification.isRead ? "Read" : "New"}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{notification.message}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(notification.createdAt)}</p>
              </div>
            ))
          )}
        </MiniListCard>

        <MiniListCard
          title="Audit Events"
          icon={Activity}
          total={auditTotal}
          loading={dashboardLoading}
        >
          {auditEvents.length === 0 ? (
            <p className="text-sm text-muted">No audit events returned.</p>
          ) : (
            auditEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-xl border border-border px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{titleCase(event.actionType)}</p>
                    <p className="text-xs text-muted">
                      {titleCase(event.entityType)} · {event.entityId}
                    </p>
                  </div>
                  <Badge variant="secondary">{formatDateTime(event.createdAt)}</Badge>
                </div>
              </div>
            ))
          )}
        </MiniListCard>
      </div>
    </div>
  );
}
