import { gql } from "@apollo/client";
import { getGraphQLErrorMessage } from "@/lib/auth/session";

/**
 * Consultant-configurable recommendation wording/severity per trigger,
 * diabetes type, and condition. Matching rules override the default backend
 * recommendation produced for the patient workspace.
 */
export const CONSULTANT_CLINICAL_RULES_QUERY = gql`
  query ConsultantClinicalRules($active: Boolean) {
    consultantClinicalRules(active: $active) {
      id
      trigger
      title
      description
      severity
      action
      diabetesType
      conditionCode
      conditionText
      configJson
      priority
      active
      createdAt
    }
  }
`;

export const UPSERT_CONSULTANT_CLINICAL_RULE_MUTATION = gql`
  mutation UpsertConsultantClinicalRule($data: ClinicalRuleInput!) {
    upsertConsultantClinicalRule(data: $data) {
      rule {
        id
        trigger
        title
        description
        severity
        action
        diabetesType
        conditionCode
        conditionText
        configJson
        priority
        active
      }
    }
  }
`;

// ─── Types ────────────────────────────────────────────────

export type RuleTrigger =
  | "high_glucose"
  | "stale_readings"
  | "missing_threshold"
  | "incomplete_pcq"
  | "unacknowledged_alerts"
  | "pending_lab_review"
  | "no_care_plan";

export type RuleSeverity = "info" | "warning" | "high" | "critical";

export type RuleDiabetesType =
  | "type_1"
  | "type_2"
  | "gestational"
  | "prediabetes"
  | "other";

export type ConsultantClinicalRule = {
  id: string;
  trigger: RuleTrigger | string;
  title: string;
  description: string;
  severity: RuleSeverity | string;
  action: string;
  diabetesType: RuleDiabetesType | string | null;
  conditionCode: string | null;
  conditionText: string | null;
  configJson: string | null;
  priority: number | null;
  active: boolean;
  createdAt: string | null;
};

export type ClinicalRuleInput = {
  id?: string;
  trigger: RuleTrigger;
  title: string;
  description: string;
  severity?: RuleSeverity;
  action: string;
  diabetesType?: RuleDiabetesType;
  conditionCode?: string;
  conditionText?: string;
  configJson?: string;
  priority?: number;
  active?: boolean;
};

export const RULE_TRIGGER_OPTIONS: { value: RuleTrigger; label: string; help: string }[] = [
  { value: "high_glucose", label: "High glucose follow-up", help: "Latest reading above the threshold/default range." },
  { value: "stale_readings", label: "Stale / no readings", help: "Latest reading older than 7 days, or none at all." },
  { value: "missing_threshold", label: "Missing glucose threshold", help: "No active glucose threshold configured." },
  { value: "incomplete_pcq", label: "Incomplete baseline PCQ", help: "Baseline PCQ missing or not submitted." },
  { value: "unacknowledged_alerts", label: "Unacknowledged alerts", help: "Monitoring alerts awaiting review." },
  { value: "pending_lab_review", label: "Pending lab review", help: "Lab results awaiting review." },
  { value: "no_care_plan", label: "No care plan", help: "Encounters exist but no care plan actions recorded." },
];

export const RULE_SEVERITY_OPTIONS: { value: RuleSeverity; label: string }[] = [
  { value: "info", label: "Info" },
  { value: "warning", label: "Warning" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export const RULE_DIABETES_TYPE_OPTIONS: { value: RuleDiabetesType; label: string }[] = [
  { value: "type_1", label: "Type 1" },
  { value: "type_2", label: "Type 2" },
  { value: "gestational", label: "Gestational" },
  { value: "prediabetes", label: "Prediabetes" },
  { value: "other", label: "Other" },
];

export function mapClinicalRuleError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes("PROVIDER_NOT_FOUND")) return "Your provider profile could not be found. Ensure your profile is complete.";
  if (msg.includes("TENANT_NOT_FOUND")) return "Tenant configuration error. Please contact support.";
  return getGraphQLErrorMessage(error, "Unable to save this clinical rule. Please try again.");
}
