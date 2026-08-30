"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { AlertTriangle, CheckCircle2, ClipboardList, RotateCcw, Send, UserPlus, PhoneCall } from "lucide-react";
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
import { hasProgrammePermission } from "@/lib/programmes/permissions";
import {
  ALERT_INTERVENTIONS_QUERY,
  ALERT_OWNERSHIP_HISTORY_QUERY,
  ALERT_DETAIL_QUERY,
  ASSIGN_ALERT_MUTATION,
  BEGIN_ALERT_REVIEW_MUTATION,
  CLAIM_ALERT_MUTATION,
  CLINIC_ALERT_WORK_QUEUE_QUERY,
  DISMISS_ALERT_MUTATION,
  ESCALATE_ALERT_MUTATION,
  RECORD_ALERT_INTERVENTION_MUTATION,
  RECORD_PATIENT_CONTACT_MUTATION,
  REASSIGN_ALERT_MUTATION,
  REOPEN_ALERT_MUTATION,
  RETURN_ALERT_TO_QUEUE_MUTATION,
  RESOLVE_ALERT_MUTATION,
  type AlertOwnershipEvent,
  type AlertIntervention,
  type AlertWorkQueue,
  type MonitoringAlert,
} from "@/lib/programmes/graphql";

type QueueData = {
  clinicAlertWorkQueue: AlertWorkQueue;
};

type InterventionsData = {
  alertInterventions: AlertIntervention[];
};

type OwnershipData = {
  alertOwnershipHistory: AlertOwnershipEvent[];
};

type AlertDetailData = {
  alertDetail: MonitoringAlert | null;
};

function titleCase(value: string | null | undefined) {
  if (!value) return "Unknown";
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function severityVariant(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "HIGH" || normalized === "CRITICAL") return "danger" as const;
  if (normalized === "MEDIUM" || normalized === "WARNING") return "warning" as const;
  return "secondary" as const;
}

function statusVariant(value: string | null | undefined) {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "RESOLVED" || normalized === "DISMISSED") return "success" as const;
  if (normalized === "UNDER_REVIEW" || normalized === "PATIENT_CONTACTED") return "primary" as const;
  if (normalized === "ESCALATED" || normalized === "OPEN") return "warning" as const;
  return "secondary" as const;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not set";
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
  return "The alert could not be updated.";
}

function AlertDetail({
  alert,
  onChanged,
}: {
  alert: MonitoringAlert;
  onChanged: () => void;
}) {
  const { user } = useAuth();
  const canManageAlerts = hasProgrammePermission(user, "alerts.manage");
  const canAssignAlerts = hasProgrammePermission(user, "alerts.assign");
  const [note, setNote] = useState("");
  const [ownerUserId, setOwnerUserId] = useState(alert.currentOwnerUserId ?? "");
  const [actionReason, setActionReason] = useState("");
  const [escalationRole, setEscalationRole] = useState("lead_doctor");
  const [escalationPolicyRef, setEscalationPolicyRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const interventionsQuery = useQuery<InterventionsData>(ALERT_INTERVENTIONS_QUERY, {
    variables: { alertId: alert.id },
    fetchPolicy: "cache-and-network",
  });
  const ownershipQuery = useQuery<OwnershipData>(ALERT_OWNERSHIP_HISTORY_QUERY, {
    variables: { alertId: alert.id },
    fetchPolicy: "cache-and-network",
  });
  const [claim, claimState] = useMutation(CLAIM_ALERT_MUTATION);
  const [assign, assignState] = useMutation(ASSIGN_ALERT_MUTATION);
  const [reassign, reassignState] = useMutation(REASSIGN_ALERT_MUTATION);
  const [returnToQueue, returnState] = useMutation(RETURN_ALERT_TO_QUEUE_MUTATION);
  const [beginReview, reviewState] = useMutation(BEGIN_ALERT_REVIEW_MUTATION);
  const [recordContact, contactState] = useMutation(RECORD_PATIENT_CONTACT_MUTATION);
  const [recordIntervention, interventionState] = useMutation(RECORD_ALERT_INTERVENTION_MUTATION);
  const [resolve, resolveState] = useMutation(RESOLVE_ALERT_MUTATION);
  const [dismiss, dismissState] = useMutation(DISMISS_ALERT_MUTATION);
  const [reopen, reopenState] = useMutation(REOPEN_ALERT_MUTATION);
  const [escalate, escalateState] = useMutation(ESCALATE_ALERT_MUTATION);
  const saving =
    claimState.loading ||
    assignState.loading ||
    reassignState.loading ||
    returnState.loading ||
    reviewState.loading ||
    contactState.loading ||
    interventionState.loading ||
    resolveState.loading ||
    dismissState.loading ||
    reopenState.loading ||
    escalateState.loading;

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
      setNote("");
      setActionReason("");
      onChanged();
      void interventionsQuery.refetch();
      void ownershipQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  function handleIntervention(event: FormEvent) {
    event.preventDefault();
    void run(() =>
      recordIntervention({
        variables: {
          alertId: alert.id,
          data: {
            actionType: "clinical_review",
            clinicalNote: note,
            followUpRequired: false,
            visibility: "clinical_team",
          },
        },
      }),
    );
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={ClipboardList}>Alert Detail</PanelTitle>
        <div className="flex flex-wrap gap-2">
          <Badge variant={severityVariant(alert.severity)}>{titleCase(alert.severity)}</Badge>
          <Badge variant={statusVariant(alert.status)}>{titleCase(alert.status)}</Badge>
        </div>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error ? <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p> : null}
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <p className="break-words text-sm font-semibold text-text">{alert.message ?? titleCase(alert.type)}</p>
          <p className="mt-1 text-xs text-muted">
            {titleCase(alert.category)} · due {formatDateTime(alert.dueAt)} · queued {formatDateTime(alert.queuedAt ?? alert.createdAt)}
          </p>
          {alert.observationValue ? (
            <p className="mt-2 text-sm text-muted">
              Reading: {alert.observationValue} {alert.observationUnit ?? ""} {titleCase(alert.observationContext)}
            </p>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            Owner: {alert.currentOwnerUserId ?? "Queue"} · role {titleCase(alert.ownerCareTeamRole)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="secondary" disabled={!canManageAlerts || saving} onClick={() => void run(() => claim({ variables: { alertId: alert.id } }))}>
            Claim
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={!canManageAlerts || saving} onClick={() => void run(() => beginReview({ variables: { alertId: alert.id } }))}>
            Begin review
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={!canManageAlerts || saving}
            onClick={() =>
              void run(() =>
                recordContact({
                  variables: {
                    alertId: alert.id,
                    data: {
                      actionType: "patient_contact",
                      patientContactChannel: "phone",
                      outcome: note || "Patient contact recorded.",
                      followUpRequired: false,
                      visibility: "clinical_team",
                    },
                  },
                }),
              )
            }
          >
            <PhoneCall className="size-4" />
            Contact recorded
          </Button>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-2">
          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor={`alert-owner-${alert.id}`}>Owner user ID</Label>
            <Input
              id={`alert-owner-${alert.id}`}
              value={ownerUserId}
              onChange={(event) => setOwnerUserId(event.target.value)}
              placeholder="Care team user UUID"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`alert-reason-${alert.id}`}>Action reason</Label>
            <Input
              id={`alert-reason-${alert.id}`}
              value={actionReason}
              onChange={(event) => setActionReason(event.target.value)}
              placeholder="Required for dismiss, reopen, escalation"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`alert-escalation-role-${alert.id}`}>Escalation role</Label>
            <Input
              id={`alert-escalation-role-${alert.id}`}
              value={escalationRole}
              onChange={(event) => setEscalationRole(event.target.value)}
              placeholder="lead_doctor, nurse, care_coordinator"
            />
          </div>
          <Input
            value={escalationPolicyRef}
            onChange={(event) => setEscalationPolicyRef(event.target.value)}
            placeholder="Escalation policy reference"
            className="md:col-span-2"
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canAssignAlerts || saving || !ownerUserId.trim()}
              onClick={() => void run(() => assign({ variables: { alertId: alert.id, ownerUserId: ownerUserId.trim(), reason: actionReason || undefined } }))}
            >
              <UserPlus className="size-4" />
              Assign
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canAssignAlerts || saving || !ownerUserId.trim()}
              onClick={() => void run(() => reassign({ variables: { alertId: alert.id, ownerUserId: ownerUserId.trim(), reason: actionReason || undefined } }))}
            >
              Reassign
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={!canAssignAlerts || saving} onClick={() => void run(() => returnToQueue({ variables: { alertId: alert.id, reason: actionReason || undefined } }))}>
              <RotateCcw className="size-4" />
              Return to queue
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canAssignAlerts || saving || !actionReason.trim()}
              onClick={() =>
                void run(() =>
                  escalate({
                    variables: {
                      alertId: alert.id,
                      reason: actionReason,
                      toUserId: ownerUserId.trim() || undefined,
                      toRole: escalationRole.trim() || undefined,
                      policyRef: escalationPolicyRef.trim() || undefined,
                    },
                  }),
                )
              }
            >
              <Send className="size-4" />
              Escalate
            </Button>
          </div>
        </div>

        <form onSubmit={handleIntervention} className="space-y-3">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Clinical note, contact outcome, or resolution note"
            className="min-h-24"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" disabled={!canManageAlerts || saving || !note.trim()}>
              Save intervention
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canManageAlerts || saving || !note.trim()}
              onClick={() =>
                void run(() =>
                  resolve({
                    variables: {
                      alertId: alert.id,
                      classification: "resolved",
                      note,
                    },
                  }),
                )
              }
            >
              Resolve alert
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canManageAlerts || saving || !actionReason.trim()}
              onClick={() =>
                void run(() =>
                  dismiss({
                    variables: {
                      alertId: alert.id,
                      reason: actionReason,
                      note: note || undefined,
                    },
                  }),
                )
              }
            >
              Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={!canManageAlerts || saving || !actionReason.trim()}
              onClick={() => void run(() => reopen({ variables: { alertId: alert.id, reason: actionReason } }))}
            >
              Reopen
            </Button>
          </div>
        </form>

        <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Interventions</p>
          {(interventionsQuery.data?.alertInterventions ?? []).length === 0 ? (
            <p className="text-sm text-muted">No interventions recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(interventionsQuery.data?.alertInterventions ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="break-words text-sm font-medium text-text">{titleCase(item.actionType)}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(item.occurredAt)} · {titleCase(item.visibility)}
                  </p>
                  {item.outcome || item.clinicalNote || item.coordinationNote ? (
                    <p className="mt-1 break-words text-sm text-muted">{item.outcome ?? item.clinicalNote ?? item.coordinationNote}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">Ownership history</p>
          {(ownershipQuery.data?.alertOwnershipHistory ?? []).length === 0 ? (
            <p className="text-sm text-muted">No ownership changes recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {(ownershipQuery.data?.alertOwnershipHistory ?? []).map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="break-all text-sm font-medium text-text">{item.newOwnerUserId ?? "Returned to queue"}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDateTime(item.changedAt)} · {titleCase(item.careTeamRole)}
                  </p>
                  {item.reason ? <p className="mt-1 break-words text-sm text-muted">{item.reason}</p> : null}
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </PanelBody>
    </Panel>
  );
}

export function ProgrammeAlertWorkQueue({ alertId }: { alertId?: string }) {
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const queueQuery = useQuery<QueueData>(CLINIC_ALERT_WORK_QUEUE_QUERY, {
    variables: { limit: 25 },
    fetchPolicy: "cache-and-network",
  });
  const queue = queueQuery.data?.clinicAlertWorkQueue;
  const alerts = queue?.items ?? [];
  const effectiveAlertId = selectedAlertId ?? alertId;
  const detailQuery = useQuery<AlertDetailData>(ALERT_DETAIL_QUERY, {
    variables: { alertId: effectiveAlertId },
    skip: !effectiveAlertId,
    fetchPolicy: "cache-and-network",
  });
  const selectedAlert = detailQuery.data?.alertDetail ?? alerts.find((alert) => alert.id === effectiveAlertId) ?? alerts[0] ?? null;

  if (queueQuery.loading && !queue) {
    return <div className="h-96 animate-pulse rounded-lg bg-border/40" />;
  }

  if (queueQuery.error) {
    return (
      <Panel>
        <PanelBody className="flex items-center gap-3 text-warning">
          <AlertTriangle className="size-5" />
          <p className="text-sm">Unable to load the clinical alert work queue.</p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.25fr]">
      <Panel>
        <PanelHeader>
          <PanelTitle icon={AlertTriangle} count={queue?.summary.openCount ?? alerts.length} countTone="danger">
            Clinical Work Queue
          </PanelTitle>
          <Button type="button" size="sm" variant="secondary" onClick={() => void queueQuery.refetch()}>
            Refresh
          </Button>
        </PanelHeader>
        {alerts.length === 0 ? (
          <PanelEmpty>
            <CheckCircle2 className="mx-auto size-8 text-success" />
            <p className="mt-3 font-medium text-text">No open clinical alerts</p>
            <p className="mt-1 text-xs text-muted">Programme alerts and missed-monitoring work items appear here.</p>
          </PanelEmpty>
        ) : (
          <PanelList>
            {alerts.map((alert) => (
              <button
                key={alert.id}
                type="button"
                onClick={() => setSelectedAlertId(alert.id)}
                className={`block w-full px-5 py-4 text-left transition-colors hover:bg-background ${
                  selectedAlert?.id === alert.id ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={severityVariant(alert.severity)}>{titleCase(alert.severity)}</Badge>
                  <Badge variant={statusVariant(alert.status)}>{titleCase(alert.status)}</Badge>
                </div>
                <p className="mt-2 break-words text-sm font-medium text-text">{alert.message ?? titleCase(alert.type)}</p>
                <p className="mt-1 text-xs text-muted">
                  {titleCase(alert.category)} · due {formatDateTime(alert.dueAt)}
                </p>
              </button>
            ))}
          </PanelList>
        )}
      </Panel>

      {selectedAlert ? (
        <AlertDetail alert={selectedAlert} onChanged={() => void queueQuery.refetch()} />
      ) : (
        <Panel>
          <PanelEmpty>Select an alert to review the clinical lifecycle.</PanelEmpty>
        </Panel>
      )}
    </div>
  );
}
