"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Search,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ADMIN_APPROVE_PROVIDER_LICENSE_MUTATION,
  ADMIN_APPROVE_PROVIDER_MUTATION,
  ADMIN_PROVIDER_DETAIL_QUERY,
  ADMIN_PROVIDERS_QUERY,
  ADMIN_REJECT_PROVIDER_LICENSE_MUTATION,
  ADMIN_REJECT_PROVIDER_MUTATION,
  ADMIN_SUSPEND_PROVIDER_MUTATION,
} from "@/lib/admin/graphql";
import { getGraphQLErrorMessage } from "@/features/auth/auth-context";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;
type StatusFilter = "all" | "draft" | "submitted" | "approved" | "rejected" | "suspended";
type ActionMode = "reject" | "suspend" | null;

type ProviderListItem = {
  id: string;
  displayName: string | null;
  hpczNumber: string | null;
  status: string | null;
  verificationStatus: string | null;
  eligible: boolean | null;
  createdAt: string | null;
  organization: {
    id: string;
    name: string;
  } | null;
};

type ProviderDetail = {
  id: string;
  displayName: string | null;
  hpczNumber: string | null;
  bio: string | null;
  status: string | null;
  verificationStatus: string | null;
  profilePictureUrl: string | null;
  consultationFeeInitial: number | null;
  consultationFeeFollowup: number | null;
  specialties: string[] | null;
  subSpecialties: string[] | null;
  licenses: ProviderLicense[];
  organization: {
    id: string;
    name: string;
    type: string | null;
  } | null;
};

type ProviderLicense = {
  id: string;
  type: string;
  status: string;
  expiryDate: string | null;
  issuedAt: string | null;
  fileUrl: string | null;
};

type ProvidersData = {
  systemProviders: {
    items: ProviderListItem[];
    total: number;
    page: number;
    limit: number;
  } | null;
};

type ProviderDetailData = {
  providerProfile: ProviderDetail | null;
};

const STATUS_FILTERS: StatusFilter[] = [
  "all",
  "draft",
  "submitted",
  "approved",
  "rejected",
  "suspended",
];

const STATUS_FILTER_VALUES: Record<StatusFilter, string | undefined> = {
  all: undefined,
  draft: "DRAFT",
  submitted: "SUBMITTED",
  approved: "APPROVED",
  rejected: "REJECTED",
  suspended: "SUSPENDED",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number | null | undefined) {
  if (value == null) return "Not set";
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    maximumFractionDigits: 0,
  }).format(value);
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

function InlineAlert({ alert, onDismiss }: Readonly<{ alert: AlertState; onDismiss: () => void }>) {
  if (!alert) return null;

  const isError = alert.type === "error";

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        isError
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <p className="flex-1">{alert.message}</p>
      <button type="button" onClick={onDismiss} className="shrink-0 opacity-60 hover:opacity-100">
        <X className="size-4" />
      </button>
    </div>
  );
}

function ProviderDetailModal({
  providerId,
  onClose,
  onActionComplete,
}: Readonly<{
  providerId: string;
  onClose: () => void;
  onActionComplete: (alert: AlertState) => void;
}>) {
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [reason, setReason] = useState("");
  const [licenseRejectId, setLicenseRejectId] = useState<string | null>(null);
  const [licenseRejectReason, setLicenseRejectReason] = useState("");
  const { data, loading, error, refetch } = useQuery<ProviderDetailData>(
    ADMIN_PROVIDER_DETAIL_QUERY,
    {
      variables: { id: providerId },
      fetchPolicy: "cache-and-network",
    },
  );
  const [approveLicense, { loading: approvingLicense }] = useMutation(
    ADMIN_APPROVE_PROVIDER_LICENSE_MUTATION,
  );
  const [rejectLicense, { loading: rejectingLicense }] = useMutation(
    ADMIN_REJECT_PROVIDER_LICENSE_MUTATION,
  );
  const [approveProvider, { loading: approving }] = useMutation(ADMIN_APPROVE_PROVIDER_MUTATION);
  const [rejectProvider, { loading: rejecting }] = useMutation(ADMIN_REJECT_PROVIDER_MUTATION);
  const [suspendProvider, { loading: suspending }] = useMutation(ADMIN_SUSPEND_PROVIDER_MUTATION);

  const provider = data?.providerProfile ?? null;
  const licenseActionLoading = approvingLicense || rejectingLicense;
  const actionLoading = approving || rejecting || suspending || licenseActionLoading;
  const hasApprovedLicense = (provider?.licenses ?? []).some(
    (license) => license.status?.toUpperCase() === "APPROVED",
  );

  async function refreshProviderLists() {
    await refetch();
  }

  async function handleApprove() {
    try {
      await approveProvider({
        variables: { providerId },
        refetchQueries: [{ query: ADMIN_PROVIDER_DETAIL_QUERY, variables: { id: providerId } }],
      });
      await refreshProviderLists();
      onActionComplete({ type: "success", message: "Provider approved." });
    } catch (error) {
      onActionComplete({ type: "error", message: getGraphQLErrorMessage(error, "Unable to approve provider.") });
    }
  }

  async function handleApproveLicense(licenseId: string) {
    try {
      await approveLicense({
        variables: { licenseId },
        refetchQueries: [{ query: ADMIN_PROVIDER_DETAIL_QUERY, variables: { id: providerId } }],
      });
      await refreshProviderLists();
      onActionComplete({ type: "success", message: "License approved." });
    } catch (error) {
      onActionComplete({ type: "error", message: getGraphQLErrorMessage(error, "Unable to approve license.") });
    }
  }

  async function handleRejectLicense(event: FormEvent) {
    event.preventDefault();
    if (!licenseRejectId) return;

    try {
      await rejectLicense({
        variables: {
          licenseId: licenseRejectId,
          reason: licenseRejectReason.trim() || undefined,
        },
        refetchQueries: [{ query: ADMIN_PROVIDER_DETAIL_QUERY, variables: { id: providerId } }],
      });
      setLicenseRejectId(null);
      setLicenseRejectReason("");
      await refreshProviderLists();
      onActionComplete({ type: "success", message: "License rejected." });
    } catch (error) {
      onActionComplete({ type: "error", message: getGraphQLErrorMessage(error, "Unable to reject license.") });
    }
  }

  async function handleReasonAction(event: FormEvent) {
    event.preventDefault();
    if (!actionMode) return;

    try {
      if (actionMode === "reject") {
        await rejectProvider({
          variables: { providerId, reason },
          refetchQueries: [{ query: ADMIN_PROVIDER_DETAIL_QUERY, variables: { id: providerId } }],
        });
        onActionComplete({ type: "success", message: "Provider rejected." });
      } else {
        await suspendProvider({
          variables: { providerId, reason },
          refetchQueries: [{ query: ADMIN_PROVIDER_DETAIL_QUERY, variables: { id: providerId } }],
        });
        onActionComplete({ type: "success", message: "Provider suspended." });
      }

      setReason("");
      setActionMode(null);
      await refreshProviderLists();
    } catch (error) {
      onActionComplete({
        type: "error",
        message: getGraphQLErrorMessage(
          error,
          actionMode === "reject" ? "Unable to reject provider." : "Unable to suspend provider.",
        ),
      });
    }
  }

  return (
    <DetailModal
      title={provider?.displayName ?? "Provider Detail"}
      subtitle={provider?.organization?.name ?? "Lifecycle administration"}
      onClose={onClose}
      className="sm:max-w-4xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={actionLoading || !hasApprovedLicense}
              onClick={() => void handleApprove()}
            >
              <BadgeCheck className="size-4" />
              {approving ? "Approving..." : "Approve"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => setActionMode(actionMode === "reject" ? null : "reject")}
            >
              <X className="size-4" />
              Reject
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={actionLoading}
              onClick={() => setActionMode(actionMode === "suspend" ? null : "suspend")}
            >
              <ShieldAlert className="size-4" />
              Suspend
            </Button>
          </div>
        </div>
      }
    >
      {loading && !provider ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-xl bg-border/50" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {getGraphQLErrorMessage(error, "Unable to load provider detail.")}
        </div>
      ) : null}

      {provider ? (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
            <div className="space-y-3">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-background">
                {provider.profilePictureUrl ? (
                  <Image
                    src={provider.profilePictureUrl}
                    alt={provider.displayName ?? "Provider"}
                    fill
                    className="object-cover"
                    sizes="220px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-primary">
                    {(provider.displayName ?? "Provider").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusVariant(provider.status)}>{formatLabel(provider.status)}</Badge>
                <Badge variant={statusVariant(provider.verificationStatus)}>
                  {formatLabel(provider.verificationStatus)}
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Provider
                </p>
                <h3 className="mt-1 text-2xl font-semibold text-text">
                  {provider.displayName ?? "Unnamed provider"}
                </h3>
                <p className="mt-1 text-sm text-muted">HPCZ {provider.hpczNumber ?? "Not provided"}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">Initial consultation</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatCurrency(provider.consultationFeeInitial)}
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-background px-4 py-3">
                  <p className="text-xs text-muted">Follow-up consultation</p>
                  <p className="mt-1 text-sm font-semibold text-text">
                    {formatCurrency(provider.consultationFeeFollowup)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background px-4 py-3">
                <p className="text-xs text-muted">Organization</p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {provider.organization?.name ?? "No organization"}
                </p>
                {provider.organization?.type ? (
                  <p className="text-xs text-muted">{formatLabel(provider.organization.type)}</p>
                ) : null}
              </div>
            </div>
          </div>

          {provider.bio ? (
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Bio</p>
              <p className="mt-2 text-sm leading-6 text-text">{provider.bio}</p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Specialties
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(provider.specialties ?? []).length > 0 ? (
                  provider.specialties?.map((specialty) => (
                    <Badge key={specialty} variant="primary">
                      {specialty}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted">No specialties provided.</p>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-background px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                Sub-specialties
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(provider.subSpecialties ?? []).length > 0 ? (
                  provider.subSpecialties?.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted">No sub-specialties provided.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background px-4 py-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
                  Licenses
                </p>
                <p className="mt-1 text-xs text-muted">
                  Approve at least one unexpired license before approving this provider profile.
                </p>
              </div>
              {hasApprovedLicense ? <Badge variant="success">License approved</Badge> : null}
            </div>

            {(provider.licenses ?? []).length > 0 ? (
              <div className="mt-4 space-y-3">
                {provider.licenses.map((license) => {
                  const isApproved = license.status?.toUpperCase() === "APPROVED";
                  const isRejected = license.status?.toUpperCase() === "REJECTED";
                  return (
                    <div key={license.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <FileText className="size-4 text-muted" />
                            <p className="text-sm font-semibold text-text">{formatLabel(license.type)}</p>
                            <Badge variant={statusVariant(license.status)}>
                              {formatLabel(license.status)}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted">
                            Issued {formatDate(license.issuedAt)} · Expires {formatDate(license.expiryDate)}
                          </p>
                          {license.fileUrl ? (
                            <a
                              href={license.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex text-xs font-medium text-primary underline underline-offset-4"
                            >
                              View document
                            </a>
                          ) : (
                            <p className="text-xs text-muted">No document URL available.</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={licenseActionLoading || isApproved}
                            onClick={() => void handleApproveLicense(license.id)}
                          >
                            {approvingLicense ? "Approving..." : "Approve License"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={licenseActionLoading || isRejected}
                            onClick={() => {
                              setLicenseRejectId(licenseRejectId === license.id ? null : license.id);
                              setLicenseRejectReason("");
                            }}
                          >
                            Reject License
                          </Button>
                        </div>
                      </div>

                      {licenseRejectId === license.id ? (
                        <form
                          onSubmit={(event) => void handleRejectLicense(event)}
                          className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row"
                        >
                          <Input
                            value={licenseRejectReason}
                            onChange={(event) => setLicenseRejectReason(event.target.value)}
                            placeholder="Reason (optional)"
                            className="flex-1"
                          />
                          <Button type="submit" size="sm" disabled={licenseActionLoading}>
                            {rejectingLicense ? "Rejecting..." : "Confirm Reject"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLicenseRejectId(null);
                              setLicenseRejectReason("");
                            }}
                          >
                            Cancel
                          </Button>
                        </form>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 rounded-xl border border-dashed border-border px-4 py-5 text-center text-sm text-muted">
                No uploaded licenses found for this provider.
              </p>
            )}
          </div>

          {actionMode ? (
            <form
              onSubmit={(event) => void handleReasonAction(event)}
              className="space-y-3 rounded-xl border border-border bg-background p-4"
            >
              <div className="space-y-2">
                <Label htmlFor="provider-action-reason">
                  {actionMode === "reject" ? "Rejection reason" : "Suspension reason"}
                </Label>
                <Textarea
                  id="provider-action-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  placeholder="Provide a clear reason for this lifecycle action."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={actionLoading || !reason.trim()}>
                  {actionMode === "reject" ? "Confirm Rejection" : "Confirm Suspension"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setActionMode(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </div>
      ) : null}
    </DetailModal>
  );
}

export function AdminProvidersManager() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("submitted");
  const [page, setPage] = useState(1);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const limit = 10;

  const { data, loading, error } = useQuery<ProvidersData>(ADMIN_PROVIDERS_QUERY, {
    variables: {
      search: search || undefined,
      status: STATUS_FILTER_VALUES[statusFilter],
      page,
      limit,
    },
    fetchPolicy: "cache-and-network",
  });

  const providers = useMemo(() => data?.systemProviders?.items ?? [], [data?.systemProviders?.items]);
  const total = data?.systemProviders?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Admin Workspace
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Provider Reviews</h1>
        <p className="max-w-3xl text-sm text-muted">
          Review provider profiles, approve eligible clinicians, and manage lifecycle actions.
        </p>
      </header>

      <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                Provider List
              </CardTitle>
              <p className="text-sm text-muted">
                System provider lifecycle list across draft, submitted, approved, rejected, and suspended states.
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex w-full gap-2 xl:max-w-md">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search providers"
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="secondary">
                Search
              </Button>
            </form>
          </div>

          <div className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-1">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setStatusFilter(filter);
                  setPage(1);
                }}
                className={cn(
                  "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition",
                  statusFilter === filter
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted hover:text-text",
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
              {getGraphQLErrorMessage(error, "Unable to load providers.")}
            </div>
          ) : null}

          {loading && providers.length === 0 ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-xl bg-border/50" />
              ))}
            </div>
          ) : null}

          {!loading && providers.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-10 text-center">
              <UserCheck className="size-8 text-muted" />
              <p className="text-sm text-muted">No providers match the current filter.</p>
            </div>
          ) : null}

          {providers.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="hidden grid-cols-[1.35fr_0.9fr_1fr_0.8fr_0.55fr] gap-4 border-b border-border bg-background px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted lg:grid">
                <span>Provider</span>
                <span>HPCZ</span>
                <span>Organization</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-border">
                {providers.map((provider) => (
                  <div
                    key={provider.id}
                    className="grid gap-3 px-4 py-4 text-sm lg:grid-cols-[1.35fr_0.9fr_1fr_0.8fr_0.55fr] lg:items-center lg:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text">
                        {provider.displayName ?? "Unnamed provider"}
                      </p>
                      <p className="text-xs text-muted">Created {formatDate(provider.createdAt)}</p>
                    </div>
                    <p className="text-muted">{provider.hpczNumber ?? "Not provided"}</p>
                    <p className="truncate text-muted">
                      {provider.organization?.name ?? "No organization"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={statusVariant(provider.status)}>
                        {formatLabel(provider.status)}
                      </Badge>
                      <Badge variant={statusVariant(provider.verificationStatus)}>
                        {formatLabel(provider.verificationStatus)}
                      </Badge>
                      {provider.eligible ? <Badge variant="success">Eligible</Badge> : null}
                    </div>
                    <div className="flex justify-start lg:justify-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => setSelectedProviderId(provider.id)}
                      >
                        <Eye className="size-4" />
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
              Page {page} of {totalPages} · {total} total providers
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedProviderId ? (
        <ProviderDetailModal
          providerId={selectedProviderId}
          onClose={() => setSelectedProviderId(null)}
          onActionComplete={setAlert}
        />
      ) : null}
    </div>
  );
}
