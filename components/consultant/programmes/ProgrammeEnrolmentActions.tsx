"use client";

import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "@apollo/client";
import {
  CheckCircle2,
  ChevronDown,
  LogOut,
  Pause,
  Play,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchableSelector } from "@/components/ui/searchable-selector";
import { Textarea } from "@/components/ui/textarea";
import { PROGRAMME_CARE_TEAM_ROLE_OPTIONS } from "@/lib/programmes/choices";
import {
  ACTIVATE_PROGRAMME_ENROLMENT_MUTATION,
  ASSIGN_PROGRAMME_CARE_TEAM_MUTATION,
  COMPLETE_PROGRAMME_ENROLMENT_MUTATION,
  PAUSE_PROGRAMME_ENROLMENT_MUTATION,
  PROGRAMME_CARE_TEAM_CANDIDATES_QUERY,
  RESUME_PROGRAMME_ENROLMENT_MUTATION,
  WITHDRAW_PROGRAMME_ENROLMENT_MUTATION,
  type ProgrammeCareTeamCandidate,
  type ProgrammeEnrolment,
} from "@/lib/programmes/graphql";

const actions = [
  { key: "activate", label: "Activate enrolment", icon: Play },
  { key: "pause", label: "Pause enrolment", icon: Pause },
  { key: "resume", label: "Resume enrolment", icon: Play },
  { key: "complete", label: "Complete enrolment", icon: CheckCircle2 },
  { key: "withdraw", label: "Withdraw enrolment", icon: LogOut },
] as const;
type Action = (typeof actions)[number]["key"] | "assign_care_team";

export function ProgrammeEnrolmentActions({
  enrolment,
  onChanged,
  onActionOpen,
}: {
  enrolment: ProgrammeEnrolment;
  onChanged: () => Promise<void> | void;
  onActionOpen?: () => void;
}) {
  const [action, setAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [role, setRole] = useState("doctor");
  const [memberId, setMemberId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshError, setRefreshError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activate] = useMutation(ACTIVATE_PROGRAMME_ENROLMENT_MUTATION);
  const [pause] = useMutation(PAUSE_PROGRAMME_ENROLMENT_MUTATION);
  const [resume] = useMutation(RESUME_PROGRAMME_ENROLMENT_MUTATION);
  const [complete] = useMutation(COMPLETE_PROGRAMME_ENROLMENT_MUTATION);
  const [withdraw] = useMutation(WITHDRAW_PROGRAMME_ENROLMENT_MUTATION);
  const [assign] = useMutation(ASSIGN_PROGRAMME_CARE_TEAM_MUTATION);
  const allowed = enrolment.availableActions ?? [];
  const candidatesQuery = useQuery<{
    programmeEnrolment: {
      careTeamCandidates: ProgrammeCareTeamCandidate[];
    } | null;
  }>(PROGRAMME_CARE_TEAM_CANDIDATES_QUERY, {
    variables: { enrolmentId: enrolment.id },
    skip:
      action !== "assign_care_team" || !allowed.includes("assign_care_team"),
    fetchPolicy: "network-only",
  });
  const candidates =
    candidatesQuery.data?.programmeEnrolment?.careTeamCandidates ?? [];
  const member = candidates.find(
    (candidate) =>
      candidate.userId === memberId && candidate.roles.includes(role),
  );

  function open(next: Action) {
    if (saving || !allowed.includes(next)) return;
    onActionOpen?.();
    setError(null);
    setReason("");
    setMemberId("");
    setRole("doctor");
    setAction(next);
  }

  async function refresh() {
    try {
      await onChanged();
      setRefreshError(false);
    } catch {
      setRefreshError(true);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!action || saving || !allowed.includes(action)) return;
    if (
      action === "assign_care_team" &&
      (!member || candidatesQuery.loading || candidatesQuery.error)
    )
      return;
    if (["complete", "withdraw"].includes(action) && !reason.trim()) return;
    setError(null);
    setSaving(true);
    try {
      if (action === "assign_care_team") {
        await assign({
          variables: {
            enrolmentId: enrolment.id,
            assignments: [
              {
                role,
                ...(member?.providerId
                  ? { providerId: member.providerId }
                  : { userId: memberId }),
              },
            ],
          },
        });
      } else {
        const mutations = { activate, pause, resume, complete, withdraw };
        await mutations[action]({
          variables: {
            enrolmentId: enrolment.id,
            reason: reason.trim() || undefined,
          },
        });
      }
      setAction(null);
      await refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "The enrolment could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  const available = actions.filter((item) => allowed.includes(item.key));
  const label =
    actions.find((item) => item.key === action)?.label ?? "Assign care team";
  return (
    <div className="flex flex-wrap items-center gap-2">
      {allowed.includes("assign_care_team") ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={saving}
          onClick={() => open("assign_care_team")}
        >
          <Users className="size-4" />
          Assign care team
        </Button>
      ) : null}
      {available.length ? (
        <details
          className="relative"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
            Enrolment actions
            <ChevronDown className="size-4" />
          </summary>
          <div className="absolute right-0 z-40 mt-1 w-56 rounded-lg border border-border bg-surface p-1 shadow-soft">
            {available.map((item) => (
              <button
                key={item.key}
                type="button"
                disabled={saving}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50 ${item.key === "withdraw" ? "text-danger" : "text-text"}`}
                onClick={(event) => {
                  const menu = event.currentTarget.closest("details");
                  if (menu) menu.open = false;
                  open(item.key);
                }}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
        </details>
      ) : null}
      {refreshError ? (
        <p role="alert" className="text-sm text-danger">
          Saved, but the latest details could not be loaded.{" "}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={saving}
            onClick={() => void refresh()}
          >
            Refresh
          </Button>
        </p>
      ) : null}
      {action ? (
        <DetailModal
          title={label}
          subtitle={enrolment.programme.name}
          className="sm:max-w-lg"
          onClose={() => {
            if (!saving) setAction(null);
          }}
        >
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            {!allowed.includes(action) ? (
              <p role="alert" className="text-sm text-danger">
                This action is no longer available. Refresh the enrolment
                details.
              </p>
            ) : null}
            {action === "assign_care_team" ? (
              <>
                {candidatesQuery.error ? (
                  <div role="alert" className="text-sm text-danger">
                    Care-team members could not be loaded.{" "}
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void candidatesQuery.refetch()}
                    >
                      Retry
                    </Button>
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label htmlFor={`team-role-${enrolment.id}`}>
                    Care team role
                  </Label>
                  <Select
                    id={`team-role-${enrolment.id}`}
                    value={role}
                    options={PROGRAMME_CARE_TEAM_ROLE_OPTIONS}
                    disabled={saving}
                    onChange={(event) => {
                      setRole(event.target.value);
                      setMemberId("");
                    }}
                  />
                </div>
                <SearchableSelector
                  id={`team-member-${enrolment.id}`}
                  label="Care team member"
                  value={memberId}
                  options={candidates
                    .filter((candidate) => candidate.roles.includes(role))
                    .map((candidate) => ({
                      value: candidate.userId,
                      label: candidate.displayName,
                    }))}
                  placeholder="Select care team member"
                  emptyLabel={
                    candidatesQuery.loading
                      ? "Loading care team..."
                      : "No eligible care team members"
                  }
                  disabled={
                    saving ||
                    candidatesQuery.loading ||
                    Boolean(candidatesQuery.error)
                  }
                  onChange={setMemberId}
                />
              </>
            ) : (
              <>
                <p className="text-sm text-muted">
                  Confirm this change for{" "}
                  {enrolment.patient.fullName ?? "this patient"}&apos;s
                  enrolment. Other patients and the shared programme are not
                  changed.
                </p>
                {["pause", "complete", "withdraw"].includes(action) ? (
                  <div className="space-y-1.5">
                    <Label htmlFor={`enrolment-reason-${enrolment.id}`}>
                      Reason{action === "pause" ? " (optional)" : ""}
                    </Label>
                    <Textarea
                      id={`enrolment-reason-${enrolment.id}`}
                      value={reason}
                      required={action !== "pause"}
                      disabled={saving}
                      onChange={(event) => setReason(event.target.value)}
                    />
                  </div>
                ) : null}
              </>
            )}
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => setAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  saving ||
                  !allowed.includes(action) ||
                  (action === "assign_care_team" &&
                    (!member ||
                      candidatesQuery.loading ||
                      Boolean(candidatesQuery.error))) ||
                  (["complete", "withdraw"].includes(action) && !reason.trim())
                }
              >
                {saving
                  ? "Saving..."
                  : action === "assign_care_team"
                    ? "Save assignment"
                    : "Confirm"}
              </Button>
            </div>
          </form>
        </DetailModal>
      ) : null}
    </div>
  );
}
