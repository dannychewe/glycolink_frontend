"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  X,
} from "lucide-react";
import {
  CONSULTANT_CLIENTS_QUERY,
  INVITE_PATIENT_MUTATION,
  mapInviteError,
} from "@/lib/consultant/clients-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { cn } from "@/lib/utils/cn";

type ConsultantClient = {
  patientId: string;
  patientName: string | null;
  email: string | null;
  phone: string | null;
  diabetesType: string | null;
  onboardingStatus: string | null;
  profileComplete: boolean;
  lastAppointmentAt: string | null;
  nextAppointmentAt: string | null;
  activeConversationId: string | null;
  unreadMessageCount: number;
  pendingPcqCount: number;
  pendingLabReviewCount: number;
  latestAlertSeverity: string | null;
  inviteId: string | null;
  inviteStatus: "INVITED" | "ACCEPTED" | "REJECTED" | null;
};
type AlertState = { type: "success" | "error"; message: string } | null;
type PatientFilter = "all" | "attention" | "setup" | "invites";

function formatDate(value: string | null) {
  if (!value) return "None";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-ZM", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function needsAttention(client: ConsultantClient) {
  return Boolean(
    client.latestAlertSeverity ||
    client.unreadMessageCount ||
    client.pendingPcqCount ||
    client.pendingLabReviewCount,
  );
}

function pendingInvite(client: ConsultantClient) {
  return (
    client.inviteStatus === "INVITED" || client.inviteStatus === "REJECTED"
  );
}

function formatDiabetesType(value: string | null) {
  const labels: Record<string, string> = {
    type_1: "Type 1",
    type_2: "Type 2",
    prediabetes: "Prediabetes",
    gestational: "Gestational",
  };
  return value ? (labels[value] ?? value.replace(/_/g, " ")) : "Not recorded";
}

function InlineAlert({
  alert,
  onDismiss,
}: {
  alert: AlertState;
  onDismiss: () => void;
}) {
  if (!alert) return null;
  return (
    <div
      role={alert.type === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-3 text-sm",
        alert.type === "error"
          ? "border-danger/30 bg-danger/5 text-danger"
          : "border-success/30 bg-success/5 text-success",
      )}
    >
      {alert.type === "error" ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <p className="min-w-0 flex-1 break-words">{alert.message}</p>
      <button
        type="button"
        title="Dismiss notification"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [alert, setAlert] = useState<AlertState>(null);
  const [invited, setInvited] = useState<{
    fullName: string;
    email: string;
    debugSetupToken: string | null;
  } | null>(null);
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    note: "",
  });
  const [invitePatient, { loading }] = useMutation(INVITE_PATIENT_MUTATION);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    setAlert(null);
    try {
      const result = await invitePatient({
        variables: {
          email: form.email.trim(),
          fullName: form.fullName.trim() || undefined,
          phone: form.phone.trim() || undefined,
          note: form.note.trim() || undefined,
        },
        refetchQueries: [CONSULTANT_CLIENTS_QUERY],
      });
      const payload = result.data?.invitePatient;
      setInvited({
        fullName:
          payload?.patientProfile?.fullName ?? (form.fullName || form.email),
        email: payload?.patientProfile?.email ?? form.email,
        debugSetupToken: payload?.setupToken ?? null,
      });
      setForm({ email: "", fullName: "", phone: "", note: "" });
    } catch (error) {
      setAlert({ type: "error", message: mapInviteError(error) });
    }
  }

  return (
    <DetailModal
      title="Invite patient"
      className="sm:max-w-xl"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={onClose}
          >
            {invited ? "Done" : "Cancel"}
          </Button>
          {invited ? (
            <Button type="button" size="sm" onClick={() => setInvited(null)}>
              <UserPlus className="size-4" />
              Invite another
            </Button>
          ) : (
            <Button
              type="submit"
              form="invite-patient-form"
              size="sm"
              disabled={loading}
            >
              <Send className="size-4" />
              {loading ? "Sending..." : "Send invitation"}
            </Button>
          )}
        </div>
      }
    >
      {invited ? (
        <div className="space-y-4">
          <p
            role="status"
            className="flex items-center gap-2 text-sm font-semibold text-success"
          >
            <CheckCircle className="size-4" />
            Invite sent
          </p>
          <p className="break-words text-sm text-text">
            {invited.fullName} ({invited.email}) will receive setup instructions
            by email.
          </p>
          {invited.debugSetupToken ? (
            <div className="space-y-2 border-t border-border pt-4 text-xs">
              <p className="text-muted">Debug setup token</p>
              <p className="break-all font-mono">{invited.debugSetupToken}</p>
              <Link
                className="text-primary underline"
                href={`/accept-patient-invite?token=${encodeURIComponent(invited.debugSetupToken)}`}
              >
                Open debug invite link
              </Link>
            </div>
          ) : null}
        </div>
      ) : (
        <form
          id="invite-patient-form"
          onSubmit={(event) => void handleSubmit(event)}
          className="space-y-4"
        >
          <InlineAlert alert={alert} onDismiss={() => setAlert(null)} />
          <fieldset disabled={loading} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="inviteEmail">Email address</Label>
              <Input
                id="inviteEmail"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inviteFullName">Full name</Label>
              <Input
                id="inviteFullName"
                autoComplete="name"
                value={form.fullName}
                onChange={(event) =>
                  setForm({ ...form, fullName: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invitePhone">Phone number</Label>
              <Input
                id="invitePhone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) =>
                  setForm({ ...form, phone: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="inviteNote">Personal note (optional)</Label>
              <Textarea
                id="inviteNote"
                rows={3}
                value={form.note}
                onChange={(event) =>
                  setForm({ ...form, note: event.target.value })
                }
              />
            </div>
          </fieldset>
        </form>
      )}
    </DetailModal>
  );
}

function ClientRow({ client }: { client: ConsultantClient }) {
  const invited = pendingInvite(client);
  const name =
    client.patientName ??
    client.email ??
    `Patient ${client.patientId.slice(0, 8)}`;

  return (
    <tr className="group align-middle even:bg-background/30 hover:bg-primary/5 focus-within:bg-primary/5">
      <td className="py-4 pl-5 pr-4">
        {invited ? (
          <p className="break-words font-semibold text-ink">{name}</p>
        ) : (
          <Link
            href={`/consultant/patients/${client.patientId}`}
            className="break-words font-semibold text-ink hover:text-primary hover:underline focus-visible:outline-primary"
          >
            {name}
          </Link>
        )}
        {client.email ? (
          <p className="mt-1 break-words text-xs text-muted">{client.email}</p>
        ) : null}
        {client.phone ? (
          <p className="mt-1 text-xs text-muted">{client.phone}</p>
        ) : null}
      </td>
      <td className="px-4 py-4 text-xs text-muted">
        {formatDiabetesType(client.diabetesType)}
      </td>
      <td className="px-4 py-4">
        <Badge
          className="rounded-md px-2 tracking-normal"
          variant={
            invited
              ? "warning"
              : client.profileComplete
                ? "success"
                : "secondary"
          }
        >
          {client.inviteStatus === "INVITED"
            ? "Invite pending"
            : client.inviteStatus === "REJECTED"
              ? "Invite declined"
              : client.profileComplete
                ? "Complete"
                : "Pending setup"}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <dl className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-1.5 text-xs tabular-nums">
          <dt className="text-muted">Last</dt>
          <dd>{formatDate(client.lastAppointmentAt)}</dd>
          <dt className="text-muted">Next</dt>
          <dd>{formatDate(client.nextAppointmentAt)}</dd>
        </dl>
      </td>
      <td className="px-4 py-4 text-right">
        {invited ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled
            title="Patient details are available after the invitation is accepted"
          >
            View details
          </Button>
        ) : (
          <Button
            href={`/consultant/patients/${client.patientId}`}
            variant="secondary"
            size="sm"
            aria-label={`View details for ${name}`}
          >
            View details
          </Button>
        )}
      </td>
    </tr>
  );
}
export function GraphqlClientsList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState<PatientFilter>("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [showInvite, setShowInvite] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);
  const query = useQuery<{ consultantClients: ConsultantClient[] }>(
    CONSULTANT_CLIENTS_QUERY,
    {
      variables: { limit: 50, search: debouncedSearch || undefined },
      fetchPolicy: "cache-and-network",
      notifyOnNetworkStatusChange: true,
    },
  );
  const clients = query.data?.consultantClients ?? [];
  const filtered = clients
    .filter(
      (client) =>
        filter === "all" ||
        (filter === "attention"
          ? needsAttention(client)
          : filter === "invites"
            ? pendingInvite(client)
            : !client.profileComplete && !pendingInvite(client)),
    )
    .sort((left, right) => {
      if (sort === "next")
        return (
          (left.nextAppointmentAt ?? "9999").localeCompare(
            right.nextAppointmentAt ?? "9999",
          ) ||
          (left.patientName ?? left.email ?? "").localeCompare(
            right.patientName ?? right.email ?? "",
          )
        );
      return (left.patientName ?? left.email ?? "").localeCompare(
        right.patientName ?? right.email ?? "",
      );
    });
  const tabs: { key: PatientFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: clients.length },
    {
      key: "attention",
      label: "Needs attention",
      count: clients.filter(needsAttention).length,
    },
    {
      key: "setup",
      label: "Pending setup",
      count: clients.filter(
        (client) => !client.profileComplete && !pendingInvite(client),
      ).length,
    },
    {
      key: "invites",
      label: "Invitations",
      count: clients.filter(pendingInvite).length,
    },
  ];
  const pages = Math.max(1, Math.ceil(filtered.length / 25));
  const currentPage = Math.min(page, pages);
  const offset = (currentPage - 1) * 25;
  const visible = filtered.slice(offset, offset + 25);

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-ink">Patients</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={query.loading}
            title="Refresh patients"
            aria-label="Refresh patients"
            onClick={() => void query.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" size="sm" onClick={() => setShowInvite(true)}>
            <UserPlus className="size-4" />
            Invite patient
          </Button>
        </div>
      </header>
      <WorkspaceTabs
        id="patients-list"
        label="Patient filters"
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setPage(1);
        }}
        tabs={tabs}
      />
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" />
          <Input
            type="search"
            aria-label="Search patients"
            placeholder="Search name, email, or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          aria-label="Sort patients"
          className="w-full sm:w-48"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
          options={[
            { value: "name", label: "Name: A to Z" },
            { value: "next", label: "Next appointment" },
          ]}
        />
        {clients.some((client) => client.latestAlertSeverity) ? (
          <Button
            href="/consultant/monitoring/alerts"
            size="sm"
            variant="ghost"
          >
            <AlertCircle className="size-4 text-danger" />
            Review alerts
          </Button>
        ) : null}
      </div>
      {tabs.map((tab) => (
        <section
          key={tab.key}
          role="tabpanel"
          id={`patients-list-panel-${tab.key}`}
          aria-labelledby={`patients-list-tab-${tab.key}`}
          hidden={filter !== tab.key}
          aria-busy={query.loading}
        >
          {filter === tab.key ? (
            <>
              {query.error ? (
                <div className="space-y-3 border-y border-border py-8 text-center">
                  <p role="alert" className="text-sm text-danger">
                    Unable to load patients.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void query.refetch()}
                  >
                    <RefreshCw className="size-4" />
                    Retry
                  </Button>
                </div>
              ) : query.loading && !query.data ? (
                <div className="space-y-3 py-6" aria-label="Loading patients">
                  {[0, 1, 2, 3].map((row) => (
                    <div
                      key={row}
                      className="h-16 animate-pulse bg-border/30"
                    />
                  ))}
                </div>
              ) : !visible.length ? (
                <p className="border-y border-border py-12 text-center text-sm text-muted">
                  {search || filter !== "all"
                    ? "No patients match these filters."
                    : "No patients yet."}
                </p>
              ) : (
                <div
                  role="region"
                  aria-label="Patient table"
                  tabIndex={0}
                  className="overflow-x-auto border-y border-border focus-visible:outline-primary"
                >
                  <table className="w-full min-w-[880px] table-fixed text-left text-sm">
                    <caption className="sr-only">
                      Patients matching the selected filters
                    </caption>
                    <colgroup>
                      <col />
                      <col className="w-28" />
                      <col className="w-36" />
                      <col className="w-48" />
                      <col className="w-36" />
                    </colgroup>
                    <thead className="border-b border-border bg-background/80 text-xs text-muted">
                      <tr>
                        {[
                          "Patient",
                          "Diabetes type",
                          "Status",
                          "Appointments",
                          "Actions",
                        ].map((label) => (
                          <th
                            key={label}
                            scope="col"
                            className="px-4 py-3.5 font-semibold first:pl-5"
                          >
                            {label === "Actions" ? (
                              <span className="sr-only">Actions</span>
                            ) : (
                              label
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 bg-surface">
                      {visible.map((client) => (
                        <ClientRow key={client.patientId} client={client} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!query.error && query.data ? (
                <footer className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <p className="text-xs text-muted">
                    {filtered.length
                      ? `${offset + 1}-${Math.min(offset + 25, filtered.length)} of ${filtered.length} loaded patients`
                      : "0 patients"}
                  </p>
                  {pages > 1 ? (
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="Previous page"
                        aria-label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <span className="text-xs tabular-nums text-muted">
                        Page {currentPage} of {pages}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        title="Next page"
                        aria-label="Next page"
                        disabled={currentPage === pages}
                        onClick={() => setPage(currentPage + 1)}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  ) : null}
                </footer>
              ) : null}
            </>
          ) : null}
        </section>
      ))}
      {showInvite ? <InviteModal onClose={() => setShowInvite(false)} /> : null}
    </div>
  );
}
