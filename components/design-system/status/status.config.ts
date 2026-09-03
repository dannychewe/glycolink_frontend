import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Ban,
  CheckCircle2,
  Circle,
  CircleSlash,
  Clock,
  type LucideIcon,
  XCircle,
} from "lucide-react";

/**
 * Locked status → {tone, style, icon, label} mapping — docs/03-design-system.md §5,
 * docs/06-frontend-design-system-architecture.md "Status".
 *
 * A component must never recolor or reinterpret a status ad hoc; extend this map
 * instead. Status always renders as icon + text + color — never color alone.
 */

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";
export type StatusStyle = "soft" | "solid" | "outline";

export type StatusKey =
  | "IN_RANGE"
  | "HIGH"
  | "LOW"
  | "CRITICAL"
  | "ACTIVE"
  | "ISSUED"
  | "COMPLETED"
  | "PENDING"
  | "EXPIRED"
  | "CANCELLED"
  | "REVOKED";

export type StatusConfigEntry = {
  tone: StatusTone;
  style: StatusStyle;
  icon: LucideIcon;
  label: string;
};

export const STATUS_CONFIG: Record<StatusKey, StatusConfigEntry> = {
  IN_RANGE: { tone: "success", style: "soft", icon: CheckCircle2, label: "In Range" },
  HIGH: { tone: "warning", style: "soft", icon: ArrowUp, label: "High" },
  LOW: { tone: "danger", style: "soft", icon: ArrowDown, label: "Low" },
  CRITICAL: { tone: "danger", style: "solid", icon: AlertTriangle, label: "Critical" },
  ACTIVE: { tone: "success", style: "soft", icon: Circle, label: "Active" },
  ISSUED: { tone: "info", style: "soft", icon: Clock, label: "Issued" },
  COMPLETED: { tone: "neutral", style: "soft", icon: CheckCircle2, label: "Completed" },
  PENDING: { tone: "info", style: "soft", icon: Clock, label: "Pending" },
  EXPIRED: { tone: "neutral", style: "outline", icon: CircleSlash, label: "Expired" },
  CANCELLED: { tone: "danger", style: "outline", icon: XCircle, label: "Cancelled" },
  REVOKED: { tone: "danger", style: "soft", icon: Ban, label: "Revoked" },
};

/** Tones used by prescription medication-order statuses (backend enum). */
export function statusKeyForMedicationOrder(status: string): StatusKey {
  const normalized = status.trim().toUpperCase();
  if (normalized === "ACTIVE") return "ACTIVE";
  if (normalized === "COMPLETED") return "COMPLETED";
  if (normalized === "EXPIRED") return "EXPIRED";
  if (normalized === "REVOKED") return "REVOKED";
  return "ISSUED";
}

/**
 * Glucose `overallStatus` / bucket `status` are free-text strings, not a backend
 * enum — normalize the handful of values the API actually sends.
 */
export function glucoseStatusKey(status: string | null | undefined): StatusKey {
  const normalized = (status ?? "").trim().toUpperCase();
  if (normalized === "LOW") return "LOW";
  if (normalized === "HIGH" || normalized === "ELEVATED") return "HIGH";
  return "IN_RANGE";
}

/**
 * Generic lifecycle-status → tone mapping for the many one-off enrolment/
 * invoice/entitlement/tenant statuses that aren't part of the locked clinical
 * status set above (ACTIVE/APPROVED/SATISFIED/PAID, MISSED/OVERDUE, DUE/PENDING,
 * ...). Every dashboard used to redefine this inline (`statusVariant()` in both
 * AdminDashboardView and PatientDiabetesHome) — one shared mapping instead.
 * Prefer `STATUS_CONFIG`/`StatusKey` wherever a status is part of the locked set.
 */
export function toneForLifecycleStatus(status: string | null | undefined): StatusTone {
  const normalized = (status ?? "").trim().toUpperCase();
  if (["ACTIVE", "APPROVED", "SATISFIED", "PAID", "VERIFIED"].includes(normalized)) return "success";
  if (
    [
      "MISSED",
      "OVERDUE",
      "REJECTED",
      "SUSPENDED",
      "INACTIVE",
      "COMMERCIALLY_SUSPENDED",
      "WITHDRAWN",
      "CANCELLED",
    ].includes(normalized)
  ) {
    return "danger";
  }
  if (
    [
      "DUE",
      "ISSUED",
      "SUBMITTED",
      "IN_REVIEW",
      "PARTIALLY_PAID",
      "IN_GRACE",
      "PENDING",
      "PENDING_APPROVAL",
      "PENDING_BASELINE",
      "PAUSED",
      "INVITED",
    ].includes(normalized)
  ) {
    return "warning";
  }
  return "neutral";
}
