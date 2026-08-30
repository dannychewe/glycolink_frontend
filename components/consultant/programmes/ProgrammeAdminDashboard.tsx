"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { Archive, CheckCircle2, PauseCircle, PlayCircle, Plus, Send, UserPlus, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
} from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { PROVIDERS_QUERY } from "@/lib/providers/directory-graphql";
import { hasProgrammePermission } from "@/lib/programmes/permissions";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import {
  ACTIVATE_CARE_PROGRAMME_MUTATION,
  ACTIVATE_PROGRAMME_ENROLMENT_MUTATION,
  ARCHIVE_CARE_PROGRAMME_MUTATION,
  ASSIGN_PROGRAMME_CARE_TEAM_MUTATION,
  CLINIC_CARE_PROGRAMMES_QUERY,
  CLINIC_PROGRAMME_ENROLMENTS_QUERY,
  CREATE_CARE_PROGRAMME_MUTATION,
  ENROL_PATIENT_IN_PROGRAMME_MUTATION,
  INVITE_PATIENT_TO_PROGRAMME_MUTATION,
  PAUSE_CARE_PROGRAMME_MUTATION,
  PAUSE_PROGRAMME_ENROLMENT_MUTATION,
  RESUME_CARE_PROGRAMME_MUTATION,
  RESUME_PROGRAMME_ENROLMENT_MUTATION,
  UPDATE_DRAFT_CARE_PROGRAMME_MUTATION,
  WITHDRAW_PROGRAMME_ENROLMENT_MUTATION,
  type CareProgramme,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";

type ProgrammesData = {
  clinicCareProgrammes: CareProgramme[];
};

type EnrolmentsData = {
  clinicProgrammeEnrolments: ProgrammeEnrolment[];
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

type ProgrammeAdminWorkflow = "overview" | "setup" | "enrolment" | "activation";

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

function readinessItems(enrolment: ProgrammeEnrolment | null) {
  if (!enrolment) return [];
  return [
    {
      label: "Baseline assessment approved",
      ready: enrolment.baselineCompleted,
      detail: enrolment.baselineCompletedAt ? "Completed" : "Waiting for baseline completion",
    },
    {
      label: "Care plan active",
      ready: enrolment.carePlanReady,
      detail: enrolment.carePlanReadyAt ? "Ready for patient care" : "Create and activate a care plan",
    },
    {
      label: "Lead clinician assigned",
      ready: Boolean(enrolment.leadProvider),
      detail: enrolment.leadProvider?.displayName ?? "Assign a lead doctor or care coordinator",
    },
    {
      label: "Care team assigned",
      ready: enrolment.careTeamAssignments.some((assignment) => assignment.active),
      detail: `${enrolment.careTeamAssignments.filter((assignment) => assignment.active).length} active assignment(s)`,
    },
  ];
}

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

export function ProgrammeAdminDashboard({ workflow = "overview" }: { workflow?: ProgrammeAdminWorkflow }) {
  const { user } = useAuth();
  const canManageProgrammes = hasProgrammePermission(user, "programme.manage");
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
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
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(null);
  const [programmeForm, setProgrammeForm] = useState(emptyProgrammeForm);
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [teamUserId, setTeamUserId] = useState("");
  const [teamProviderId, setTeamProviderId] = useState("");
  const [teamRole, setTeamRole] = useState("care_coordinator");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const programmesQuery = useQuery<ProgrammesData>(CLINIC_CARE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
  });
  const programmes = useMemo(
    () => programmesQuery.data?.clinicCareProgrammes ?? [],
    [programmesQuery.data?.clinicCareProgrammes],
  );
  const selectedProgramme = useMemo(
    () => programmes.find((programme) => programme.id === selectedProgrammeId) ?? programmes[0] ?? null,
    [programmes, selectedProgrammeId],
  );
  const programmeOptions = useMemo(
    () =>
      programmes.map((programme) => ({
        value: programme.id,
        label: programme.name,
        description: programme.code,
        badge: titleCase(programme.status),
      })),
    [programmes],
  );
  const programmeId = selectedProgramme?.id;
  const enrolmentsQuery = useQuery<EnrolmentsData>(CLINIC_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { programmeId },
    skip: !programmeId,
    fetchPolicy: "cache-and-network",
  });
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];
  const selectedEnrolment = enrolments.find((enrolment) => enrolment.id === selectedEnrolmentId) ?? enrolments[0] ?? null;
  const activationChecklist = readinessItems(selectedEnrolment);
  const readyForActivation = activationChecklist.length > 0 && activationChecklist.every((item) => item.ready);
  const showSetup = workflow === "setup";
  const showProgrammeList = workflow === "overview";
  const showEnrolmentForms = workflow === "enrolment";
  const showEnrolmentList = workflow === "overview" || workflow === "activation";
  const showCareTeamAndActivation = workflow === "activation";
  const patientsQuery = useQuery<ConsultantClientsData>(CONSULTANT_CLIENTS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const providersQuery = useQuery<ProvidersData>(PROVIDERS_QUERY, {
    variables: { limit: 50 },
    fetchPolicy: "cache-and-network",
  });
  const patientOptions = useMemo(
    () =>
      (patientsQuery.data?.consultantClients ?? []).map((patient) => ({
        value: patient.patientId,
        label: patient.patientName || patient.email || "Patient",
        description: [patient.email, patient.phone].filter(Boolean).join(" · "),
        badge: titleCase(patient.diabetesType),
      })),
    [patientsQuery.data?.consultantClients],
  );
  const providerOptions = useMemo(
    () =>
      (providersQuery.data?.providers.items ?? []).map((provider) => ({
        value: provider.id,
        label: provider.displayName || "Clinician",
        description: [provider.organization?.name, ...(provider.specialties ?? [])].filter(Boolean).join(" · "),
      })),
    [providersQuery.data?.providers.items],
  );

  const [createProgramme, createState] = useMutation(CREATE_CARE_PROGRAMME_MUTATION);
  const [updateProgramme, updateState] = useMutation(UPDATE_DRAFT_CARE_PROGRAMME_MUTATION);
  const [activateProgramme, activateState] = useMutation(ACTIVATE_CARE_PROGRAMME_MUTATION);
  const [pauseProgramme, pauseState] = useMutation(PAUSE_CARE_PROGRAMME_MUTATION);
  const [resumeProgramme, resumeState] = useMutation(RESUME_CARE_PROGRAMME_MUTATION);
  const [archiveProgramme, archiveState] = useMutation(ARCHIVE_CARE_PROGRAMME_MUTATION);
  const [enrolPatient, enrolState] = useMutation(ENROL_PATIENT_IN_PROGRAMME_MUTATION);
  const [invitePatient, inviteState] = useMutation(INVITE_PATIENT_TO_PROGRAMME_MUTATION);
  const [assignTeam, assignState] = useMutation(ASSIGN_PROGRAMME_CARE_TEAM_MUTATION);
  const [activateEnrolment, activateEnrolmentState] = useMutation(ACTIVATE_PROGRAMME_ENROLMENT_MUTATION);
  const [pauseEnrolment, pauseEnrolmentState] = useMutation(PAUSE_PROGRAMME_ENROLMENT_MUTATION);
  const [resumeEnrolment, resumeEnrolmentState] = useMutation(RESUME_PROGRAMME_ENROLMENT_MUTATION);
  const [withdrawEnrolment, withdrawEnrolmentState] = useMutation(WITHDRAW_PROGRAMME_ENROLMENT_MUTATION);

  const saving =
    createState.loading ||
    updateState.loading ||
    activateState.loading ||
    pauseState.loading ||
    resumeState.loading ||
    archiveState.loading ||
    enrolState.loading ||
    inviteState.loading ||
    assignState.loading ||
    activateEnrolmentState.loading ||
    pauseEnrolmentState.loading ||
    resumeEnrolmentState.loading ||
    withdrawEnrolmentState.loading;

  function programmePayload() {
    return {
      organizationId: programmeForm.organizationId || undefined,
      name: programmeForm.name,
      code: programmeForm.code,
      description: programmeForm.description || undefined,
      programmeType: "diabetes",
      defaultDurationDays: Number(programmeForm.defaultDurationDays) || undefined,
      defaultMonitoringCadenceDays: Number(programmeForm.defaultMonitoringCadenceDays) || 1,
      settingsJson: JSON.stringify({ condition: "diabetes", continuityCare: true }),
      enrolmentOpen: programmeForm.enrolmentOpen,
      startsAt: programmeForm.startsAt || undefined,
      endsAt: programmeForm.endsAt || undefined,
    };
  }

  async function refetchAll() {
    await programmesQuery.refetch();
    if (programmeId) await enrolmentsQuery.refetch();
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

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void run(() => createProgramme({ variables: { data: programmePayload() } }));
  }

  function handleUpdateDraft(event: FormEvent) {
    event.preventDefault();
    if (!selectedProgramme) return;
    void run(() => updateProgramme({ variables: { programmeId: selectedProgramme.id, data: programmePayload() } }));
  }

  function handleEnrol(event: FormEvent) {
    event.preventDefault();
    if (!selectedProgramme || !patientId.trim()) return;
    void run(() =>
      enrolPatient({
        variables: {
          programmeId: selectedProgramme.id,
          patientId: patientId.trim(),
          data: { monitoringCadenceOverrideDays: Number(programmeForm.defaultMonitoringCadenceDays) || undefined },
        },
      }),
    );
  }

  function handleInvite(event: FormEvent) {
    event.preventDefault();
    if (!selectedProgramme || !inviteEmail.trim()) return;
    void run(() =>
      invitePatient({
        variables: {
          programmeId: selectedProgramme.id,
          email: inviteEmail.trim(),
          fullName: inviteName.trim() || undefined,
          phone: invitePhone.trim() || undefined,
          note: "Invited to clinic diabetes continuity care.",
        },
      }),
    );
  }

  function handleAssignTeam(event: FormEvent) {
    event.preventDefault();
    if (!selectedEnrolmentId || (!teamUserId.trim() && !teamProviderId.trim())) return;
    void run(() =>
      assignTeam({
        variables: {
          enrolmentId: selectedEnrolmentId,
          assignments: [
            {
              role: teamRole,
              userId: teamUserId.trim() || undefined,
              providerId: teamProviderId.trim() || undefined,
            },
          ],
        },
      }),
    );
  }

  return (
    <div className={workflow === "overview" ? "space-y-6" : "grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"}>
      <div className="space-y-6">
        {showSetup ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Plus}>Programme Setup</PanelTitle>
            <Button type="button" size="sm" variant="secondary" onClick={() => void programmesQuery.refetch()}>
              Refresh
            </Button>
          </PanelHeader>
          <PanelBody>
            {error ? <p className="mb-4 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
            <form onSubmit={selectedProgramme?.status === "DRAFT" ? handleUpdateDraft : handleCreate} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="programme-name">Name</Label>
                  <Input id="programme-name" value={programmeForm.name} onChange={(event) => setProgrammeForm((form) => ({ ...form, name: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="programme-code">Code</Label>
                  <Input id="programme-code" value={programmeForm.code} onChange={(event) => setProgrammeForm((form) => ({ ...form, code: event.target.value }))} />
                </div>
                <SearchableSelector
                  id="programme-org"
                  label="Clinic organization"
                  value={programmeForm.organizationId}
                  options={organizationOptions}
                  placeholder="Select clinic organization"
                  emptyLabel="No clinic organizations found in your session"
                  disabled={!canManageProgrammes}
                  onChange={(organizationId) => setProgrammeForm((form) => ({ ...form, organizationId }))}
                />
                <div className="space-y-1.5">
                  <Label htmlFor="programme-duration">Duration days</Label>
                  <Input id="programme-duration" type="number" min={1} value={programmeForm.defaultDurationDays} onChange={(event) => setProgrammeForm((form) => ({ ...form, defaultDurationDays: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="programme-cadence">Default cadence days</Label>
                  <Input id="programme-cadence" type="number" min={1} value={programmeForm.defaultMonitoringCadenceDays} onChange={(event) => setProgrammeForm((form) => ({ ...form, defaultMonitoringCadenceDays: event.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="programme-start">Starts at</Label>
                  <Input id="programme-start" type="date" value={programmeForm.startsAt} onChange={(event) => setProgrammeForm((form) => ({ ...form, startsAt: event.target.value }))} />
                </div>
              </div>
              <Textarea value={programmeForm.description} onChange={(event) => setProgrammeForm((form) => ({ ...form, description: event.target.value }))} placeholder="Clinic-facing programme description" />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={programmeForm.enrolmentOpen} onChange={(event) => setProgrammeForm((form) => ({ ...form, enrolmentOpen: event.target.checked }))} />
                Open enrolment
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" size="sm" disabled={!canManageProgrammes || saving || !programmeForm.name.trim() || !programmeForm.code.trim()}>
                  {selectedProgramme?.status === "DRAFT" ? "Update draft" : "Create draft"}
                </Button>
                {selectedProgramme ? (
                  <>
                    <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || selectedProgramme.status !== "DRAFT"} onClick={() => void run(() => activateProgramme({ variables: { programmeId: selectedProgramme.id } }))}>
                      <CheckCircle2 className="size-4" />
                      Activate
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || selectedProgramme.status !== "ACTIVE"} onClick={() => void run(() => pauseProgramme({ variables: { programmeId: selectedProgramme.id, reason: reason || undefined } }))}>
                      <PauseCircle className="size-4" />
                      Pause
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || selectedProgramme.status !== "PAUSED"} onClick={() => void run(() => resumeProgramme({ variables: { programmeId: selectedProgramme.id } }))}>
                      <PlayCircle className="size-4" />
                      Resume
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={!canManageProgrammes || saving || selectedProgramme.status === "ARCHIVED"} onClick={() => void run(() => archiveProgramme({ variables: { programmeId: selectedProgramme.id, reason: reason || "Archived by clinic admin" } }))}>
                      <Archive className="size-4" />
                      Archive
                    </Button>
                  </>
                ) : null}
              </div>
              <Input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Lifecycle reason for pause/archive/withdraw actions" />
            </form>
          </PanelBody>
        </Panel>
        ) : null}

        {showProgrammeList ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users} count={programmes.length}>Clinic Programmes</PanelTitle>
            <div className="flex flex-wrap gap-2">
              <Button href="/consultant/programmes/setup" type="button" size="sm">
                New programme
              </Button>
              <Button href="/consultant/programmes/enrol" type="button" size="sm" variant="secondary">
                Enrol patient
              </Button>
            </div>
          </PanelHeader>
          {programmes.length === 0 ? (
            <PanelEmpty>No care programmes configured yet.</PanelEmpty>
          ) : (
            <PanelList>
              {programmes.map((programme) => (
                <button
                  key={programme.id}
                  type="button"
                  onClick={() => setSelectedProgrammeId(programme.id)}
                  className={`block w-full px-5 py-4 text-left transition-colors hover:bg-background ${selectedProgramme?.id === programme.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="break-words text-sm font-semibold text-text">{programme.name}</p>
                    <Badge variant={statusVariant(programme.status)}>{titleCase(programme.status)}</Badge>
                  </div>
                  <p className="mt-1 break-words text-xs text-muted">{programme.code} · every {programme.defaultMonitoringCadenceDays} day monitoring</p>
                </button>
              ))}
            </PanelList>
          )}
        </Panel>
        ) : null}
      </div>

      <div className="space-y-6">
        {workflow !== "overview" ? (
          <Panel>
            <PanelHeader>
              <PanelTitle icon={Users}>Selected Programme</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <SearchableSelector
                id="admin-programme-selector"
                label="Programme"
                value={programmeId ?? ""}
                options={programmeOptions}
                placeholder="Choose programme"
                emptyLabel={programmesQuery.loading ? "Loading programmes..." : "No programmes found"}
                onChange={setSelectedProgrammeId}
              />
            </PanelBody>
          </Panel>
        ) : null}

        {showEnrolmentForms ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={UserPlus}>Patient Enrolment</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-5">
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
              <Button type="submit" size="sm" disabled={!canEnrolPatients || saving || !selectedProgramme || !patientId.trim()}>
                Enrol patient
              </Button>
            </form>
            <form onSubmit={handleInvite} className="space-y-3 border-t border-border pt-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Patient email" type="email" />
                <Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Full name" />
                <Input value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} placeholder="Mobile money phone" />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !selectedProgramme || !inviteEmail.trim()}>
                <Send className="size-4" />
                Invite patient
              </Button>
            </form>
          </PanelBody>
        </Panel>
        ) : null}

        {showEnrolmentList ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users} count={enrolments.length}>Programme Enrolments</PanelTitle>
            <Button type="button" size="sm" variant="secondary" disabled={!programmeId} onClick={() => void enrolmentsQuery.refetch()}>
              Refresh
            </Button>
          </PanelHeader>
          {enrolments.length === 0 ? (
            <PanelEmpty>Select a programme with enrolments, or enrol a patient above.</PanelEmpty>
          ) : (
            <PanelList>
              {enrolments.map((enrolment) => (
                <button
                  key={enrolment.id}
                  type="button"
                  onClick={() => setSelectedEnrolmentId(enrolment.id)}
                  className={`block w-full px-5 py-4 text-left transition-colors hover:bg-background ${selectedEnrolmentId === enrolment.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="break-words text-sm font-semibold text-text">{enrolment.patient.fullName ?? enrolment.patient.email ?? enrolment.patient.id}</p>
                    <Badge variant={statusVariant(enrolment.status)}>{titleCase(enrolment.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Lead provider: {enrolment.leadProvider?.displayName ?? "Not assigned"} · care plan {enrolment.carePlanReady ? "ready" : "not ready"}
                  </p>
                </button>
              ))}
            </PanelList>
          )}
        </Panel>
        ) : null}

        {showCareTeamAndActivation ? (
        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users}>Care Team And Activation</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-4">
            {selectedEnrolment ? (
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-text">Activation readiness</p>
                  <Badge variant={readyForActivation ? "success" : "warning"}>
                    {readyForActivation ? "Ready" : "Needs attention"}
                  </Badge>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {activationChecklist.map((item) => (
                    <div key={item.label} className="rounded-lg border border-border bg-surface px-3 py-2">
                      <p className="text-sm font-medium text-text">{item.label}</p>
                      <p className={item.ready ? "mt-1 text-xs text-success" : "mt-1 text-xs text-warning"}>{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <form onSubmit={handleAssignTeam} className="grid gap-3 sm:grid-cols-2">
              <Input value={teamRole} onChange={(event) => setTeamRole(event.target.value)} placeholder="Role, e.g. nurse" />
              <SearchableSelector
                id="care-team-provider"
                label="Care team clinician"
                value={teamProviderId}
                options={providerOptions}
                placeholder="Search clinician directory"
                emptyLabel={providersQuery.loading ? "Loading clinicians..." : "No clinicians found"}
                disabled={!canEnrolPatients}
                onChange={(providerId) => {
                  setTeamProviderId(providerId);
                  setTeamUserId("");
                }}
              />
              <Button type="submit" size="sm" disabled={!canEnrolPatients || saving || !selectedEnrolmentId || (!teamUserId.trim() && !teamProviderId.trim())}>
                Assign care team
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={!canEnrolPatients || saving || !selectedEnrolmentId || !readyForActivation} onClick={() => void run(() => activateEnrolment({ variables: { enrolmentId: selectedEnrolmentId } }))}>
                Activate enrolment
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !selectedEnrolmentId} onClick={() => void run(() => pauseEnrolment({ variables: { enrolmentId: selectedEnrolmentId, reason: reason || undefined } }))}>
                Pause
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !selectedEnrolmentId} onClick={() => void run(() => resumeEnrolment({ variables: { enrolmentId: selectedEnrolmentId } }))}>
                Resume
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canEnrolPatients || saving || !selectedEnrolmentId || !reason.trim()} onClick={() => void run(() => withdrawEnrolment({ variables: { enrolmentId: selectedEnrolmentId, reason } }))}>
                Withdraw
              </Button>
            </div>
          </PanelBody>
        </Panel>
        ) : null}
      </div>
    </div>
  );
}
