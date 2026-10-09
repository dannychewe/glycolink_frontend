"use client";

import { FormEvent, useEffect, useState } from "react";
import { useUrlState } from "@/lib/use-url-state";
import { useMutation, useQuery } from "@apollo/client";
import type { ApolloError } from "@apollo/client";
import { AlertCircle, CalendarRange, CheckCircle2, ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { ProgrammeSharedPlansReadOnly } from "./ProgrammeSharedPlansReadOnly";
import { ProgrammeEnrolmentActions } from "./ProgrammeEnrolmentActions";
import {
  Panel,
  PanelBody,
  PanelEmpty,
  PanelHeader,
  PanelList,
  PanelTitle,
  StatTile,
} from "@/components/ui/panel";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/auth-context";
import { hasProgrammePermission } from "@/lib/programmes/permissions";
import { monitoringFieldErrors, reminderFormValues, reminderPayload, REMINDER_SETTING_LABELS, type ReminderFormValues } from "@/lib/programmes/monitoring-requirement-form";
import {
  ADD_PATIENT_MONITORING_REQUIREMENT_MUTATION,
  APPROVE_ACTIVATE_PROGRAMME_CARE_PLAN_MUTATION,
  APPROVE_PROGRAMME_BASELINE_MUTATION,
  CREATE_PROGRAMME_CARE_PLAN_MUTATION,
  CREATE_PROGRAMME_CARE_PLAN_REVISION_MUTATION,
  DEACTIVATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  EFFECTIVE_MONITORING_REQUIREMENTS_QUERY,
  EXPECTED_MONITORING_WINDOWS_QUERY,
  GENERATE_PROGRAMME_SCHEDULE_MUTATION,
  MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION,
  MONITORING_GAP_HISTORY_QUERY,
  MONITORING_REQUIREMENT_CONFIGURATION_QUERY,
  PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY,
  PATIENT_PROGRAMME_ENROLMENTS_QUERY,
  PROGRAMME_CURRENT_BASELINE_QUERY,
  PROGRAMME_CURRENT_CARE_PLAN_QUERY,
  PROGRAMME_ENROLMENT_READINESS_QUERY,
  PROGRAMME_SCHEDULE_QUERY,
  RETURN_PROGRAMME_BASELINE_MUTATION,
  SKIP_PROGRAMME_SCHEDULE_ITEM_MUTATION,
  SUBMIT_PROGRAMME_CARE_PLAN_MUTATION,
  UPDATE_DRAFT_PROGRAMME_CARE_PLAN_MUTATION,
  UPDATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  type EnrolmentReadiness,
  type ExpectedMonitoringWindow,
  type MonitoringGap,
  type MonitoringRequirementConfiguration,
  type ProgrammeBaselineAssessment,
  type ProgrammeCarePlan,
  type ProgrammeEnrolment,
  type ProgrammeMonitoringRequirement,
  type ProgrammeScheduleItem,
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

type ScheduleData = {
  programmeSchedule: ProgrammeScheduleItem[];
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

type ScheduleTemplateItem = {
  id: string;
  title: string;
  eventType: string;
  day: string;
  endDay: string;
  description: string;
};

const scheduleEventOptions = [
  { value: "measurement_task", label: "Measurement task" },
  { value: "consultant_review", label: "Consultant review" },
  { value: "video_consultation", label: "Video consultation" },
  { value: "medication_check", label: "Medication check" },
  { value: "lab_reminder", label: "Lab reminder" },
  { value: "education", label: "Education" },
  { value: "care_team_check_in", label: "Care team check-in" },
  { value: "payment_renewal", label: "Payment renewal" },
  { value: "programme_review", label: "Programme review" },
];

const defaultScheduleTemplate: ScheduleTemplateItem[] = [
  { id: "welcome", title: "Welcome and care plan review", eventType: "care_team_check_in", day: "1", endDay: "", description: "Confirm goals, monitoring expectations, and how follow-up will work." },
  { id: "fasting", title: "Daily fasting glucose", eventType: "measurement_task", day: "1", endDay: "7", description: "Log fasting glucose every morning before the first review." },
  { id: "review", title: "First glucose trend review", eventType: "consultant_review", day: "7", endDay: "", description: "Consultant reviews early readings and adjusts care direction if needed." },
  { id: "video", title: "Video follow-up consultation", eventType: "video_consultation", day: "14", endDay: "", description: "Remote review of progress, medication tolerance, and next steps." },
  { id: "close", title: "Programme progress review", eventType: "programme_review", day: "30", endDay: "", description: "Review outcomes and agree renewal, maintenance, or discharge plan." },
];

function textLinesFromItems(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "description" in item) return String(item.description ?? "");
        if (item && typeof item === "object" && "label" in item) return String(item.label ?? "");
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  if (value && typeof value === "object" && "items" in value) {
    return textLinesFromItems((value as { items?: unknown }).items);
  }
  return "";
}

function scheduleItemsFromJson(value: unknown): ScheduleTemplateItem[] {
  const rawItems = value && typeof value === "object" && "items" in value ? (value as { items?: unknown }).items : value;
  if (!Array.isArray(rawItems)) return defaultScheduleTemplate;
  const parsed = rawItems
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const title = String(raw.title ?? raw.label ?? raw.description ?? "").trim();
      if (!title) return null;
      return {
        id: `existing-${index}-${title}`,
        title,
        eventType: String(raw.eventType ?? raw.event_type ?? raw.type ?? "care_team_check_in"),
        day: String(raw.day ?? raw.dayNumber ?? raw.offsetDays ?? raw.offset_days ?? index + 1),
        endDay: String(raw.endDay ?? raw.end_day ?? raw.untilDay ?? raw.until_day ?? ""),
        description: String(raw.description ?? raw.detail ?? ""),
      };
    })
    .filter((item): item is ScheduleTemplateItem => Boolean(item));
  return parsed.length ? parsed : defaultScheduleTemplate;
}

function goalsFromJson(value: unknown) {
  if (!Array.isArray(value)) return "Maintain safe fasting glucose\nReduce missed readings";
  const lines = value
    .map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object" && "description" in item) return String(item.description ?? "");
      if (item && typeof item === "object" && "label" in item) return String(item.label ?? "");
      return "";
    })
    .filter(Boolean);
  return lines.length ? lines.join("\n") : "Maintain safe fasting glucose\nReduce missed readings";
}

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
  canManage,
}: {
  baseline: ProgrammeBaselineAssessment | null;
  onChanged: () => void;
  canManage: boolean;
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
            <Button type="button" size="sm" disabled={!canManage || saving || baseline.status === "APPROVED"} onClick={() => void handleApprove()}>
              Approve baseline
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={!canManage || saving || baseline.status === "APPROVED"} onClick={() => void handleReturn()}>
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
  canManage,
}: {
  enrolmentId: string;
  carePlan: ProgrammeCarePlan | null;
  onChanged: () => void;
  canManage: boolean;
}) {
  const [title, setTitle] = useState("Diabetes continuity care plan");
  const [summary, setSummary] = useState("");
  const [instructions, setInstructions] = useState("");
  const [goals, setGoals] = useState("Maintain safe fasting glucose\nReduce missed readings");
  const [scheduleItems, setScheduleItems] = useState<ScheduleTemplateItem[]>(defaultScheduleTemplate);
  const [labFollowUp, setLabFollowUp] = useState("HbA1c review every 90 days");
  const [medicationReview, setMedicationReview] = useState("Review adherence, side effects, and refill risk at every clinician review.");
  const [internalNotes, setInternalNotes] = useState("");
  const [revisionReason, setRevisionReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createPlan, createState] = useMutation(CREATE_PROGRAMME_CARE_PLAN_MUTATION);
  const [updatePlan, updateState] = useMutation(UPDATE_DRAFT_PROGRAMME_CARE_PLAN_MUTATION);
  const [createRevision, revisionState] = useMutation(CREATE_PROGRAMME_CARE_PLAN_REVISION_MUTATION);
  const [submitPlan, submitState] = useMutation(SUBMIT_PROGRAMME_CARE_PLAN_MUTATION);
  const [approvePlan, approveState] = useMutation(APPROVE_ACTIVATE_PROGRAMME_CARE_PLAN_MUTATION);
  const saving = createState.loading || updateState.loading || revisionState.loading || submitState.loading || approveState.loading;

  useEffect(() => {
    if (!carePlan) return;
    setTitle(carePlan.title || "Diabetes continuity care plan");
    setSummary(carePlan.summary || "");
    setInstructions(carePlan.patientInstructions || "");
    setGoals(goalsFromJson(carePlan.goalsJson));
    setScheduleItems(scheduleItemsFromJson(carePlan.followUpScheduleJson));
    setLabFollowUp(textLinesFromItems(carePlan.laboratoryFollowUpJson) || "HbA1c review every 90 days");
    setMedicationReview(
      carePlan.medicationReviewJson && typeof carePlan.medicationReviewJson === "object" && "notes" in carePlan.medicationReviewJson
        ? String(carePlan.medicationReviewJson.notes ?? "")
        : "Review adherence, side effects, and refill risk at every clinician review.",
    );
    setInternalNotes(carePlan.internalNotes || "");
  }, [carePlan]);

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
        items: scheduleItems
          .filter((item) => item.title.trim() && Number(item.day) > 0)
          .map((item) => ({
            title: item.title.trim(),
            eventType: item.eventType,
            day: Number(item.day),
            endDay: Number(item.endDay) > 0 ? Number(item.endDay) : undefined,
            description: item.description.trim() || undefined,
          })),
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
      setEditOpen(false);
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
      if (carePlan.status === "DRAFT") {
        await updatePlan({
          variables: {
            carePlanId: carePlan.id,
            data: carePlanPayload(),
          },
        });
      } else {
        await createRevision({
          variables: {
            carePlanId: carePlan.id,
            data: carePlanPayload(),
          },
        });
      }
      setEditOpen(false);
      setRevisionReason("");
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

  const editing = Boolean(carePlan);
  const modalTitle = editing ? (carePlan?.status === "DRAFT" ? "Edit draft care plan" : "Create care plan revision") : "Create care plan";

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
              <Button type="button" size="sm" variant="secondary" disabled={!canManage} onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" />
                {carePlan.status === "DRAFT" ? "Edit care plan" : "Create revision"}
              </Button>
              <Button type="button" size="sm" variant="secondary" disabled={!canManage || saving || carePlan.status !== "DRAFT"} onClick={() => void handleLifecycle("submit")}>
                Submit for approval
              </Button>
              <Button type="button" size="sm" disabled={!canManage || saving || !["DRAFT", "PENDING_APPROVAL"].includes(carePlan.status)} onClick={() => void handleLifecycle("activate")}>
                Approve and activate
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background px-4 py-6 text-center">
            <p className="text-sm text-muted">No care plan yet for this enrolment.</p>
            <Button type="button" size="sm" className="mt-3" disabled={!canManage} onClick={() => setEditOpen(true)}>
              <Plus className="size-4" />
              Create care plan
            </Button>
          </div>
        )}
      </PanelBody>

      {editOpen ? (
        <DetailModal
          title={modalTitle}
          subtitle="Goals, care journey calendar, lab follow-up, and instructions."
          onClose={() => setEditOpen(false)}
          className="sm:max-w-3xl"
        >
          <form onSubmit={(event) => void (editing ? handleRevision(event) : handleCreate(event))} className="space-y-3">
            {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
            <StructuredCarePlanFields
              title={title}
              summary={summary}
              instructions={instructions}
              goals={goals}
              scheduleItems={scheduleItems}
              labFollowUp={labFollowUp}
              medicationReview={medicationReview}
              internalNotes={internalNotes}
              revisionReason={revisionReason}
              onTitle={setTitle}
              onSummary={setSummary}
              onInstructions={setInstructions}
              onGoals={setGoals}
              onScheduleItems={setScheduleItems}
              onLabFollowUp={setLabFollowUp}
              onMedicationReview={setMedicationReview}
              onInternalNotes={setInternalNotes}
              onRevisionReason={setRevisionReason}
              showRevisionReason={editing && carePlan?.status !== "DRAFT"}
            />
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button
                type="submit"
                size="sm"
                disabled={!canManage || saving || !title.trim() || (editing && carePlan?.status !== "DRAFT" && !revisionReason.trim())}
              >
                {saving ? "Saving…" : editing ? (carePlan?.status === "DRAFT" ? "Save care plan changes" : "Create revision") : "Create care plan"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

function StructuredCarePlanFields({
  title,
  summary,
  instructions,
  goals,
  scheduleItems,
  labFollowUp,
  medicationReview,
  internalNotes,
  revisionReason,
  onTitle,
  onSummary,
  onInstructions,
  onGoals,
  onScheduleItems,
  onLabFollowUp,
  onMedicationReview,
  onInternalNotes,
  onRevisionReason,
  showRevisionReason = true,
}: {
  title: string;
  summary: string;
  instructions: string;
  goals: string;
  scheduleItems: ScheduleTemplateItem[];
  labFollowUp: string;
  medicationReview: string;
  internalNotes: string;
  revisionReason: string;
  onTitle: (value: string) => void;
  onSummary: (value: string) => void;
  onInstructions: (value: string) => void;
  onGoals: (value: string) => void;
  onScheduleItems: (value: ScheduleTemplateItem[]) => void;
  onLabFollowUp: (value: string) => void;
  onMedicationReview: (value: string) => void;
  onInternalNotes: (value: string) => void;
  onRevisionReason: (value: string) => void;
  showRevisionReason?: boolean;
}) {
  function updateScheduleItem(id: string, updates: Partial<ScheduleTemplateItem>) {
    onScheduleItems(scheduleItems.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }

  function addScheduleItem() {
    onScheduleItems([
      ...scheduleItems,
      {
        id: `schedule-${Date.now()}`,
        title: "",
        eventType: "care_team_check_in",
        day: "1",
        endDay: "",
        description: "",
      },
    ]);
  }

  function removeScheduleItem(id: string) {
    onScheduleItems(scheduleItems.filter((item) => item.id !== id));
  }

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
      <div className="space-y-1.5">
        <Label htmlFor="programme-care-plan-goals">Goals</Label>
        <Textarea id="programme-care-plan-goals" value={goals} onChange={(event) => onGoals(event.target.value)} placeholder="Goals, one per line" className="min-h-20" />
      </div>
      <div className="space-y-3 rounded-lg border border-border bg-background p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-text">Care journey calendar</p>
            <p className="mt-1 text-xs text-muted">Build Day 1, Day 1-7, review, video, lab, and completion milestones.</p>
          </div>
          <Button type="button" size="sm" variant="secondary" onClick={addScheduleItem}>
            <CalendarRange className="size-4" />
            Add item
          </Button>
        </div>
        <div className="space-y-3">
          {scheduleItems.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-border bg-surface p-3">
              <div className="grid gap-3 lg:grid-cols-[1fr_180px_96px_96px_auto] lg:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`schedule-title-${item.id}`}>Title</Label>
                  <Input
                    id={`schedule-title-${item.id}`}
                    value={item.title}
                    onChange={(event) => updateScheduleItem(item.id, { title: event.target.value })}
                    placeholder={`Milestone ${index + 1}`}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`schedule-type-${item.id}`}>Type</Label>
                  <Select
                    id={`schedule-type-${item.id}`}
                    value={item.eventType}
                    options={scheduleEventOptions}
                    onChange={(event) => updateScheduleItem(item.id, { eventType: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`schedule-day-${item.id}`}>Start day</Label>
                  <Input
                    id={`schedule-day-${item.id}`}
                    type="number"
                    min={1}
                    value={item.day}
                    onChange={(event) => updateScheduleItem(item.id, { day: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`schedule-end-day-${item.id}`}>End day</Label>
                  <Input
                    id={`schedule-end-day-${item.id}`}
                    type="number"
                    min={1}
                    value={item.endDay}
                    onChange={(event) => updateScheduleItem(item.id, { endDay: event.target.value })}
                    placeholder="-"
                  />
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => removeScheduleItem(item.id)} disabled={scheduleItems.length <= 1}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <Textarea
                value={item.description}
                onChange={(event) => updateScheduleItem(item.id, { description: event.target.value })}
                placeholder="Patient-facing details for this step"
                className="mt-3 min-h-16"
              />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="programme-care-plan-lab">Lab follow-up</Label>
        <Textarea id="programme-care-plan-lab" value={labFollowUp} onChange={(event) => onLabFollowUp(event.target.value)} placeholder="Lab follow-up, one item per line" className="min-h-20" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="programme-care-plan-medication">Medication review</Label>
        <Textarea id="programme-care-plan-medication" value={medicationReview} onChange={(event) => onMedicationReview(event.target.value)} placeholder="Medication review notes" className="min-h-20" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="programme-care-plan-instructions">Patient instructions</Label>
        <Textarea id="programme-care-plan-instructions" value={instructions} onChange={(event) => onInstructions(event.target.value)} placeholder="Patient instructions" className="min-h-20" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="programme-care-plan-internal-notes">Internal notes</Label>
        <Textarea id="programme-care-plan-internal-notes" value={internalNotes} onChange={(event) => onInternalNotes(event.target.value)} placeholder="Provider-only internal notes" className="min-h-20" />
      </div>
      {showRevisionReason ? (
        <div className="space-y-1.5">
          <Label htmlFor="programme-care-plan-revision-reason">Revision reason</Label>
          <Input
            id="programme-care-plan-revision-reason"
            value={revisionReason}
            onChange={(event) => onRevisionReason(event.target.value)}
            placeholder="Required when revising an active plan"
          />
        </div>
      ) : null}
    </>
  );
}

const scheduleItemActiveStatuses = ["SCHEDULED", "DUE", "RESCHEDULED"];

function CareJourneyCalendarPanel({
  carePlan,
  items,
  onChanged,
  canManage,
}: {
  carePlan: ProgrammeCarePlan | null;
  items: ProgrammeScheduleItem[];
  onChanged: () => void;
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [generateSchedule, generateState] = useMutation(GENERATE_PROGRAMME_SCHEDULE_MUTATION);
  const [markDone, markDoneState] = useMutation(MARK_PROGRAMME_SCHEDULE_ITEM_DONE_MUTATION);
  const [skipItem, skipState] = useMutation(SKIP_PROGRAMME_SCHEDULE_ITEM_MUTATION);
  const busy = generateState.loading || markDoneState.loading || skipState.loading;
  const sortedItems = [...items].sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));

  async function handleGenerate(replace: boolean) {
    if (!carePlan) return;
    setError(null);
    try {
      await generateSchedule({ variables: { carePlanId: carePlan.id, replace } });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleMarkDone(itemId: string) {
    setError(null);
    setBusyItemId(itemId);
    try {
      await markDone({ variables: { itemId } });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleSkip(itemId: string) {
    setError(null);
    setBusyItemId(itemId);
    try {
      await skipItem({ variables: { itemId, reason: "Skipped by care team" } });
      onChanged();
    } catch (err) {
      setError(mapError(err));
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={items.length}>Care Journey Calendar</PanelTitle>
        {carePlan ? (
          <Button type="button" size="sm" variant="secondary" disabled={!canManage || busy} onClick={() => void handleGenerate(items.length > 0)}>
            {items.length > 0 ? "Regenerate from care plan" : "Generate schedule"}
          </Button>
        ) : null}
      </PanelHeader>
      <PanelBody className="space-y-3">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        {!carePlan ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            Create a care plan below, then generate its calendar here.
          </p>
        ) : null}
      </PanelBody>
      {carePlan && sortedItems.length === 0 ? (
        <PanelEmpty>No calendar generated yet. Click &ldquo;Generate schedule&rdquo; to build it from the care plan&apos;s follow-up schedule.</PanelEmpty>
      ) : null}
      {sortedItems.length > 0 ? (
        <PanelList>
          {sortedItems.map((item) => {
            const canAct = canManage && scheduleItemActiveStatuses.includes(item.status);
            const itemBusy = busyItemId === item.id;
            return (
              <div key={item.id} className="px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={statusVariant(item.status)}>
                        {item.dayNumber ? `Day ${item.dayNumber}` : titleCase(item.status)}
                      </Badge>
                      <p className="text-xs text-muted">{formatDateRange(item.scheduledDate, item.scheduledEndDate)}</p>
                    </div>
                    <p className="mt-2 break-words text-sm font-semibold text-text">{item.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {titleCase(item.eventType)}
                      {item.provider?.displayName ? ` · ${item.provider.displayName}` : ""}
                    </p>
                    {item.description ? <p className="mt-1 text-xs text-muted">{item.description}</p> : null}
                    {item.status === "SKIPPED" && item.skippedReason ? (
                      <p className="mt-1 text-xs text-muted">Skipped: {item.skippedReason}</p>
                    ) : null}
                  </div>
                  {canAct ? (
                    <div className="flex shrink-0 gap-2">
                      <Button type="button" size="sm" disabled={itemBusy} onClick={() => void handleMarkDone(item.id)}>
                        Mark done
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="text-danger"
                        disabled={itemBusy}
                        onClick={() => void handleSkip(item.id)}
                      >
                        Skip
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </PanelList>
      ) : null}
    </Panel>
  );
}

function isAdherenceAccessDenied(error?: ApolloError) {
  return error?.graphQLErrors.some((item) => item.extensions?.code === "ADHERENCE_ACCESS_DENIED") ?? false;
}

function MonitoringQueryNotice({ error, loading, label, onRetry }: {
  error?: ApolloError;
  loading: boolean;
  label: string;
  onRetry: () => void;
}) {
  if (error) {
    const denied = isAdherenceAccessDenied(error);
    return (
      <div role={denied ? "status" : "alert"} className="space-y-2 text-sm text-muted">
        <p>{denied ? `Access to ${label.toLowerCase()} is restricted to the patient's authorised monitoring team.` : `Unable to load ${label.toLowerCase()}.`}</p>
        {!denied ? (
          <Button type="button" size="sm" variant="secondary" onClick={onRetry}>Retry</Button>
        ) : null}
      </div>
    );
  }
  if (loading) return <p role="status" className="text-sm text-muted">Loading {label.toLowerCase()}...</p>;
  return null;
}

function MonitoringSchedulePanel({
  enrolmentId,
  requirements,
  windows,
  windowsError,
  windowsLoading,
  onRetryWindows,
  onChanged,
  canManage,
}: {
  enrolmentId: string;
  requirements: ProgrammeMonitoringRequirement[];
  windows: ExpectedMonitoringWindow[];
  windowsError?: ApolloError;
  windowsLoading: boolean;
  onRetryWindows: () => void;
  onChanged: () => void;
  canManage: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRequirementId, setSelectedRequirementId] = useState<
    string | null
  >(null);
  const [observationType, setObservationType] = useState("glucose");
  const [observationContext, setObservationContext] = useState("fasting");
  const [cadenceType, setCadenceType] = useState("interval_days");
  const [intervalDays, setIntervalDays] = useState("1");
  const [frequencyPerInterval, setFrequencyPerInterval] = useState("1");
  const [applicableDays, setApplicableDays] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState("07:00");
  const [reminders, setReminders] = useState<ReminderFormValues>({});
  const [loadedReminderKeys, setLoadedReminderKeys] = useState<string[]>([]);
  const [requiredReading, setRequiredReading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const configurationQuery = useQuery<{
    monitoringRequirementConfiguration: MonitoringRequirementConfiguration;
  }>(MONITORING_REQUIREMENT_CONFIGURATION_QUERY, { skip: !formOpen });
  const configuration =
    configurationQuery.data?.monitoringRequirementConfiguration;
  const cadence = configuration?.cadences.find(
    (option) => option.value === cadenceType,
  );
  const needsInterval =
    cadence?.requiredFields.includes("intervalDays") ?? false;
  const needsWeekdays =
    cadence?.requiredFields.includes("applicableDaysJson") ?? false;
  const [gracePeriodDays, setGracePeriodDays] = useState("1");
  const [addRequirement, addState] = useMutation(
    ADD_PATIENT_MONITORING_REQUIREMENT_MUTATION,
  );
  const [updateRequirement, updateState] = useMutation(
    UPDATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  );
  const [deactivateRequirement, deactivateState] = useMutation(
    DEACTIVATE_PROGRAMME_MONITORING_REQUIREMENT_MUTATION,
  );
  const saving =
    addState.loading || updateState.loading || deactivateState.loading;
  const validChoices =
    configuration?.observationTypes.some(
      (option) => option.value === observationType,
    ) &&
    configuration?.cadences.some((option) => option.value === cadenceType) &&
    (observationType !== "glucose" ||
      configuration?.glucoseContexts.some(
        (option) => option.value === observationContext,
      ));

  function requirementPayload() {
    return {
      observationType,
      observationContext:
        observationType === "glucose" ? observationContext : "",
      required: requiredReading,
      cadenceType,
      intervalDays: needsInterval ? Number(intervalDays) : null,
      frequencyPerInterval: Number(frequencyPerInterval),
      applicableDaysJson: needsWeekdays ? applicableDays : [],
      timeOfDay,
      reminderConfigJson: configuration
        ? reminderPayload(configuration, reminders)
        : {},
      gracePeriodDays: Number(gracePeriodDays),
    };
  }

  function resetRequirementForm() {
    setSelectedRequirementId(null);
    setObservationType("glucose");
    setObservationContext("fasting");
    setCadenceType("interval_days");
    setIntervalDays("1");
    setFrequencyPerInterval("1");
    setApplicableDays([]);
    setTimeOfDay("07:00");
    setReminders({});
    setLoadedReminderKeys([]);
    setRequiredReading(true);
    setFieldErrors({});
    setError(null);
    setGracePeriodDays("1");
  }

  function loadRequirement(requirement: ProgrammeMonitoringRequirement) {
    setSelectedRequirementId(requirement.id);
    setObservationType(requirement.observationType?.toLowerCase() ?? "glucose");
    setObservationContext(requirement.observationContext?.toLowerCase() ?? "");
    setCadenceType(requirement.cadenceType?.toLowerCase() ?? "interval_days");
    setIntervalDays(String(requirement.intervalDays ?? 1));
    setFrequencyPerInterval(String(requirement.frequencyPerInterval ?? 1));
    setApplicableDays(
      Array.isArray(requirement.applicableDaysJson)
        ? requirement.applicableDaysJson.filter(
            (day): day is string => typeof day === "string",
          )
        : [],
    );
    setTimeOfDay(requirement.timeOfDay ?? "");
    setGracePeriodDays(String(requirement.gracePeriodDays ?? 0));
    setReminders(reminderFormValues(requirement.reminderConfigJson));
    setLoadedReminderKeys(
      requirement.reminderConfigJson &&
        typeof requirement.reminderConfigJson === "object" &&
        !Array.isArray(requirement.reminderConfigJson)
        ? Object.keys(requirement.reminderConfigJson)
        : [],
    );
    setRequiredReading(requirement.required);
    setFieldErrors({});
    setError(null);
  }

  async function handleSaveRequirement(event: FormEvent) {
    event.preventDefault();
    if (!canManage || saving) return;
    setFieldErrors({});
    if (!validChoices) {
      setError("Select a supported observation type, context, and cadence.");
      return;
    }
    if (!configuration) return;
    const validation: Record<string, string> = {};
    if (configuration.timeOfDayRequired && !timeOfDay)
      validation.timeOfDay = "Choose a time of day.";
    if (
      needsInterval &&
      (!intervalDays ||
        !Number.isInteger(Number(intervalDays)) ||
        Number(intervalDays) < 1)
    )
      validation.intervalDays = "Enter a positive whole number.";
    if (
      needsWeekdays &&
      (!applicableDays.length ||
        applicableDays.some(
          (day) =>
            !configuration.weekdays.some((option) => option.value === day),
        ))
    )
      validation.applicableDaysJson = "Select valid weekdays.";
    if (
      !frequencyPerInterval ||
      !Number.isInteger(Number(frequencyPerInterval)) ||
      Number(frequencyPerInterval) < 1 ||
      Number(frequencyPerInterval) > configuration.maxFrequencyPerInterval
    )
      validation.frequencyPerInterval = `Choose between 1 and ${configuration.maxFrequencyPerInterval} readings per interval.`;
    if (
      !gracePeriodDays ||
      !Number.isInteger(Number(gracePeriodDays)) ||
      Number(gracePeriodDays) < 0
    )
      validation.gracePeriodDays = "Enter a nonnegative whole number.";
    for (const setting of configuration.reminderSettings) {
      if (setting.valueType === "boolean") continue;
      const value = reminders[setting.key] ?? setting.defaultValue;
      if (setting.nullable && (value === "" || value === null)) continue;
      if (
        value === "" ||
        value === null ||
        !Number.isInteger(Number(value)) ||
        Number(value) < 1
      )
        validation[`reminderConfigJson.${setting.key}`] =
          "Enter a positive whole number.";
    }
    if (Object.keys(validation).length) {
      setError(null);
      setFieldErrors(validation);
      return;
    }
    setError(null);
    try {
      if (selectedRequirementId) {
        await updateRequirement({
          variables: {
            requirementId: selectedRequirementId,
            data: requirementPayload(),
          },
        });
      } else {
        await addRequirement({
          variables: {
            enrolmentId,
            data: requirementPayload(),
          },
        });
      }
      setFormOpen(false);
      onChanged();
    } catch (err) {
      setFieldErrors(monitoringFieldErrors(err));
      setError(mapError(err));
    }
  }

  async function handleDeactivate(requirementId: string) {
    setError(null);
    try {
      await deactivateRequirement({ variables: { requirementId } });
      if (selectedRequirementId === requirementId)
        setSelectedRequirementId(null);
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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={!canManage}
          onClick={() => {
            resetRequirementForm();
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          New requirement
        </Button>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        {requirements.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-muted">
            No active programme monitoring requirements.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-lg border border-border bg-background px-4 py-3"
              >
                <p className="text-sm font-semibold text-text">
                  {titleCase(
                    requirement.observationContext ||
                      requirement.observationType,
                  )}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {titleCase(requirement.cadenceType)} ·{" "}
                  {requirement.timeOfDay ?? "any time"} · grace{" "}
                  {requirement.gracePeriodDays ?? 0} days
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={!canManage}
                    onClick={() => {
                      loadRequirement(requirement);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                    Edit requirement
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-danger"
                    disabled={!canManage || saving}
                    onClick={() => void handleDeactivate(requirement.id)}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
            Upcoming windows
          </p>
          {windowsError || windowsLoading ? (
            <MonitoringQueryNotice
              error={windowsError}
              loading={windowsLoading}
              label="Expected monitoring windows"
              onRetry={onRetryWindows}
            />
          ) : windows.length === 0 ? (
            <p className="text-sm text-muted">No expected windows available.</p>
          ) : (
            <div className="space-y-2">
              {windows.slice(0, 4).map((window) => (
                <div
                  key={window.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  <span className="text-text">
                    {titleCase(
                      window.observationContext || window.observationType,
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    {formatDateTime(window.dueAt)}
                    <Badge variant={statusVariant(window.status)}>
                      {titleCase(window.status)}
                    </Badge>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </PanelBody>

      {formOpen ? (
        <DetailModal
          title={
            selectedRequirementId
              ? "Edit monitoring requirement"
              : "New monitoring requirement"
          }
          subtitle="What the patient needs to log or attend, and how often."
          onClose={() => setFormOpen(false)}
        >
          <form
            onSubmit={(event) => void handleSaveRequirement(event)}
            className="space-y-3"
          >
            {configurationQuery.loading && !configuration ? (
              <p role="status" className="text-sm text-muted">
                Loading monitoring options...
              </p>
            ) : null}
            {configurationQuery.error ? (
              <div role="alert" className="text-sm text-danger">
                Monitoring options could not be loaded.{" "}
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void configurationQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            ) : null}
            {configuration &&
            loadedReminderKeys.some(
              (key) =>
                !configuration.reminderSettings.some(
                  (setting) => setting.key === key,
                ),
            ) ? (
              <p role="status" className="text-sm text-muted">
                This requirement has legacy reminder settings. Review the
                reminder selections before saving; unsupported settings will be
                removed.
              </p>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
            {Object.keys(fieldErrors).length ? (
              <ul role="alert" className="space-y-1 text-sm text-danger">
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field}>
                    <span className="font-medium">
                      {REMINDER_SETTING_LABELS[field.split(".")[1]] ??
                        titleCase(field.replace(/([A-Z])/g, " $1"))}
                      :
                    </span>{" "}
                    {message}
                  </li>
                ))}
              </ul>
            ) : null}
            <fieldset
              disabled={
                !canManage ||
                saving ||
                !configuration ||
                Boolean(configurationQuery.error)
              }
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="requirement-observation">
                  Observation type
                </Label>
                <Select
                  id="requirement-observation"
                  value={observationType}
                  options={configuration?.observationTypes ?? []}
                  placeholder="Select observation type"
                  required
                  onChange={(event) => {
                    setObservationType(event.target.value);
                    setObservationContext("");
                  }}
                />
              </div>
              {observationType === "glucose" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="requirement-context">Context</Label>
                  <Select
                    id="requirement-context"
                    value={observationContext}
                    options={configuration?.glucoseContexts ?? []}
                    onChange={(event) =>
                      setObservationContext(event.target.value)
                    }
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="requirement-cadence">Cadence</Label>
                <Select
                  id="requirement-cadence"
                  value={cadenceType}
                  options={configuration?.cadences ?? []}
                  placeholder="Select cadence"
                  required
                  onChange={(event) => setCadenceType(event.target.value)}
                />
              </div>
              {needsInterval ? (
                <div className="space-y-1.5">
                  <Label htmlFor="requirement-interval">Interval days</Label>
                  <Input
                    id="requirement-interval"
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={intervalDays}
                    onChange={(event) => setIntervalDays(event.target.value)}
                  />
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="requirement-frequency">Frequency</Label>
                <Input
                  id="requirement-frequency"
                  type="number"
                  min={1}
                  max={configuration?.maxFrequencyPerInterval ?? 1}
                  step={1}
                  required
                  value={frequencyPerInterval}
                  onChange={(event) =>
                    setFrequencyPerInterval(event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requirement-time">Time of day</Label>
                <Input
                  id="requirement-time"
                  type="time"
                  required={configuration?.timeOfDayRequired ?? true}
                  value={timeOfDay}
                  onChange={(event) => setTimeOfDay(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="requirement-grace">Grace days</Label>
                <Input
                  id="requirement-grace"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={gracePeriodDays}
                  onChange={(event) => setGracePeriodDays(event.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requiredReading}
                  onChange={(event) => setRequiredReading(event.target.checked)}
                />
                Required reading
              </label>
              {needsWeekdays ? (
                <fieldset className="space-y-2 sm:col-span-2">
                  <legend className="text-sm font-medium">
                    Applicable weekdays
                  </legend>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {configuration?.weekdays.map((day) => (
                      <label
                        key={day.value}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={applicableDays.includes(day.value)}
                          onChange={(event) =>
                            setApplicableDays((current) =>
                              event.target.checked
                                ? [...current, day.value]
                                : current.filter(
                                    (value) => value !== day.value,
                                  ),
                            )
                          }
                        />
                        {day.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <fieldset className="grid gap-3 border-t border-border pt-3 sm:col-span-2 sm:grid-cols-2">
                <legend className="text-sm font-medium">
                  Reminders and follow-up
                </legend>
                {configuration?.reminderSettings.map((setting) => {
                  const value = reminders[setting.key] ?? setting.defaultValue;
                  const label =
                    REMINDER_SETTING_LABELS[setting.key] ??
                    titleCase(setting.key);
                  return setting.valueType === "boolean" ? (
                    <label
                      key={setting.key}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={value === true}
                        onChange={(event) =>
                          setReminders((current) => ({
                            ...current,
                            [setting.key]: event.target.checked,
                          }))
                        }
                      />
                      {label}
                    </label>
                  ) : (
                    <div key={setting.key} className="space-y-1.5">
                      <Label htmlFor={`requirement-${setting.key}`}>
                        {label}
                      </Label>
                      <Input
                        id={`requirement-${setting.key}`}
                        type="number"
                        min={1}
                        step={1}
                        required={!setting.nullable}
                        value={typeof value === "boolean" ? "" : (value ?? "")}
                        onChange={(event) =>
                          setReminders((current) => ({
                            ...current,
                            [setting.key]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  );
                })}
              </fieldset>
            </fieldset>
            <div className="flex flex-wrap gap-2 border-t border-border pt-3">
              <Button
                type="submit"
                size="sm"
                disabled={
                  !canManage ||
                  saving ||
                  !validChoices ||
                  Boolean(configurationQuery.error)
                }
              >
                {saving
                  ? "Saving…"
                  : selectedRequirementId
                    ? "Update requirement"
                    : "Add requirement"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

function GapAdherencePanel({
  gaps,
  adherence,
  gapsError,
  gapsLoading,
  adherenceError,
  adherenceLoading,
  onRetryGaps,
  onRetryAdherence,
}: {
  gaps: MonitoringGap[];
  adherence?: AdherenceData["patientMonitoringAdherenceSummary"];
  gapsError?: ApolloError;
  gapsLoading: boolean;
  adherenceError?: ApolloError;
  adherenceLoading: boolean;
  onRetryGaps: () => void;
  onRetryAdherence: () => void;
}) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={AlertCircle} count={adherenceError || adherenceLoading ? undefined : adherence?.openGapCount} countTone="warning">
          Gaps And Adherence
        </PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {adherenceError || adherenceLoading ? (
          <MonitoringQueryNotice error={adherenceError} loading={adherenceLoading} label="Monitoring adherence" onRetry={onRetryAdherence} />
        ) : adherence ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="Open Gaps"
              value={adherence.openGapCount}
              sublabel="missed monitoring"
              icon={Icons.warning}
              tone={adherence.openGapCount > 0 ? "warning" : "success"}
            />
            <StatTile
              label="Consecutive Misses"
              value={adherence.consecutiveMissedCount}
              sublabel="current risk signal"
              icon={Icons.monitoring}
              tone={adherence.consecutiveMissedCount > 0 ? "danger" : "neutral"}
            />
          </div>
        ) : (
          <p className="text-sm text-muted">Monitoring adherence unavailable.</p>
        )}
        {gapsError || gapsLoading ? (
          <MonitoringQueryNotice error={gapsError} loading={gapsLoading} label="Monitoring gap history" onRetry={onRetryGaps} />
        ) : gaps.length === 0 ? (
          <p className="text-sm text-muted">No monitoring gaps for this enrolment.</p>
        ) : (
          <div className="space-y-2">
            {gaps.slice(0, 4).map((gap) => (
              <div key={gap.id} className="rounded-lg border border-border bg-background px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-text">{titleCase(gap.observationContext || gap.observationType)}</p>
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

export function PatientProgrammeContinuityPanel({
  patientId,
}: {
  patientId: string;
}) {
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useUrlState(
    "enrolment",
    "",
  );
  const [activeTab, setActiveTab] = useUrlState("programmeTab", "readiness", [
    "readiness",
    "baseline",
    "care",
    "shared",
    "journey",
    "monitoring",
    "adherence",
    "team",
  ]);
  const { user } = useAuth();
  const canManageCarePlans = hasProgrammePermission(user, "care_plan.manage");
  const canManageMonitoring = hasProgrammePermission(user, "monitoring.manage");
  const enrolmentsQuery = useQuery<EnrolmentsData>(
    PATIENT_PROGRAMME_ENROLMENTS_QUERY,
    {
      variables: { patientId },
      fetchPolicy: "cache-and-network",
    },
  );
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];
  const enrolment =
    enrolments.find((item) => item.id === selectedEnrolmentId) ??
    enrolments.find((item) => item.status.toUpperCase() === "ACTIVE") ??
    enrolments[0] ??
    null;
  const enrolmentId = enrolment?.id;
  const readinessQuery = useQuery<ReadinessData>(
    PROGRAMME_ENROLMENT_READINESS_QUERY,
    {
      variables: { enrolmentId },
      skip: !enrolmentId,
      fetchPolicy: "cache-and-network",
    },
  );
  const baselineQuery = useQuery<BaselineData>(
    PROGRAMME_CURRENT_BASELINE_QUERY,
    {
      variables: { enrolmentId },
      skip: !enrolmentId,
      fetchPolicy: "cache-and-network",
    },
  );
  const carePlanQuery = useQuery<CarePlanData>(
    PROGRAMME_CURRENT_CARE_PLAN_QUERY,
    {
      variables: { enrolmentId },
      skip: !enrolmentId,
      fetchPolicy: "cache-and-network",
    },
  );
  const scheduleQuery = useQuery<ScheduleData>(PROGRAMME_SCHEDULE_QUERY, {
    variables: { enrolmentId },
    skip: !enrolmentId,
    fetchPolicy: "cache-and-network",
  });
  const requirementsQuery = useQuery<RequirementsData>(
    EFFECTIVE_MONITORING_REQUIREMENTS_QUERY,
    {
      variables: { enrolmentId },
      skip: !enrolmentId,
      fetchPolicy: "cache-and-network",
    },
  );
  const windowsQuery = useQuery<WindowsData>(
    EXPECTED_MONITORING_WINDOWS_QUERY,
    {
      variables: { enrolmentId, limit: 8 },
      skip: !enrolmentId || activeTab !== "monitoring",
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
  );
  const gapsQuery = useQuery<GapsData>(MONITORING_GAP_HISTORY_QUERY, {
    variables: { enrolmentId, limit: 8 },
    skip: !enrolmentId || activeTab !== "adherence",
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
  });
  const adherenceQuery = useQuery<AdherenceData>(
    PATIENT_MONITORING_ADHERENCE_SUMMARY_QUERY,
    {
      variables: { enrolmentId },
      skip: !enrolmentId || activeTab !== "adherence",
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
    },
  );

  function refetchProgramme() {
    void Promise.allSettled([
      enrolmentsQuery.refetch(),
      readinessQuery.refetch(),
      baselineQuery.refetch(),
      carePlanQuery.refetch(),
      scheduleQuery.refetch(),
      requirementsQuery.refetch(),
      ...(activeTab === "monitoring" &&
      !isAdherenceAccessDenied(windowsQuery.error)
        ? [windowsQuery.refetch()]
        : []),
      ...(activeTab === "adherence" && !isAdherenceAccessDenied(gapsQuery.error)
        ? [gapsQuery.refetch()]
        : []),
      ...(activeTab === "adherence" &&
      !isAdherenceAccessDenied(adherenceQuery.error)
        ? [adherenceQuery.refetch()]
        : []),
    ]);
  }

  if (enrolmentsQuery.loading && !enrolment) {
    return <div className="h-72 animate-pulse rounded-lg bg-border/40" />;
  }

  if (!enrolment) {
    return (
      <Panel>
        <PanelEmpty>
          <p
            role={enrolmentsQuery.error ? "alert" : undefined}
            className="font-medium text-text"
          >
            {enrolmentsQuery.error
              ? "Unable to load programme enrolments."
              : "No care programme enrolment"}
          </p>
          {enrolmentsQuery.error ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void enrolmentsQuery.refetch()}
            >
              Retry
            </Button>
          ) : null}
        </PanelEmpty>
      </Panel>
    );
  }

  const readiness = readinessQuery.data?.programmeEnrolmentReadiness;
  const baseline = baselineQuery.data?.programmeCurrentBaseline ?? null;
  const carePlan = carePlanQuery.data?.programmeCurrentCarePlan ?? null;
  const scheduleItems = scheduleQuery.data?.programmeSchedule ?? [];
  const requirements =
    requirementsQuery.data?.effectiveMonitoringRequirements ?? [];
  const windows = windowsQuery.data?.expectedMonitoringWindows.items ?? [];
  const gaps = gapsQuery.data?.monitoringGapHistory.items ?? [];
  const adherence = adherenceQuery.data?.patientMonitoringAdherenceSummary;

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0 space-y-1">
          <h2 className="break-words text-base font-semibold">
            {enrolment.programme.name}
          </h2>
          <p className="text-xs text-muted">
            Lead provider:{" "}
            {enrolment.leadProvider?.displayName ?? "Not assigned"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {enrolments.length > 1 ? (
            <Select
              aria-label="Patient programme enrolment"
              className="w-full sm:w-64"
              value={enrolment.id}
              options={enrolments.map((item) => ({
                value: item.id,
                label: `${item.programme.name} - ${titleCase(item.status)}`,
              }))}
              onChange={(event) => setSelectedEnrolmentId(event.target.value)}
            />
          ) : null}
          <Badge variant={statusVariant(enrolment.status)}>
            {titleCase(enrolment.status)}
          </Badge>
          <ProgrammeEnrolmentActions
            key={enrolment.id}
            enrolment={enrolment}
            onChanged={refetchProgramme}
            onActionOpen={() => setSelectedEnrolmentId(enrolment.id)}
          />
        </div>
      </header>
      <WorkspaceTabs
        id="patient-programme"
        label="Patient programme management"
        value={activeTab}
        onChange={(tab) => {
          setSelectedEnrolmentId(enrolment.id);
          setActiveTab(tab);
        }}
        tabs={[
          { key: "readiness", label: "Readiness" },
          { key: "team", label: "Care Team" },
          { key: "baseline", label: "Baseline" },
          { key: "care", label: "Enrolment Care Plan" },
          { key: "shared", label: "Shared Programme Plans" },
          { key: "journey", label: "Care Journey" },
          { key: "monitoring", label: "Monitoring Schedule" },
          { key: "adherence", label: "Adherence" },
        ]}
      />
      {enrolmentsQuery.error ||
      readinessQuery.error ||
      baselineQuery.error ||
      carePlanQuery.error ||
      scheduleQuery.error ||
      requirementsQuery.error ? (
        <p role="alert" className="text-sm text-danger">
          Some programme information could not be refreshed.{" "}
          <button
            type="button"
            className="underline"
            onClick={refetchProgramme}
          >
            Retry
          </button>
        </p>
      ) : null}
      <div
        role="tabpanel"
        id="patient-programme-panel-readiness"
        aria-labelledby="patient-programme-tab-readiness"
        hidden={activeTab !== "readiness"}
      >
        {readiness ? (
          <ReadinessPanel readiness={readiness} />
        ) : (
          <p className="py-6 text-sm text-muted">
            {readinessQuery.loading
              ? "Loading readiness..."
              : "No readiness information available."}
          </p>
        )}
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-team"
        aria-labelledby="patient-programme-tab-team"
        hidden={activeTab !== "team"}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Team member</th>
                <th className="px-3 py-3 font-medium">Assigned</th>
              </tr>
            </thead>
            <tbody>
              {enrolment.careTeamAssignments
                .filter((assignment) => assignment.active)
                .map((assignment) => (
                  <tr key={assignment.id} className="border-b border-border">
                    <td className="px-3 py-3">{titleCase(assignment.role)}</td>
                    <td className="px-3 py-3">
                      {assignment.provider?.displayName ??
                        assignment.assignedUserDisplayName}
                    </td>
                    <td className="px-3 py-3">
                      {formatDateTime(assignment.assignedAt)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!enrolment.careTeamAssignments.some(
          (assignment) => assignment.active,
        ) ? (
          <p className="py-6 text-center text-sm text-muted">
            No care-team members assigned.
          </p>
        ) : null}
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-baseline"
        aria-labelledby="patient-programme-tab-baseline"
        hidden={activeTab !== "baseline"}
      >
        <BaselineReviewPanel
          key={enrolment.id}
          baseline={baseline}
          onChanged={refetchProgramme}
          canManage={canManageCarePlans}
        />
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-care"
        aria-labelledby="patient-programme-tab-care"
        hidden={activeTab !== "care"}
      >
        {carePlanQuery.loading && !carePlanQuery.data ? (
          <p className="py-6 text-sm text-muted">Loading care plan...</p>
        ) : carePlanQuery.error && !carePlanQuery.data ? (
          <p className="py-6 text-sm text-muted">Care plan unavailable.</p>
        ) : (
          <CarePlanPanel
            key={enrolment.id}
            enrolmentId={enrolment.id}
            carePlan={carePlan}
            onChanged={refetchProgramme}
            canManage={canManageCarePlans}
          />
        )}
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-journey"
        aria-labelledby="patient-programme-tab-journey"
        hidden={activeTab !== "journey"}
      >
        <CareJourneyCalendarPanel
          key={enrolment.id}
          carePlan={carePlan}
          items={scheduleItems}
          onChanged={refetchProgramme}
          canManage={canManageCarePlans}
        />
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-shared"
        aria-labelledby="patient-programme-tab-shared"
        hidden={activeTab !== "shared"}
      >
        <ProgrammeSharedPlansReadOnly
          key={enrolment.programme.id}
          programmeId={enrolment.programme.id}
          active={activeTab === "shared"}
        />
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-monitoring"
        aria-labelledby="patient-programme-tab-monitoring"
        hidden={activeTab !== "monitoring"}
      >
        <MonitoringSchedulePanel
          key={enrolment.id}
          enrolmentId={enrolment.id}
          requirements={requirements}
          windows={windows}
          windowsError={windowsQuery.error}
          windowsLoading={windowsQuery.loading}
          onRetryWindows={() => {
            void windowsQuery.refetch().catch(() => undefined);
          }}
          onChanged={refetchProgramme}
          canManage={canManageMonitoring}
        />
      </div>
      <div
        role="tabpanel"
        id="patient-programme-panel-adherence"
        aria-labelledby="patient-programme-tab-adherence"
        hidden={activeTab !== "adherence"}
      >
        <GapAdherencePanel
          gaps={gaps}
          adherence={adherence}
          gapsError={gapsQuery.error}
          gapsLoading={gapsQuery.loading}
          adherenceError={adherenceQuery.error}
          adherenceLoading={adherenceQuery.loading}
          onRetryGaps={() => {
            void gapsQuery.refetch().catch(() => undefined);
          }}
          onRetryAdherence={() => {
            void adherenceQuery.refetch().catch(() => undefined);
          }}
        />
      </div>
    </div>
  );
}
