"use client";

import { FormEvent, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  AlertCircle,
  CheckCircle,
  ClipboardPlus,
  Plus,
  X,
  ChevronRight,
} from "lucide-react";
import {
  ADD_PATIENT_CARE_PLAN_ACTION_MUTATION,
  CREATE_PATIENT_CARE_PLAN_MUTATION,
  mapWorkspaceError,
  type CarePlanStatus,
  type WorkspaceOngoingCarePlan,
} from "@/lib/consultant/patient-workspace-graphql";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { WorkspaceTabs } from "@/components/ui/workspace-tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";

type AlertState = { type: "success" | "error"; message: string } | null;

type CarePlanManagerProps = Readonly<{
  patientId: string;
  carePlans: WorkspaceOngoingCarePlan[];
  onChanged: () => void;
  programmeOrigins?: Record<string, CarePlanOrigin>;
  originsVerified?: boolean;
  onOpenEnrolment?: (enrolmentId: string) => void;
}>;

export type CarePlanOrigin = { enrolmentId: string; programmeName: string };

const inputClass =
  "flex h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function statusVariant(
  status: string | null | undefined,
): "success" | "warning" | "secondary" {
  const s = (status ?? "").toLowerCase();
  if (s === "active") return "success";
  if (s === "paused") return "warning";
  return "secondary";
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-ZM", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Alert({
  alert,
  onDismiss,
}: {
  alert: AlertState;
  onDismiss: () => void;
}) {
  if (!alert) return null;
  const isError = alert.type === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-sm",
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
      <button
        type="button"
        title="Dismiss notification"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── Add-action form ─────────────────────────────────────

function AddActionForm({
  carePlanId,
  onDone,
  onClose,
}: {
  carePlanId: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [addAction, { loading }] = useMutation(
    ADD_PATIENT_CARE_PLAN_ACTION_MUTATION,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!type.trim() || !description.trim()) {
      setError("Action type and description are required.");
      return;
    }
    try {
      await addAction({
        variables: {
          carePlanId,
          data: {
            type: type.trim(),
            description: description.trim(),
            targetDate: targetDate || undefined,
          },
        },
      });
      onDone();
    } catch (err) {
      setError(mapWorkspaceError(err));
    }
  }

  return (
    <DetailModal
      title="Add care-plan action"
      className="sm:max-w-xl"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-care-action"
            size="sm"
            disabled={loading}
          >
            <Plus className="size-4" />
            {loading ? "Adding..." : "Add action"}
          </Button>
        </div>
      }
    >
      <form
        id="add-care-action"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <fieldset disabled={loading} className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="care-action-type">Action type</Label>
              <Input
                id="care-action-type"
                required
                placeholder="e.g. lab, lifestyle"
                value={type}
                onChange={(e) => setType(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="care-action-date">Target date (optional)</Label>
              <input
                id="care-action-date"
                type="date"
                className={inputClass}
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="care-action-description">Description</Label>
            <Textarea
              id="care-action-description"
              required
              placeholder="What should happen?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </div>
        </fieldset>
      </form>
    </DetailModal>
  );
}

// ─── Create-plan form ─────────────────────────────────────

function CreatePlanForm({
  patientId,
  onClose,
  onCreated,
}: {
  patientId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<CarePlanStatus>("active");
  const [error, setError] = useState<string | null>(null);
  const [createPlan, { loading }] = useMutation(
    CREATE_PATIENT_CARE_PLAN_MUTATION,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    try {
      await createPlan({
        variables: {
          patientId,
          data: {
            title: title.trim(),
            summary: summary.trim() || undefined,
            status,
          },
        },
      });
      onCreated();
    } catch (err) {
      setError(mapWorkspaceError(err));
    }
  }

  return (
    <DetailModal
      title="New ongoing care plan"
      className="sm:max-w-xl"
      onClose={() => {
        if (!loading) onClose();
      }}
      footer={
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-ongoing-care-plan"
            size="sm"
            disabled={loading}
          >
            <Plus className="size-4" />
            {loading ? "Creating..." : "Create care plan"}
          </Button>
        </div>
      }
    >
      <form
        id="create-ongoing-care-plan"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4"
      >
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        <fieldset disabled={loading} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cp-title">
              Title <span className="text-danger">*</span>
            </Label>
            <Input
              id="cp-title"
              required
              placeholder="e.g. 90-day glucose stabilization"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-summary">Summary</Label>
            <Textarea
              id="cp-summary"
              placeholder="Goals and overview of this ongoing plan…"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[64px] text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cp-status">Status</Label>
            <select
              id="cp-status"
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as CarePlanStatus)}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </fieldset>
      </form>
    </DetailModal>
  );
}

// ─── Main ─────────────────────────────────────────────────

export function CarePlanManager({
  patientId,
  carePlans,
  onChanged,
  programmeOrigins = {},
  originsVerified = false,
  onOpenEnrolment,
}: CarePlanManagerProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState("actions");
  const selectedPlan = carePlans.find((plan) => plan.id === viewing);
  const canAddAction = (planId: string) =>
    originsVerified && !programmeOrigins[planId];

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ClipboardPlus className="size-4 text-primary" />
          Patient Care Plans
        </h2>
        <Button type="button" size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="size-4" />
          New plan
        </Button>
      </header>
      <div className="space-y-4">
        <Alert alert={alert} onDismiss={() => setAlert(null)} />

        {showCreate ? (
          <CreatePlanForm
            patientId={patientId}
            onClose={() => setShowCreate(false)}
            onCreated={() => {
              setShowCreate(false);
              setAlert({ type: "success", message: "Care plan created." });
              onChanged();
            }}
          />
        ) : null}

        {carePlans.length === 0 && !showCreate ? (
          <p className="border-y border-border px-4 py-8 text-center text-sm text-muted">
            No patient care plans shared.
          </p>
        ) : null}

        {carePlans.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3"
          >
            <div className="min-w-0 flex-1">
              <div className="min-w-0 space-y-1">
                <button
                  type="button"
                  className="break-words text-left text-sm font-semibold text-text hover:text-primary hover:underline"
                  onClick={() => setViewing(plan.id)}
                >
                  {plan.title}
                </button>
                {plan.summary ? (
                  <p className="line-clamp-2 break-words text-sm leading-6 text-muted">
                    {plan.summary}
                  </p>
                ) : null}
                <p className="text-xs text-muted">
                  {programmeOrigins[plan.id]?.programmeName ??
                    (originsVerified
                      ? "Standalone patient plan"
                      : "Relationship not verified")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                className="rounded-md tracking-normal"
                variant={statusVariant(plan.status)}
              >
                {(plan.status ?? "active").toString()}
              </Badge>
              <span className="text-xs text-muted">
                {plan.actions.length} actions
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Add action"
                aria-label={`Add action to ${plan.title}`}
                disabled={!canAddAction(plan.id)}
                className="size-9 px-0"
                onClick={() => setAddingTo(plan.id)}
              >
                <Plus className="size-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                title="Open care plan"
                aria-label={`Open ${plan.title}`}
                className="size-9 px-0"
                onClick={() => setViewing(plan.id)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {addingTo && canAddAction(addingTo) ? (
        <AddActionForm
          carePlanId={addingTo}
          onClose={() => setAddingTo(null)}
          onDone={() => {
            setAddingTo(null);
            setAlert({
              type: "success",
              message: "Action added to care plan.",
            });
            onChanged();
          }}
        />
      ) : null}
      {selectedPlan ? (
        <DetailModal
          title={selectedPlan.title}
          onClose={() => setViewing(null)}
          footer={
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setViewing(null)}
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setViewing(null);
                  setAddingTo(selectedPlan.id);
                }}
                disabled={!canAddAction(selectedPlan.id)}
              >
                <Plus className="size-4" />
                Add action
              </Button>
              {programmeOrigins[selectedPlan.id] && onOpenEnrolment ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setViewing(null);
                    onOpenEnrolment(
                      programmeOrigins[selectedPlan.id].enrolmentId,
                    );
                  }}
                >
                  View enrolment care plan
                </Button>
              ) : null}
            </div>
          }
        >
          <div className="space-y-4">
            <Badge variant={statusVariant(selectedPlan.status)}>
              {selectedPlan.status}
            </Badge>
            {selectedPlan.summary ? (
              <p className="whitespace-pre-wrap break-words text-sm text-muted">
                {selectedPlan.summary}
              </p>
            ) : null}
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Start</dt>
                <dd>{formatDate(selectedPlan.startsAt) ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">End</dt>
                <dd>{formatDate(selectedPlan.endsAt) ?? "Not set"}</dd>
              </div>
            </dl>
            <WorkspaceTabs
              id="patient-plan-record"
              label="Patient care-plan records"
              value={planTab}
              onChange={setPlanTab}
              tabs={[
                {
                  key: "actions",
                  label: "Actions",
                  count: selectedPlan.actions.length,
                },
                {
                  key: "milestones",
                  label: "Milestones",
                  count: selectedPlan.milestones.length,
                },
              ]}
            />
            <div
              role="tabpanel"
              id="patient-plan-record-panel-actions"
              aria-labelledby="patient-plan-record-tab-actions"
              hidden={planTab !== "actions"}
            >
              {selectedPlan.actions.length ? (
                <ul className="divide-y divide-border">
                  {selectedPlan.actions.map((action) => (
                    <li key={action.id} className="space-y-2 py-3">
                      <p className="break-words text-sm">
                        {action.type ? (
                          <span className="font-medium capitalize">
                            {action.type}:{" "}
                          </span>
                        ) : null}
                        {action.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        {action.targetDate ? (
                          <span>Due {formatDate(action.targetDate)}</span>
                        ) : null}
                        <Badge variant={statusVariant(action.status)}>
                          {action.status ?? "active"}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No actions yet.</p>
              )}
            </div>
            <div
              role="tabpanel"
              id="patient-plan-record-panel-milestones"
              aria-labelledby="patient-plan-record-tab-milestones"
              hidden={planTab !== "milestones"}
            >
              {selectedPlan.milestones.length ? (
                <ul className="divide-y divide-border">
                  {selectedPlan.milestones.map((milestone) => (
                    <li key={milestone.id} className="space-y-2 py-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="break-words font-medium">
                          {milestone.title}
                        </p>
                        <Badge variant={statusVariant(milestone.status)}>
                          {milestone.status}
                        </Badge>
                      </div>
                      {milestone.description ? (
                        <p className="break-words text-muted">
                          {milestone.description}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-3 text-xs text-muted">
                        {milestone.targetValue ? (
                          <span>Target: {milestone.targetValue}</span>
                        ) : null}
                        {milestone.targetDate ? (
                          <span>Due {formatDate(milestone.targetDate)}</span>
                        ) : null}
                        {milestone.achievedAt ? (
                          <span>
                            Achieved {formatDate(milestone.achievedAt)}
                          </span>
                        ) : null}
                      </div>
                      {milestone.achievedNote ? (
                        <p className="break-words text-muted">
                          {milestone.achievedNote}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No milestones.</p>
              )}
            </div>
          </div>
        </DetailModal>
      ) : null}
    </section>
  );
}
