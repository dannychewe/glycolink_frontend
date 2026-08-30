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

export function ProgrammeAdminDashboard() {
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
  const programmeId = selectedProgramme?.id;
  const enrolmentsQuery = useQuery<EnrolmentsData>(CLINIC_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { programmeId },
    skip: !programmeId,
    fetchPolicy: "cache-and-network",
  });
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];

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
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
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
                <div className="space-y-1.5">
                  <Label htmlFor="programme-org">Organization ID</Label>
                  <Input id="programme-org" value={programmeForm.organizationId} onChange={(event) => setProgrammeForm((form) => ({ ...form, organizationId: event.target.value }))} placeholder="Optional when backend infers clinic" />
                </div>
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
                <Button type="submit" size="sm" disabled={saving || !programmeForm.name.trim() || !programmeForm.code.trim()}>
                  {selectedProgramme?.status === "DRAFT" ? "Update draft" : "Create draft"}
                </Button>
                {selectedProgramme ? (
                  <>
                    <Button type="button" size="sm" variant="secondary" disabled={saving || selectedProgramme.status !== "DRAFT"} onClick={() => void run(() => activateProgramme({ variables: { programmeId: selectedProgramme.id } }))}>
                      <CheckCircle2 className="size-4" />
                      Activate
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={saving || selectedProgramme.status !== "ACTIVE"} onClick={() => void run(() => pauseProgramme({ variables: { programmeId: selectedProgramme.id, reason: reason || undefined } }))}>
                      <PauseCircle className="size-4" />
                      Pause
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={saving || selectedProgramme.status !== "PAUSED"} onClick={() => void run(() => resumeProgramme({ variables: { programmeId: selectedProgramme.id } }))}>
                      <PlayCircle className="size-4" />
                      Resume
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={saving || selectedProgramme.status === "ARCHIVED"} onClick={() => void run(() => archiveProgramme({ variables: { programmeId: selectedProgramme.id, reason: reason || "Archived by clinic admin" } }))}>
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

        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users} count={programmes.length}>Clinic Programmes</PanelTitle>
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
                    <p className="text-sm font-semibold text-text">{programme.name}</p>
                    <Badge variant={statusVariant(programme.status)}>{titleCase(programme.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted">{programme.code} · every {programme.defaultMonitoringCadenceDays} day monitoring</p>
                </button>
              ))}
            </PanelList>
          )}
        </Panel>
      </div>

      <div className="space-y-6">
        <Panel>
          <PanelHeader>
            <PanelTitle icon={UserPlus}>Patient Enrolment</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-5">
            <form onSubmit={handleEnrol} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="existing-patient-id">Existing patient ID</Label>
                <Input id="existing-patient-id" value={patientId} onChange={(event) => setPatientId(event.target.value)} placeholder="Patient UUID" />
              </div>
              <Button type="submit" size="sm" disabled={saving || !selectedProgramme || !patientId.trim()}>
                Enrol patient
              </Button>
            </form>
            <form onSubmit={handleInvite} className="space-y-3 border-t border-border pt-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="Patient email" type="email" />
                <Input value={inviteName} onChange={(event) => setInviteName(event.target.value)} placeholder="Full name" />
                <Input value={invitePhone} onChange={(event) => setInvitePhone(event.target.value)} placeholder="Mobile money phone" />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={saving || !selectedProgramme || !inviteEmail.trim()}>
                <Send className="size-4" />
                Invite patient
              </Button>
            </form>
          </PanelBody>
        </Panel>

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
                    <p className="text-sm font-semibold text-text">{enrolment.patient.fullName ?? enrolment.patient.email ?? enrolment.patient.id}</p>
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

        <Panel>
          <PanelHeader>
            <PanelTitle icon={Users}>Care Team And Activation</PanelTitle>
          </PanelHeader>
          <PanelBody className="space-y-4">
            <form onSubmit={handleAssignTeam} className="grid gap-3 sm:grid-cols-2">
              <Input value={teamRole} onChange={(event) => setTeamRole(event.target.value)} placeholder="Role, e.g. nurse" />
              <Input value={teamUserId} onChange={(event) => setTeamUserId(event.target.value)} placeholder="User UUID" />
              <Input value={teamProviderId} onChange={(event) => setTeamProviderId(event.target.value)} placeholder="Provider UUID, optional" />
              <Button type="submit" size="sm" disabled={saving || !selectedEnrolmentId || (!teamUserId.trim() && !teamProviderId.trim())}>
                Assign care team
              </Button>
            </form>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" disabled={saving || !selectedEnrolmentId} onClick={() => void run(() => activateEnrolment({ variables: { enrolmentId: selectedEnrolmentId } }))}>
                Activate enrolment
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={saving || !selectedEnrolmentId} onClick={() => void run(() => pauseEnrolment({ variables: { enrolmentId: selectedEnrolmentId, reason: reason || undefined } }))}>
                Pause
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={saving || !selectedEnrolmentId} onClick={() => void run(() => resumeEnrolment({ variables: { enrolmentId: selectedEnrolmentId } }))}>
                Resume
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={saving || !selectedEnrolmentId || !reason.trim()} onClick={() => void run(() => withdrawEnrolment({ variables: { enrolmentId: selectedEnrolmentId, reason } }))}>
                Withdraw
              </Button>
            </div>
          </PanelBody>
        </Panel>
      </div>
    </div>
  );
}
