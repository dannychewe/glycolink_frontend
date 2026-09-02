"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@apollo/client";
import {
  Archive,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Circle,
  ClipboardList,
  Copy,
  Eye,
  PauseCircle,
  PlayCircle,
  Plus,
  Send,
  Share2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { PROVIDERS_QUERY } from "@/lib/providers/directory-graphql";
import {
  labelForChoice,
  PROGRAMME_CARE_TEAM_ROLE_OPTIONS,
  type ProgrammeCareTeamRoleValue,
} from "@/lib/programmes/choices";
import {
  ACTIVATE_CARE_PROGRAMME_MUTATION,
  ACTIVATE_PROGRAMME_ENROLMENT_MUTATION,
  ARCHIVE_CARE_PROGRAMME_MUTATION,
  ASSIGN_PROGRAMME_CARE_TEAM_MUTATION,
  CARE_PROGRAMME_QUERY,
  CLINIC_CARE_PROGRAMMES_QUERY,
  CLINIC_PROGRAMME_ENROLMENTS_QUERY,
  CLINIC_PROGRAMME_SCHEDULE_QUERY,
  CREATE_PROGRAMME_SHARE_LINK_MUTATION,
  CREATE_CARE_PROGRAMME_MUTATION,
  ENROL_PATIENT_IN_PROGRAMME_MUTATION,
  INVITE_PATIENT_TO_PROGRAMME_MUTATION,
  PAUSE_CARE_PROGRAMME_MUTATION,
  PAUSE_PROGRAMME_ENROLMENT_MUTATION,
  PROGRAMME_SHARE_LINKS_QUERY,
  RESUME_CARE_PROGRAMME_MUTATION,
  RESUME_PROGRAMME_ENROLMENT_MUTATION,
  UPDATE_DRAFT_CARE_PROGRAMME_MUTATION,
  WITHDRAW_PROGRAMME_ENROLMENT_MUTATION,
  type CareProgramme,
  type ProgrammeEnrolment,
  type ProgrammeScheduleItem,
  type ProgrammeShareLink,
} from "@/lib/programmes/graphql";
import { hasProgrammePermission } from "@/lib/programmes/permissions";

type ProgrammesData = {
  clinicCareProgrammes: CareProgramme[];
};

type ProgrammeData = {
  careProgramme: CareProgramme | null;
};

type EnrolmentsData = {
  clinicProgrammeEnrolments: ProgrammeEnrolment[];
};

type ClinicScheduleData = {
  clinicProgrammeSchedule: ProgrammeScheduleItem[];
};

type CreateShareLinkData = {
  createProgrammeShareLink: {
    shareLink: ProgrammeShareLink;
  };
};

type ProgrammeShareLinksData = {
  programmeShareLinks: ProgrammeShareLink[];
};

type ConsultantClientsData = {
  consultantClients: Array<{
    patientId: string;
    patientName?: string | null;
    email?: string | null;
    phone?: string | null;
    diabetesType?: string | null;
  }>;
};

type ProvidersData = {
  providers: {
    items: Array<{
      id: string;
      displayName?: string | null;
      specialties?: string[] | null;
      organization?: { id: string; name: string } | null;
    }>;
  };
};

type ProgrammeAdminWorkflow = "overview" | "setup" | "enrolment" | "activation" | "details";

const emptyProgrammeForm = {
  organizationId: "",
  name: "Clinic diabetes continuity programme",
  code: "DIABETES-CONTINUITY",
  description: "",
  defaultDurationDays: "180",
  defaultMonitoringCadenceDays: "1",
  startsAt: "",
  endsAt: "",
  enrolmentOpen: true,
};

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "ACTIVE" || normalized === "READY_FOR_ACTIVATION") return "success" as const;
  if (normalized === "DRAFT" || normalized === "INVITED" || normalized === "PENDING_BASELINE") return "warning" as const;
  if (normalized === "PAUSED") return "primary" as const;
  if (normalized === "ARCHIVED" || normalized === "WITHDRAWN") return "danger" as const;
  return "secondary" as const;
}

function mapError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Programme request failed.";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-ZM", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  const startLabel = formatDate(start);
  if (!end || end === start) return startLabel;
  return `${startLabel} - ${formatDate(end)}`;
}

function readinessItems(enrolment: ProgrammeEnrolment | null) {
  if (!enrolment) return [];
  return [
    {
      label: "Baseline assessment",
      ready: enrolment.baselineCompleted,
      detail: enrolment.baselineCompletedAt ? `Completed ${formatDate(enrolment.baselineCompletedAt)}` : "Waiting for baseline completion",
    },
    {
      label: "Care plan",
      ready: enrolment.carePlanReady,
      detail: enrolment.carePlanReadyAt ? `Ready ${formatDate(enrolment.carePlanReadyAt)}` : "Create and activate a care plan",
    },
    {
      label: "Lead clinician",
      ready: Boolean(enrolment.leadProvider),
      detail: enrolment.leadProvider?.displayName ?? "Assign a lead doctor or care coordinator",
    },
    {
      label: "Care team",
      ready: enrolment.careTeamAssignments.some((assignment) => assignment.active),
      detail: `${enrolment.careTeamAssignments.filter((assignment) => assignment.active).length} active assignment(s)`,
    },
  ];
}

function programmePayload(form: typeof emptyProgrammeForm) {
  return {
    organizationId: form.organizationId || undefined,
    name: form.name,
    code: form.code,
    description: form.description || undefined,
    programmeType: "diabetes",
    defaultDurationDays: Number(form.defaultDurationDays) || undefined,
    defaultMonitoringCadenceDays: Number(form.defaultMonitoringCadenceDays) || 1,
    settingsJson: JSON.stringify({ condition: "diabetes", continuityCare: true }),
    enrolmentOpen: form.enrolmentOpen,
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
  };
}

function ProgrammeSetupForm({
  selectedProgramme,
  onCreated,
  onChanged,
}: {
  selectedProgramme?: CareProgramme | null;
  onCreated?: (programmeId?: string) => void;
  onChanged?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const canManageProgrammes = hasProgrammePermission(user, "programme.manage");
  const [form, setForm] = useState(() =>
    selectedProgramme
      ? {
          organizationId: selectedProgramme.organization?.id ?? "",
          name: selectedProgramme.name,
          code: selectedProgramme.code,
          description: selectedProgramme.description ?? "",
          defaultDurationDays: String(selectedProgramme.defaultDurationDays ?? 180),
          defaultMonitoringCadenceDays: String(selectedProgramme.defaultMonitoringCadenceDays ?? 1),
          startsAt: selectedProgramme.startsAt ?? "",
          endsAt: selectedProgramme.endsAt ?? "",
          enrolmentOpen: selectedProgramme.enrolmentOpen,
        }
      : emptyProgrammeForm,
  );
  const [error, setError] = useState<string | null>(null);
  const [createProgramme, createState] = useMutation(CREATE_CARE_PROGRAMME_MUTATION);
  const [updateProgramme, updateState] = useMutation(UPDATE_DRAFT_CARE_PROGRAMME_MUTATION);
  const saving = createState.loading || updateState.loading;
  const organizationOptions = useMemo(() => {
    const memberships = user?.clinicAccess?.memberships ?? [];
    const seen = new Set<string>();
    return memberships
      .filter((membership) => membership?.organizationId)
      .map((membership) => ({
        value: membership.organizationId as string,
        label: membership.organizationName ?? "Clinic organization",
        description: membership.tenantName ?? undefined,
        badge: titleCase(membership.role),
      }))
      .filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      });
  }, [user?.clinicAccess?.memberships]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (selectedProgramme?.status === "DRAFT") {
        await updateProgramme({ variables: { programmeId: selectedProgramme.id, data: programmePayload(form) } });
        await onChanged?.();
        return;
      }
      const response = await createProgramme({ variables: { data: programmePayload(form) } });
      const createdId = response.data?.createCareProgramme?.id as string | undefined;
      onCreated?.(createdId);
      router.push(createdId ? `/consultant/programmes/${createdId}` : "/consultant/programmes");
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={ClipboardList}>{selectedProgramme ? "Programme Settings" : "Create Programme"}</PanelTitle>
      </PanelHeader>
      <PanelBody>
        {error ? <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="programme-name">Name</Label>
              <Input id="programme-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programme-code">Code</Label>
              <Input id="programme-code" value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))} />
            </div>
            <SearchableSelector
              id="programme-org"
              label="Clinic organization"
              value={form.organizationId}
              options={organizationOptions}
              placeholder="Select clinic organization"
              emptyLabel="No clinic organizations found in your session"
              disabled={!canManageProgrammes}
              onChange={(organizationId) => setForm((current) => ({ ...current, organizationId }))}
            />
            <div className="space-y-1.5">
              <Label htmlFor="programme-duration">Duration days</Label>
              <Input id="programme-duration" type="number" min={1} value={form.defaultDurationDays} onChange={(event) => setForm((current) => ({ ...current, defaultDurationDays: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programme-cadence">Monitoring cadence days</Label>
              <Input id="programme-cadence" type="number" min={1} value={form.defaultMonitoringCadenceDays} onChange={(event) => setForm((current) => ({ ...current, defaultMonitoringCadenceDays: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programme-start">Starts at</Label>
              <Input id="programme-start" type="date" value={form.startsAt} onChange={(event) => setForm((current) => ({ ...current, startsAt: event.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="programme-end">Ends at</Label>
              <Input id="programme-end" type="date" value={form.endsAt} onChange={(event) => setForm((current) => ({ ...current, endsAt: event.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="programme-description">Description</Label>
            <Textarea
              id="programme-description"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Clinic-facing programme description"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={form.enrolmentOpen} onChange={(event) => setForm((current) => ({ ...current, enrolmentOpen: event.target.checked }))} />
            Open enrolment
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!canManageProgrammes || saving || !form.name.trim() || !form.code.trim()}>
              {saving ? "Saving..." : selectedProgramme?.status === "DRAFT" ? "Update draft" : "Create programme"}
            </Button>
            <Button href="/consultant/programmes" type="button" size="sm" variant="secondary">
              Back to list
            </Button>
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}

function EnrolmentForm({
  programme,
  onDone,
}: {
  programme: CareProgramme;
  onDone: () => void;
}) {
  const { user } = useAuth();
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [patientId, setPatientId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const patientsQuery = useQuery<ConsultantClientsData>(CONSULTANT_CLIENTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const [enrolPatient, enrolState] = useMutation(ENROL_PATIENT_IN_PROGRAMME_MUTATION);
  const [invitePatient, inviteState] = useMutation(INVITE_PATIENT_TO_PROGRAMME_MUTATION);
  const saving = enrolState.loading || inviteState.loading;
  const patientOptions = useMemo(
    () =>
      (patientsQuery.data?.consultantClients ?? []).map((patient) => ({
        value: patient.patientId,
        label: patient.patientName || patient.email || "Patient",
        description: [patient.email, patient.phone].filter(Boolean).join(" | "),
        badge: titleCase(patient.diabetesType),
      })),
    [patientsQuery.data?.consultantClients],
  );

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      onDone();
    } catch (err) {
      setError(mapError(err));
    }
  }

  function handleEnrol(event: FormEvent) {
    event.preventDefault();
    if (!patientId.trim()) return;
    void run(() =>
      enrolPatient({
        variables: {
          programmeId: programme.id,
          patientId: patientId.trim(),
          data: { monitoringCadenceOverrideDays: programme.defaultMonitoringCadenceDays || undefined },
        },
      }),
    );
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!inviteEmail.trim()) return;
    void run(() =>
      invitePatient({
        variables: {
          programmeId: programme.id,
          email: inviteEmail.trim(),
          fullName: inviteName.trim() || undefined,
          phone: invitePhone.trim() || undefined,
          note: `Invited to ${programme.name}.`,
        },
      }),
    );
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <form onSubmit={handleEnrol} className="space-y-3">
        <SearchableSelector
          id="existing-patient"
          label="Existing patient"
          value={patientId}
          options={patientOptions}
          placeholder="Search patient roster"
          emptyLabel={patientsQuery.loading ? "Loading patients..." : "No patients found"}
          disabled={!canEnrolPatients}
          onChange={setPatientId}
        />
        <Button type="submit" size="sm" disabled={!canEnrolPatients || saving || !patientId.trim()}>
          Enrol patient
        </Button>
      </form>
      <form onSubmit={handleInvite} className="space-y-3 border-t border-border pt-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Patient email" type="email" />
          <Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Full name" />
          <Input value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} placeholder="Mobile money phone" />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !inviteEmail.trim()}>
          <Send className="size-4" />
          Invite patient
        </Button>
      </form>
    </div>
  );
}

function ProgrammeShareLinkPanel({ programme }: { programme: CareProgramme }) {
  const { user } = useAuth();
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [shareLink, setShareLink] = useState<ProgrammeShareLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linksQuery = useQuery<ProgrammeShareLinksData>(PROGRAMME_SHARE_LINKS_QUERY, {
    variables: { programmeId: programme.id },
    fetchPolicy: "cache-and-network",
  });
  const [createShareLink, createState] = useMutation<CreateShareLinkData>(CREATE_PROGRAMME_SHARE_LINK_MUTATION);
  const shareLinks = linksQuery.data?.programmeShareLinks ?? [];
  const totalViews = shareLinks.reduce((sum, link) => sum + link.viewCount, 0);
  const totalEnrolments = shareLinks.reduce((sum, link) => sum + link.enrolmentCount, 0);
  const conversionRate = totalViews > 0 ? Math.round((totalEnrolments / totalViews) * 100) : 0;

  async function handleCreateShareLink() {
    setError(null);
    setCopied(false);
    try {
      const response = await createShareLink({
        variables: {
          programmeId: programme.id,
          label: `Public enrolment for ${programme.name}`,
        },
      });
      setShareLink(response.data?.createProgrammeShareLink.shareLink ?? null);
      await linksQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleCopy() {
    if (!shareLink?.shareUrl) return;
    setError(null);
    try {
      await navigator.clipboard.writeText(shareLink.shareUrl);
      setCopied(true);
    } catch {
      setError("Copy failed. Select the link and copy it manually.");
    }
  }

  const disabled = !canEnrolPatients || createState.loading || programme.status !== "ACTIVE" || !programme.enrolmentOpen;

  return (
    <div id="share-care-plan" className="rounded-lg border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Share care plan</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Share this care plan link on WhatsApp or social media so interested patients can register and join the programme.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => void handleCreateShareLink()}>
          <Share2 className="size-4" />
          {createState.loading ? "Creating..." : shareLink ? "Create new share link" : "Share care plan"}
        </Button>
      </div>
      {error ? <p className="mt-3 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
      {shareLink ? (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input readOnly value={shareLink.shareUrl} className="font-mono text-xs" aria-label="Programme share link" />
          <Button type="button" size="sm" onClick={() => void handleCopy()}>
            <Copy className="size-4" />
            {copied ? "Copied" : "Copy share link"}
          </Button>
        </div>
      ) : null}
      {programme.status !== "ACTIVE" || !programme.enrolmentOpen ? (
        <p className="mt-3 text-xs text-muted">Activate the care plan and keep enrolment open before creating a public link.</p>
      ) : null}
      <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
        <StatTile label="Link views" value={totalViews} />
        <StatTile label="Registrations" value={totalEnrolments} />
        <StatTile label="Conversion" value={`${conversionRate}%`} />
      </div>
      {shareLinks.length ? (
        <div className="mt-4 space-y-2">
          {shareLinks.slice(0, 4).map((link) => (
            <div key={link.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-text">{link.label || "Public enrolment link"}</p>
                <Badge variant={link.active ? "success" : "secondary"}>{link.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs text-muted sm:grid-cols-3">
                <span>{link.viewCount} views</span>
                <span>{link.enrolmentCount} registrations</span>
                <span>{link.lastUsedAt ? `Last joined ${new Date(link.lastUsedAt).toLocaleDateString()}` : "No joins yet"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : linksQuery.loading ? (
        <p className="mt-3 text-xs text-muted">Loading link activity...</p>
      ) : null}
    </div>
  );
}

function isScheduleDue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}

function isWithinThisWeek(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  return date >= today && date <= weekEnd;
}

function ProgrammeSchedulePanel({ items }: { items: ProgrammeScheduleItem[] }) {
  const [tab, setTab] = useState<"due" | "week" | "upcoming" | "completed">("due");
  const openItems = items.filter((item) => !["DONE", "SKIPPED", "CANCELLED"].includes(item.status));
  const dueItems = openItems.filter((item) => isScheduleDue(item.scheduledDate));
  const weekItems = openItems.filter((item) => isWithinThisWeek(item.scheduledDate));
  const upcomingItems = openItems.filter((item) => !isScheduleDue(item.scheduledDate));
  const completedItems = items.filter((item) => item.status === "DONE");
  const tabItems = {
    due: dueItems,
    week: weekItems,
    upcoming: upcomingItems,
    completed: completedItems,
  };
  const visible = tabItems[tab].slice(0, 10);
  const tabs = [
    { id: "due" as const, label: "Due", count: dueItems.length },
    { id: "week" as const, label: "This week", count: weekItems.length },
    { id: "upcoming" as const, label: "Upcoming", count: upcomingItems.length },
    { id: "completed" as const, label: "Completed", count: completedItems.length },
  ];

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={openItems.length}>Care Journey Calendar</PanelTitle>
      </PanelHeader>
      <PanelBody className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Due now" value={dueItems.length} tone={dueItems.length ? "warning" : "success"} />
        <StatTile label="This week" value={weekItems.length} />
        <StatTile label="Completed" value={completedItems.length} tone="success" />
      </PanelBody>
      <PanelBody className="border-t border-border pt-0">
        <div className="flex flex-wrap gap-2">
          {tabs.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={tab === item.id ? "primary" : "secondary"}
              onClick={() => setTab(item.id)}
            >
              {item.label} {item.count}
            </Button>
          ))}
        </div>
      </PanelBody>
      {visible.length === 0 ? (
        <PanelEmpty>{items.length === 0 ? "No active care journey items yet. Activate a care plan with a follow-up schedule to generate this calendar." : "No items in this view."}</PanelEmpty>
      ) : (
        <PanelList>
          {visible.map((item) => (
            <div key={item.id} className="px-5 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={isScheduleDue(item.scheduledDate) ? "warning" : statusVariant(item.status)}>
                      {item.dayNumber ? `Day ${item.dayNumber}` : titleCase(item.status)}
                    </Badge>
                    <p className="text-xs text-muted">{formatDateRange(item.scheduledDate, item.scheduledEndDate)}</p>
                  </div>
                  <p className="mt-2 break-words text-sm font-semibold text-text">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.patient.fullName || item.patient.email || "Patient"} | {titleCase(item.eventType)}
                    {item.provider?.displayName ? ` | ${item.provider.displayName}` : ""}
                  </p>
                </div>
                {item.eventType === "VIDEO_CONSULTATION" || item.eventType === "CONSULTANT_REVIEW" ? (
                  <Button href={`/consultant/patients/${item.patient.id}`} size="sm" variant="secondary">
                    Open patient
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </PanelList>
      )}
    </Panel>
  );
}

function CareTeamAndActivation({
  selectedEnrolment,
  onChanged,
}: {
  selectedEnrolment: ProgrammeEnrolment | null;
  onChanged: () => Promise<void> | void;
}) {
  const { user } = useAuth();
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [teamProviderId, setTeamProviderId] = useState("");
  const [teamRole, setTeamRole] = useState<ProgrammeCareTeamRoleValue>("care_coordinator");
  const [careTeamModalOpen, setCareTeamModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const providersQuery = useQuery<ProvidersData>(PROVIDERS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const providerOptions = useMemo(
    () =>
      (providersQuery.data?.providers.items ?? []).map((provider) => ({
        value: provider.id,
        label: provider.displayName || "Clinician",
        description: [provider.organization?.name, ...(provider.specialties ?? [])].filter(Boolean).join(" | "),
      })),
    [providersQuery.data?.providers.items],
  );
  const [assignTeam, assignState] = useMutation(ASSIGN_PROGRAMME_CARE_TEAM_MUTATION);
  const [activateEnrolment, activateState] = useMutation(ACTIVATE_PROGRAMME_ENROLMENT_MUTATION);
  const [pauseEnrolment, pauseState] = useMutation(PAUSE_PROGRAMME_ENROLMENT_MUTATION);
  const [resumeEnrolment, resumeState] = useMutation(RESUME_PROGRAMME_ENROLMENT_MUTATION);
  const [withdrawEnrolment, withdrawState] = useMutation(WITHDRAW_PROGRAMME_ENROLMENT_MUTATION);
  const saving = assignState.loading || activateState.loading || pauseState.loading || resumeState.loading || withdrawState.loading;
  const checklist = readinessItems(selectedEnrolment);
  const readyForActivation = checklist.length > 0 && checklist.every((item) => item.ready);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  function handleAssignTeam(event: FormEvent) {
    event.preventDefault();
    if (!selectedEnrolment || !teamProviderId.trim()) return;
    setError(null);
    void (async () => {
      try {
        await assignTeam({
          variables: {
            enrolmentId: selectedEnrolment.id,
            assignments: [{ role: teamRole, providerId: teamProviderId.trim() }],
          },
        });
        setCareTeamModalOpen(false);
        setTeamProviderId("");
        await onChanged();
      } catch (err) {
        setError(mapError(err));
      }
    })();
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Users}>Readiness And Care Team</PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        {selectedEnrolment ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background p-3">
              <div>
                <p className="text-sm font-semibold text-text">{selectedEnrolment.patient.fullName ?? selectedEnrolment.patient.email ?? selectedEnrolment.patient.id}</p>
                <p className="mt-1 text-xs text-muted">Lead clinician: {selectedEnrolment.leadProvider?.displayName ?? "Not assigned"}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={readyForActivation ? "success" : "warning"}>{readyForActivation ? "Ready" : "Needs attention"}</Badge>
                <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients} onClick={() => setCareTeamModalOpen(true)}>
                  <Plus className="size-4" />
                  Add care team
                </Button>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {checklist.map((item) => (
                <div key={item.label} className="rounded-lg border border-border bg-background px-3 py-2">
                  <div className="flex items-center gap-2">
                    {item.ready ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4 text-warning" />}
                    <p className="text-sm font-medium text-text">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
            {selectedEnrolment.careTeamAssignments.some((assignment) => assignment.active) ? (
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">Active care team</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedEnrolment.careTeamAssignments
                    .filter((assignment) => assignment.active)
                    .map((assignment) => (
                      <Badge key={assignment.id} variant="secondary">
                        {labelForChoice(PROGRAMME_CARE_TEAM_ROLE_OPTIONS, assignment.role)}: {assignment.provider?.displayName ?? `Staff ${assignment.assignedUserId.slice(0, 8)}`}
                      </Badge>
                    ))}
                </div>
              </div>
            ) : null}
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lifecycle reason for pause, resume, or withdraw" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!canEnrolPatients || saving || !readyForActivation} onClick={() => void run(() => activateEnrolment({ variables: { enrolmentId: selectedEnrolment.id } }))}>
                Activate enrolment
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving} onClick={() => void run(() => pauseEnrolment({ variables: { enrolmentId: selectedEnrolment.id, reason: reason || undefined } }))}>
                Pause
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving} onClick={() => void run(() => resumeEnrolment({ variables: { enrolmentId: selectedEnrolment.id } }))}>
                Resume
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !reason.trim()} onClick={() => void run(() => withdrawEnrolment({ variables: { enrolmentId: selectedEnrolment.id, reason } }))}>
                Withdraw
              </Button>
            </div>
            {careTeamModalOpen ? (
              <DetailModal
                title="Add care team"
                subtitle={selectedEnrolment.patient.fullName ?? selectedEnrolment.patient.email ?? "Programme enrolment"}
                onClose={() => setCareTeamModalOpen(false)}
                className="sm:max-w-2xl"
                footer={
                  <div className="flex justify-end">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setCareTeamModalOpen(false)}>
                      <X className="size-4" />
                      Close
                    </Button>
                  </div>
                }
              >
                <form onSubmit={handleAssignTeam} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`care-team-role-${selectedEnrolment.id}`}>Care team role</Label>
                    <Select
                      id={`care-team-role-${selectedEnrolment.id}`}
                      value={teamRole}
                      options={[...PROGRAMME_CARE_TEAM_ROLE_OPTIONS]}
                      disabled={!canEnrolPatients}
                      onChange={(event) => setTeamRole(event.target.value as ProgrammeCareTeamRoleValue)}
                    />
                  </div>
                  <SearchableSelector
                    id="care-team-provider"
                    label="Care team clinician"
                    value={teamProviderId}
                    options={providerOptions}
                    placeholder="Search clinician directory"
                    emptyLabel={providersQuery.loading ? "Loading clinicians..." : "No clinicians found"}
                    disabled={!canEnrolPatients}
                    onChange={setTeamProviderId}
                  />
                  <Button type="submit" size="sm" disabled={!canEnrolPatients || saving || !teamProviderId.trim()}>
                    Assign care team
                  </Button>
                </form>
              </DetailModal>
            ) : null}
          </>
        ) : (
          <PanelEmpty className="rounded-lg border border-dashed border-border">Select an enrolled patient to review activation readiness.</PanelEmpty>
        )}
      </PanelBody>
    </Panel>
  );
}

function ProgrammesListView() {
  const programmesQuery = useQuery<ProgrammesData>(CLINIC_CARE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const programmes = programmesQuery.data?.clinicCareProgrammes ?? [];
  const activeCount = programmes.filter((programme) => programme.status === "ACTIVE").length;
  const draftCount = programmes.filter((programme) => programme.status === "DRAFT").length;
  const openCount = programmes.filter((programme) => programme.enrolmentOpen).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Active" value={activeCount} icon={CheckCircle2} tone="success" />
        <StatTile label="Drafts" value={draftCount} icon={ClipboardList} tone="warning" />
        <StatTile label="Open enrolment" value={openCount} icon={UserPlus} tone="primary" />
      </div>
      <Panel>
        <PanelHeader>
          <PanelTitle icon={Users} count={programmes.length}>Care Plans</PanelTitle>
          <div className="flex flex-wrap gap-2">
            <Button href="/consultant/programmes/setup" type="button" size="sm">
              <Plus className="size-4" />
              New plan
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => void programmesQuery.refetch()}>
              Refresh
            </Button>
          </div>
        </PanelHeader>
        {programmes.length === 0 ? (
          <PanelEmpty>{programmesQuery.loading ? "Loading care plans..." : "No care plans configured yet."}</PanelEmpty>
        ) : (
          <PanelList>
            {programmes.map((programme) => (
              <div key={programme.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-sm font-semibold text-text">{programme.name}</p>
                    <Badge variant={statusVariant(programme.status)}>{titleCase(programme.status)}</Badge>
                    {programme.enrolmentOpen ? <Badge variant="primary">Open enrolment</Badge> : null}
                  </div>
                  <p className="mt-1 break-words text-xs text-muted">
                    {programme.code} | {programme.defaultDurationDays ?? "Open"} days | monitoring every {programme.defaultMonitoringCadenceDays} day(s)
                  </p>
                  {programme.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{programme.description}</p> : null}
                </div>
                <Button href={`/consultant/programmes/${programme.id}`} size="sm" variant="secondary">
                  <Eye className="size-4" />
                  Details
                </Button>
              </div>
            ))}
          </PanelList>
        )}
      </Panel>
    </div>
  );
}

function ProgrammeDetailsView({ programmeId }: { programmeId: string }) {
  const { user } = useAuth();
  const canManageProgrammes = hasProgrammePermission(user, "programme.manage");
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [enrolmentModalOpen, setEnrolmentModalOpen] = useState(false);
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const programmeQuery = useQuery<ProgrammeData>(CARE_PROGRAMME_QUERY, {
    variables: { id: programmeId },
    fetchPolicy: "cache-and-network",
  });
  const enrolmentsQuery = useQuery<EnrolmentsData>(CLINIC_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { programmeId },
    fetchPolicy: "cache-and-network",
  });
  const scheduleQuery = useQuery<ClinicScheduleData>(CLINIC_PROGRAMME_SCHEDULE_QUERY, {
    variables: { programmeId },
    fetchPolicy: "cache-and-network",
  });
  const programme = programmeQuery.data?.careProgramme ?? null;
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];
  const scheduleItems = scheduleQuery.data?.clinicProgrammeSchedule ?? [];
  const selectedEnrolment = enrolments.find((enrolment) => enrolment.id === selectedEnrolmentId) ?? enrolments[0] ?? null;
  const [activateProgramme, activateState] = useMutation(ACTIVATE_CARE_PROGRAMME_MUTATION);
  const [pauseProgramme, pauseState] = useMutation(PAUSE_CARE_PROGRAMME_MUTATION);
  const [resumeProgramme, resumeState] = useMutation(RESUME_CARE_PROGRAMME_MUTATION);
  const [archiveProgramme, archiveState] = useMutation(ARCHIVE_CARE_PROGRAMME_MUTATION);
  const saving = activateState.loading || pauseState.loading || resumeState.loading || archiveState.loading;

  async function refetchAll() {
    await programmeQuery.refetch();
    await enrolmentsQuery.refetch();
    await scheduleQuery.refetch();
  }

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      await refetchAll();
    } catch (err) {
      setError(mapError(err));
    }
  }

  if (!programme && programmeQuery.loading) {
    return <PanelEmpty className="rounded-lg border border-border bg-surface">Loading care plan details...</PanelEmpty>;
  }

  if (!programme) {
    return <PanelEmpty className="rounded-lg border border-border bg-surface">Care plan not found.</PanelEmpty>;
  }

  return (
    <div className="space-y-5">
      {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
      <Panel>
        <PanelBody className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="break-words text-xl font-semibold text-ink">{programme.name}</h2>
                <Badge variant={statusVariant(programme.status)}>{titleCase(programme.status)}</Badge>
                {programme.enrolmentOpen ? <Badge variant="primary">Open enrolment</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted">{programme.code}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!canEnrolPatients}
                onClick={() => document.getElementById("share-care-plan")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              >
                <Share2 className="size-4" />
                Share care plan
              </Button>
              <Button type="button" size="sm" disabled={!canEnrolPatients} onClick={() => setEnrolmentModalOpen(true)}>
                <UserPlus className="size-4" />
                Enrol patient
              </Button>
              <Button href="/consultant/programmes" size="sm" variant="secondary">
                Back to list
              </Button>
            </div>
          </div>
          {programme.description ? <p className="text-sm leading-6 text-muted">{programme.description}</p> : null}
          <div className="grid gap-3 md:grid-cols-4">
            <StatTile label="Enrolled patients" value={enrolments.length} icon={Users} />
            <StatTile label="Cadence" value={`${programme.defaultMonitoringCadenceDays}d`} sublabel="Monitoring" icon={CalendarDays} tone="primary" />
            <StatTile label="Duration" value={programme.defaultDurationDays ?? "Open"} sublabel="Days" icon={ClipboardList} />
            <StatTile label="Care-plan ready" value={enrolments.filter((enrolment) => enrolment.carePlanReady).length} icon={CheckCircle2} tone="success" />
          </div>
          <ProgrammeShareLinkPanel programme={programme} />
          <ProgrammeSchedulePanel items={scheduleItems} />
          <div className="space-y-3">
            <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lifecycle reason for pause or archive" />
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || programme.status !== "DRAFT"} onClick={() => void run(() => activateProgramme({ variables: { programmeId: programme.id } }))}>
                <CheckCircle2 className="size-4" />
                Activate
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || programme.status !== "ACTIVE"} onClick={() => void run(() => pauseProgramme({ variables: { programmeId: programme.id, reason: reason || undefined } }))}>
                <PauseCircle className="size-4" />
                Pause
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || programme.status !== "PAUSED"} onClick={() => void run(() => resumeProgramme({ variables: { programmeId: programme.id } }))}>
                <PlayCircle className="size-4" />
                Resume
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || programme.status === "ARCHIVED"} onClick={() => void run(() => archiveProgramme({ variables: { programmeId: programme.id, reason: reason || "Archived by clinic admin" } }))}>
                <Archive className="size-4" />
                Archive
              </Button>
            </div>
          </div>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader>
          <PanelTitle icon={Users} count={enrolments.length}>Enrolled Patients</PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void enrolmentsQuery.refetch()}>
            Refresh
          </Button>
        </PanelHeader>
        {enrolments.length === 0 ? (
          <PanelEmpty>No patients are enrolled in this care plan yet.</PanelEmpty>
        ) : (
          <PanelList>
            {enrolments.map((enrolment) => (
              <button
                key={enrolment.id}
                type="button"
                onClick={() => setSelectedEnrolmentId(enrolment.id)}
                className={`block w-full px-5 py-4 text-left transition-colors hover:bg-background ${selectedEnrolment?.id === enrolment.id ? "bg-primary/5" : ""}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="break-words text-sm font-semibold text-text">{enrolment.patient.fullName ?? enrolment.patient.email ?? enrolment.patient.id}</p>
                  <Badge variant={statusVariant(enrolment.status)}>{titleCase(enrolment.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Lead: {enrolment.leadProvider?.displayName ?? "Not assigned"} | care plan {enrolment.carePlanReady ? "ready" : "not ready"} | enrolled {formatDate(enrolment.enrolledAt)}
                </p>
              </button>
            ))}
          </PanelList>
        )}
      </Panel>

      <CareTeamAndActivation selectedEnrolment={selectedEnrolment} onChanged={refetchAll} />

      {enrolmentModalOpen ? (
        <DetailModal
          title="Enrol patient"
          subtitle={programme.name}
          onClose={() => setEnrolmentModalOpen(false)}
          className="sm:max-w-2xl"
          footer={
            <Button type="button" variant="ghost" size="sm" onClick={() => setEnrolmentModalOpen(false)}>
              <X className="size-4" />
              Close
            </Button>
          }
        >
          <EnrolmentForm
            programme={programme}
            onDone={() => {
              setEnrolmentModalOpen(false);
              void refetchAll();
            }}
          />
        </DetailModal>
      ) : null}
    </div>
  );
}

export function ProgrammeAdminDashboard({
  workflow = "overview",
  programmeId,
}: {
  workflow?: ProgrammeAdminWorkflow;
  programmeId?: string;
}) {
  if (workflow === "setup") return <ProgrammeSetupForm />;
  if (workflow === "details" && programmeId) return <ProgrammeDetailsView programmeId={programmeId} />;
  if ((workflow === "enrolment" || workflow === "activation") && programmeId) return <ProgrammeDetailsView programmeId={programmeId} />;
  return <ProgrammesListView />;
}
