"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertCircle, CheckCircle2, ClipboardCheck, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import {
  ADD_PATIENT_MONITORING_REQUIREMENT_MUTATION,
  APPROVE_ACTIVATE_PROGRAMME_CARE_PLAN_MUTATION,
  APPROVE_PROGRAMME_BASELINE_MUTATION,
  CREATE_PROGRAMME_CARE_PLAN_MUTATION,
  CREATE_PROGRAMME_CARE_PLAN_REVISION_MUTATION,
  DEACTIVATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  EFFECTIVE_MONITORING_REQUIREMENTS_QUERY,
  EXPECTED_MONITORING_WINDOWS_QUERY,
  MONITORING_GAP_HISTORY_QUERY,
  PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY,
  PATIENT_PROGRAMME_ENROLMENTS_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  PROGRAMME_ENROLMENT_READINESS_QUERY,
  RETURN_PROGRAMME_BASELINE_MUTATION,
  SUBMIT_PROGRAMME_CARE_PLAN_MUTATION,
  UPDATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  type EnrolmentReadiness,
  type ExpectedMonitoringWindow,
  type MonitoringGap,
  type ProgrammeBaselineAssessment,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeMonitoringRequirement,
} from "@/lib/programmes/graphql";
import { Icons } from "@/components/ui/icons";

type EnrolmentsData = {
  clinicProgrammeEnrolments: ProgrammeEnrolment[];
};

type ReadinessData = {
  programmeEnrolmentReadiness: EnrolmentReadiness;
};

type BaselineData = {
  programmeCurrentBaseline: ProgrammeBaselineAssessment | null;
};

type CarePlanData = {
  programmeCurrentCarePlan: ProgrammeCarePlan | null;
};

type RequirementsData = {
  effectiveMonitoringRequirements: ProgrammeMonitoringRequirement[];
};

type WindowsData = {
  expectedMonitoringWindows: {
    items: ExpectedMonitoringWindow[];
    total: number;
  };
};

type GapsData = {
  monitoringGapHistory: {
    items: MonitoringGap[];
    total: number;
  };
};

type AdherenceData = {
  patientMonitoringAdherenceSummary: {
    counts: string;
    openGapCount: number;
    consecutiveMissedCount: number;
  };
};

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function statusVariant(status: string | null | undefined) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "APPROVED" || normalized === "ACTIVE" || normalized === "SATISFIED") return "success" as const;
  if (normalized === "RETURNED" || normalized === "PAUSED" || normalized === "DUE") return "warning" as const;
  if (normalized === "MISSED" || normalized === "WITHDRAWN") return "danger" as const;
  return "secondary" as const;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function mapError(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The programme record could not be updated.";
}

function ReadinessPanel({ readiness }: { readiness: EnrolmentReadiness }) {
  const checks = [
    ["Baseline approved", readiness.baselineApproved],
    ["Lead provider assigned", readiness.leadProviderAssigned],
    ["Active care plan", readiness.carePlanActive],
    ["Monitoring configured", readiness.hasMonitoringRequirements],
    ["Programme active", readiness.programmeActive],
  ] as const;

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={ClipboardCheck} count={readiness.blockers.length} countTone="warning">
          Activation Readiness
        </PanelTitle>
        <Badge variant={readiness.ready ? "success" : "warning"}>{readiness.ready ? "Ready" : "Blocked"}</Badge>
      </PanelHeader>
      <PanelBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {checks.map(([label, passed]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={`size-4 ${passed ? "text-success" : "text-muted"}`} />
              <span className={passed ? "text-text" : "text-muted"}>{label}</span>
            </div>
          ))}
        </div>
        {readiness.blockers.length > 0 ? (
          <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-warning">Blockers</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {readiness.blockers.map((blocker) => (
                <li key={blocker}>{titleCase(blocker)}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </PanelBody>
    </Panel>
  );
}

function BaselineReviewPanel({
  baseline,
  onChanged,
}: {
  baseline: ProgrammeBaselineAssessment | null;
  onChanged: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [approve, approveState] = useMutation(APPROVE_PROGRAMME_BASELINE_MUTATION);
  const [returnBaseline, returnState] = useMutation(RETURN_PROGRAMME_BASELINE_MUTATION);
  const saving = approveState.loading || returnState.loading;

  async function handleApprove() {
    if (!baseline) return;
    setError(null);
    try {
      await approve({ variables: { baselineId: baseline.id, note: note || undefined } });
      setNote("");
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleReturn() {
    if (!baseline) return;
    setError(null);
    try {
      await returnBaseline({ variables: { baselineId: baseline.id, note: note || undefined } });
      setNote("");
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.records}>Baseline Review</PanelTitle>
        <Badge variant={statusVariant(baseline?.status)}>{titleCase(baseline?.status)}</Badge>
      </PanelHeader>
      {!baseline ? (
        <PanelEmpty>No programme baseline has been started for this enrolment.</PanelEmpty>
      ) : (
        <PanelBody className="space-y-4">
          {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <p className="text-muted">Version <span className="font-medium text-text">{baseline.versionNumber}</span></p>
            <p className="text-muted">Submitted <span className="font-medium text-text">{formatDateTime(baseline.submittedAt)}</span></p>
          </div>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Clinical review note"
            className="min-h-20"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={saving || baseline.status === "APPROVED"} onClick={() => void handleApprove()}>
              Approve baseline
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={saving || baseline.status === "APPROVED"} onClick={() => void handleReturn()}>
              Return for correction
            </Button>
          </div>
        </PanelBody>
      )}
    </Panel>
  );
}

function CarePlanPanel({
  enrolmentId,
  carePlan,
  onChanged,
}: {
  enrolmentId: string;
  carePlan: ProgrammeCarePlan | null;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("Diabetes continuity care plan");
  const [summary, setSummary] = useState("");
  const [instructions, setInstructions] = useState("");
  const [goals, setGoals] = useState("Maintain safe fasting glucose\nReduce missed readings");
  const [followUpSchedule, setFollowUpSchedule] = useState("Care coordinator check-in weekly\nClinician review every 30 days");
  const [labFollowUp, setLabFollowUp] = useState("HbA1c review every 90 days");
  const [medicationReview, setMedicationReview] = useState("Review adherence, side effects, and refill risk at every clinician review.");
  const [internalNotes, setInternalNotes] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createPlan, createState] = useMutation(CREATE_PROGRAMME_CARE_PLAN_MUTATION);
  const [createRevision, revisionState] = useMutation(CREATE_PROGRAMME_CARE_PLAN_REVISION_MUTATION);
  const [submitPlan, submitState] = useMutation(SUBMIT_PROGRAMME_CARE_PLAN_MUTATION);
  const [approvePlan, approveState] = useMutation(APPROVE_ACTIVATE_PROGRAMME_CARE_PLAN_MUTATION);
  const saving = createState.loading || revisionState.loading || submitState.loading || approveState.loading;

  function carePlanPayload() {
    return {
      title,
      summary,
      goalsJson: goals
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
        .map((description) => ({ description, status: "active" })),
      followUpScheduleJson: {
        items: followUpSchedule
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((description) => ({ description })),
      },
      laboratoryFollowUpJson: {
        items: labFollowUp
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
          .map((description) => ({ description })),
      },
      medicationReviewJson: { notes: medicationReview },
      patientInstructions: instructions,
      internalNotes: internalNotes || undefined,
      revisionReason: revisionReason || undefined,
    };
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await createPlan({
        variables: {
          enrolmentId,
          data: carePlanPayload(),
        },
      });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleRevision(event: FormEvent) {
    event.preventDefault();
    if (!carePlan) return;
    setError(null);
    try {
      await createRevision({
        variables: {
          carePlanId: carePlan.id,
          data: carePlanPayload(),
        },
      });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleLifecycle(action: "submit" | "activate") {
    if (!carePlan) return;
    setError(null);
    try {
      await (action === "submit" ? submitPlan : approvePlan)({ variables: { carePlanId: carePlan.id } });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.records}>Programme Care Plan</PanelTitle>
        <Badge variant={statusVariant(carePlan?.status)}>{titleCase(carePlan?.status)}</Badge>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        {carePlan ? (
          <>
            <div>
              <p className="text-sm font-semibold text-text">{carePlan.title}</p>
              {carePlan.summary ? <p className="mt-1 text-sm leading-6 text-muted">{carePlan.summary}</p> : null}
              {carePlan.patientInstructions ? (
                <p className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
                  {carePlan.patientInstructions}
                </p>
              ) : null}
              {carePlan.internalNotes ? (
                <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                  Provider notes: {carePlan.internalNotes}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={saving || carePlan.status !== "DRAFT"} onClick={() => void handleLifecycle("submit")}>
                Submit for approval
              </Button>
              <Button type="button" size="sm" disabled={saving || !["DRAFT", "PENDING_APPROVAL"].includes(carePlan.status)} onClick={() => void handleLifecycle("activate")}>
                Approve and activate
              </Button>
            </div>
            <form onSubmit={(event) => void handleRevision(event)} className="space-y-3 border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Revision draft</p>
              <StructuredCarePlanFields
                title={title}
                summary={summary}
                instructions={instructions}
                goals={goals}
                followUpSchedule={followUpSchedule}
                labFollowUp={labFollowUp}
                medicationReview={medicationReview}
                internalNotes={internalNotes}
                revisionReason={revisionReason}
                onTitle={setTitle}
                onSummary={setSummary}
                onInstructions={setInstructions}
                onGoals={setGoals}
                onFollowUpSchedule={setFollowUpSchedule}
                onLabFollowUp={setLabFollowUp}
                onMedicationReview={setMedicationReview}
                onInternalNotes={setInternalNotes}
                onRevisionReason={setRevisionReason}
              />
              <Button type="submit" size="sm" variant="secondary" disabled={saving || !title.trim() || !revisionReason.trim()}>
                Create revision
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={(event) => void handleCreate(event)} className="space-y-3">
            <StructuredCarePlanFields
              title={title}
              summary={summary}
              instructions={instructions}
              goals={goals}
              followUpSchedule={followUpSchedule}
              labFollowUp={labFollowUp}
              medicationReview={medicationReview}
              internalNotes={internalNotes}
              revisionReason={revisionReason}
              onTitle={setTitle}
              onSummary={setSummary}
              onInstructions={setInstructions}
              onGoals={setGoals}
              onFollowUpSchedule={setFollowUpSchedule}
              onLabFollowUp={setLabFollowUp}
              onMedicationReview={setMedicationReview}
              onInternalNotes={setInternalNotes}
              onRevisionReason={setRevisionReason}
            />
            <Button type="submit" size="sm" disabled={saving || !title.trim()}>
              <Plus className="size-4" />
              Create care plan
            </Button>
          </form>
        )}
      </PanelBody>
    </Panel>
  );
}

function StructuredCarePlanFields({
  title,
  summary,
  instructions,
  goals,
  followUpSchedule,
  labFollowUp,
  medicationReview,
  internalNotes,
  revisionReason,
  onTitle,
  onSummary,
  onInstructions,
  onGoals,
  onFollowUpSchedule,
  onLabFollowUp,
  onMedicationReview,
  onInternalNotes,
  onRevisionReason,
}: {
  title: string;
  summary: string;
  instructions: string;
  goals: string;
  followUpSchedule: string;
  labFollowUp: string;
  medicationReview: string;
  internalNotes: string;
  revisionReason: string;
  onTitle: (value: string) => void;
  onSummary: (value: string) => void;
  onInstructions: (value: string) => void;
  onGoals: (value: string) => void;
  onFollowUpSchedule: (value: string) => void;
  onLabFollowUp: (value: string) => void;
  onMedicationReview: (value: string) => void;
  onInternalNotes: (value: string) => void;
  onRevisionReason: (value: string) => void;
}) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="programme-care-plan-title">Title</Label>
          <Input id="programme-care-plan-title" value={title} onChange={(event) => onTitle(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="programme-care-plan-summary">Summary</Label>
          <Input id="programme-care-plan-summary" value={summary} onChange={(event) => onSummary(event.target.value)} />
        </div>
      </div>
      <Textarea value={goals} onChange={(event) => onGoals(event.target.value)} placeholder="Goals, one per line" className="min-h-20" />
      <Textarea value={followUpSchedule} onChange={(event) => onFollowUpSchedule(event.target.value)} placeholder="Follow-up schedule, one item per line" className="min-h-20" />
      <Textarea value={labFollowUp} onChange={(event) => onLabFollowUp(event.target.value)} placeholder="Lab follow-up, one item per line" className="min-h-20" />
      <Textarea value={medicationReview} onChange={(event) => onMedicationReview(event.target.value)} placeholder="Medication review notes" className="min-h-20" />
      <Textarea value={instructions} onChange={(event) => onInstructions(event.target.value)} placeholder="Patient instructions" className="min-h-20" />
      <Textarea value={internalNotes} onChange={(event) => onInternalNotes(event.target.value)} placeholder="Provider-only internal notes" className="min-h-20" />
      <Input value={revisionReason} onChange={(event) => onRevisionReason(event.target.value)} placeholder="Revision reason, required when revising an active plan" />
    </>
  );
}

function MonitoringSchedulePanel({
  enrolmentId,
  requirements,
  windows,
  onChanged,
}: {
  enrolmentId: string;
  requirements: ProgrammeMonitoringRequirement[];
  windows: ExpectedMonitoringWindow[];
  onChanged: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [selectedRequirementId, setSelectedRequirementId] = useState<string | null>(null);
  const [observationType, setObservationType] = useState("glucose");
  const [observationContext, setObservationContext] = useState("fasting");
  const [cadenceType, setCadenceType] = useState("daily");
  const [intervalDays, setIntervalDays] = useState("1");
  const [frequencyPerInterval, setFrequencyPerInterval] = useState("1");
  const [applicableDays, setApplicableDays] = useState("monday,tuesday,wednesday,thursday,friday,saturday,sunday");
  const [timeOfDay, setTimeOfDay] = useState("07:00");
  const [reminders, setReminders] = useState("08:00");
  const [gracePeriodDays, setGracePeriodDays] = useState("1");
  const [addRequirement, addState] = useMutation(ADD_PATIENT_MONITORING_REQUIREMENT_MUTATION);
  const [updateRequirement, updateState] = useMutation(UPDATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION);
  const [deactivateRequirement, deactivateState] = useMutation(DEACTIVATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION);
  const saving = addState.loading || updateState.loading || deactivateState.loading;

  function requirementPayload() {
    return {
      observationType,
      observationContext,
      required: true,
      cadenceType,
      intervalDays: Number(intervalDays) || undefined,
      frequencyPerInterval: Number(frequencyPerInterval) || undefined,
      applicableDaysJson: applicableDays
        .split(",")
        .map((day) => day.trim())
        .filter(Boolean),
      timeOfDay: timeOfDay || undefined,
      reminderConfigJson: {
        reminders: reminders
          .split(",")
          .map((time) => time.trim())
          .filter(Boolean)
          .map((time) => ({ time })),
      },
      gracePeriodDays: Number(gracePeriodDays) || 0,
    };
  }

  function loadRequirement(requirement: ProgrammeMonitoringRequirement) {
    setSelectedRequirementId(requirement.id);
    setObservationType(requirement.observationType ?? "glucose");
    setObservationContext(requirement.observationContext ?? "");
    setCadenceType(requirement.cadenceType ?? "daily");
    setIntervalDays(String(requirement.intervalDays ?? 1));
    setFrequencyPerInterval(String(requirement.frequencyPerInterval ?? 1));
    setApplicableDays(Array.isArray(requirement.applicableDaysJson) ? requirement.applicableDaysJson.join(",") : "");
    setTimeOfDay(requirement.timeOfDay ?? "");
    setGracePeriodDays(String(requirement.gracePeriodDays ?? 0));
  }

  async function handleSaveRequirement(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (selectedRequirementId) {
        await updateRequirement({
          variables: { requirementId: selectedRequirementId, data: requirementPayload() },
        });
      } else {
        await addRequirement({
          variables: {
            enrolmentId,
            data: requirementPayload(),
          },
        });
      }
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleDeactivate(requirementId: string) {
    setError(null);
    try {
      await deactivateRequirement({ variables: { requirementId } });
      if (selectedRequirementId === requirementId) setSelectedRequirementId(null);
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icons.monitoring} count={requirements.length}>
          Monitoring Schedule
        </PanelTitle>
        <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedRequirementId(null)}>
          New requirement
        </Button>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <form onSubmit={(event) => void handleSaveRequirement(event)} className="space-y-3 rounded-lg border border-border bg-background p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="requirement-observation">Observation type</Label>
              <Input id="requirement-observation" value={observationType} onChange={(event) => setObservationType(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-context">Context</Label>
              <Input id="requirement-context" value={observationContext} onChange={(event) => setObservationContext(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-cadence">Cadence</Label>
              <Input id="requirement-cadence" value={cadenceType} onChange={(event) => setCadenceType(event.target.value)} placeholder="daily, weekly, interval" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-interval">Interval days</Label>
              <Input id="requirement-interval" type="number" min={1} value={intervalDays} onChange={(event) => setIntervalDays(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-frequency">Frequency</Label>
              <Input id="requirement-frequency" type="number" min={1} value={frequencyPerInterval} onChange={(event) => setFrequencyPerInterval(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-time">Time of day</Label>
              <Input id="requirement-time" type="time" value={timeOfDay} onChange={(event) => setTimeOfDay(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-grace">Grace days</Label>
              <Input id="requirement-grace" type="number" min={0} value={gracePeriodDays} onChange={(event) => setGracePeriodDays(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="requirement-reminders">Reminder times</Label>
              <Input id="requirement-reminders" value={reminders} onChange={(event) => setReminders(event.target.value)} placeholder="08:00,18:00" />
            </div>
          </div>
          <Textarea value={applicableDays} onChange={(event) => setApplicableDays(event.target.value)} placeholder="Applicable days, comma-separated" className="min-h-16" />
          <Button type="submit" size="sm" disabled={saving || !observationType.trim()}>
            {selectedRequirementId ? "Update requirement" : "Add requirement"}
          </Button>
        </form>
        {requirements.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            No active programme monitoring requirements.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <div key={requirement.id} className="rounded-lg border border-border bg-background px-4 py-3">
                <p className="text-sm font-semibold text-text">{titleCase(requirement.observationContext ?? requirement.observationType)}</p>
                <p className="mt-1 text-xs text-muted">
                  {titleCase(requirement.cadenceType)} · {requirement.timeOfDay ?? "any time"} · grace {requirement.gracePeriodDays ?? 0} days
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => loadRequirement(requirement)}>
                    Edit
                  </Button>
                  <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => void handleDeactivate(requirement.id)}>
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Upcoming windows</p>
          {windows.length === 0 ? (
            <p className="text-sm text-muted">No expected windows available.</p>
          ) : (
            <div className="space-y-2">
              {windows.slice(0, 4).map((window) => (
                <div key={window.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                  <span className="text-text">{titleCase(window.observationContext ?? window.observationType)}</span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {formatDateTime(window.dueAt)}
                    <Badge variant={statusVariant(window.status)}>{titleCase(window.status)}</Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PanelBody>
    </Panel>
  );
}

function GapAdherencePanel({
  gaps,
  adherence,
}: {
  gaps: MonitoringGap[];
  adherence?: AdherenceData["patientMonitoringAdherenceSummary"];
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={AlertCircle} count={adherence?.openGapCount ?? gaps.length} countTone="warning">
          Gaps And Adherence
        </PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <StatTile
            label="Open Gaps"
            value={adherence?.openGapCount ?? gaps.length}
            sublabel="missed monitoring"
            icon={Icons.warning}
            tone={(adherence?.openGapCount ?? gaps.length) > 0 ? "warning" : "success"}
          />
          <StatTile
            label="Consecutive Misses"
            value={adherence?.consecutiveMissedCount ?? 0}
            sublabel="current risk signal"
            icon={Icons.monitoring}
            tone={(adherence?.consecutiveMissedCount ?? 0) > 0 ? "danger" : "neutral"}
          />
        </div>
        {gaps.length === 0 ? (
          <p className="text-sm text-muted">No monitoring gaps for this enrolment.</p>
        ) : (
          <div className="space-y-2">
            {gaps.slice(0, 4).map((gap) => (
              <div key={gap.id} className="rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text">{titleCase(gap.observationContext ?? gap.observationType)}</p>
                  <Badge variant={statusVariant(gap.status)}>{titleCase(gap.status)}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Due {formatDateTime(gap.dueAt)} · {gap.consecutiveMissCount} consecutive misses
                </p>
              </div>
            ))}
          </div>
        )}
      </PanelBody>
    </Panel>
  );
}

export function PatientProgrammeContinuityPanel({ patientId }: { patientId: string }) {
  const enrolmentsQuery = useQuery<EnrolmentsData>(PATIENT_PROGRAMME_ENROLMENTS_QUERY, {
    variables: { patientId },
    fetchPolicy: "cache-and-network",
  });
  const enrolment = enrolmentsQuery.data?.clinicProgrammeEnrolments?.[0] ?? null;
  const enrolmentId = enrolment?.id;
  const readinessQuery = useQuery<ReadinessData>(PROGRAMME_ENROLMENT_READINESS_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const baselineQuery = useQuery<BaselineData>(PROGRAMME_CURRENT_BASELINE_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const carePlanQuery = useQuery<CarePlanData>(PROGRAMME_CURRENT_CARE_PLAN_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const requirementsQuery = useQuery<RequirementsData>(EFFECTIVE_MONITORING_REQUIREMENTS_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const windowsQuery = useQuery<WindowsData>(EXPECTED_MONITORING_WINDOWS_QUERY, {
    variables: { enrolmentId, limit: 8 },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const gapsQuery = useQuery<GapsData>(MONITORING_GAP_HISTORY_QUERY, {
    variables: { enrolmentId, limit: 8 },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const adherenceQuery = useQuery<AdherenceData>(PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });

  function refetchProgramme() {
    void enrolmentsQuery.refetch();
    void readinessQuery.refetch();
    void baselineQuery.refetch();
    void carePlanQuery.refetch();
    void requirementsQuery.refetch();
    void windowsQuery.refetch();
    void gapsQuery.refetch();
    void adherenceQuery.refetch();
  }

  if (enrolmentsQuery.loading && !enrolment) {
    return <div className="h-72 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <Panel>
        <PanelEmpty>
          <p className="font-medium text-text">No diabetes programme enrolment</p>
          <p className="mt-1 text-xs text-muted">Enrol this patient in a clinic programme before baseline and care-plan work.</p>
        </PanelEmpty>
      </Panel>
    );
  }

  const readiness = readinessQuery.data?.programmeEnrolmentReadiness;
  const baseline = baselineQuery.data?.programmeCurrentBaseline ?? null;
  const carePlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const requirements = requirementsQuery.data?.effectiveMonitoringRequirements ?? [];
  const windows = windowsQuery.data?.expectedMonitoringWindows.items ?? [];
  const gaps = gapsQuery.data?.monitoringGapHistory.items ?? [];
  const adherence = adherenceQuery.data?.patientMonitoringAdherenceSummary;

  return (
    <div className="space-y-6">
      <Panel>
        <PanelHeader>
          <PanelTitle icon={Icons.health}>Diabetes Programme</PanelTitle>
          <Badge variant={statusVariant(enrolment.status)}>{titleCase(enrolment.status)}</Badge>
        </PanelHeader>
        <PanelBody>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-lg font-semibold text-text">{enrolment.programme.name}</p>
              <p className="mt-1 text-sm text-muted">
                Lead provider: {enrolment.leadProvider?.displayName ?? "Not assigned"}
              </p>
            </div>
            <p className="text-sm text-muted">
              Monitoring cadence: every {enrolment.monitoringCadenceDays} day{enrolment.monitoringCadenceDays === 1 ? "" : "s"}
            </p>
          </div>
        </PanelBody>
      </Panel>

      {readiness ? <ReadinessPanel readiness={readiness} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <BaselineReviewPanel baseline={baseline} onChanged={refetchProgramme} />
        <CarePlanPanel enrolmentId={enrolment.id} carePlan={carePlan} onChanged={refetchProgramme} />
        <MonitoringSchedulePanel
          enrolmentId={enrolment.id}
          requirements={requirements}
          windows={windows}
          onChanged={refetchProgramme}
        />
        <GapAdherencePanel gaps={gaps} adherence={adherence} />
      </div>
    </div>
  );
}
