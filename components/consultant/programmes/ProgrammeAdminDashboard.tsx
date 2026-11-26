"use client";
import { ProgrammeProviderOfferSettings } from "@/components/consultant/programmes/ProgrammeProviderOfferSettings";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProgrammeEnrolmentActions } from "./ProgrammeEnrolmentActions";
import { useUrlState } from "@/lib/use-url-state";
import { useMutation, useQuery } from "@apollo/client";
import {
  Archive,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  CheckCircle2,
  Circle,
  ClipboardList,
  Copy,
  Dumbbell,
  Eye,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Save,
  Send,
  Share2,
  RefreshCw,
  Search,
  Trash2,
  Utensils,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { OnboardingStepper } from "@/components/patient/onboarding/OnboardingStepper";
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
import {
  labelForChoice,
  PROGRAMME_CARE_TEAM_ROLE_OPTIONS,
  PROGRAMME_TYPE_OPTIONS,
} from "@/lib/programmes/choices";
import {
  ACTIVATE_CARE_PROGRAMME_MUTATION,
  ARCHIVE_CARE_PROGRAMME_MUTATION,
  DELETE_CARE_PROGRAMME_MUTATION,
  CARE_PLAN_PROGRAMMES_QUERY,
  CARE_PROGRAMME_QUERY,
  CLINIC_CARE_PROGRAMMES_QUERY,
  CLINIC_PROGRAMME_ENROLMENTS_QUERY,
  CLINIC_PROGRAMME_SCHEDULE_QUERY,
  CREATE_CARE_PLAN_PROGRAMME_ITEM_MUTATION,
  CREATE_CARE_PLAN_PROGRAMME_MUTATION,
  CREATE_MEAL_ALTERNATIVE_MUTATION,
  CREATE_PROGRAMME_PRICE_MUTATION,
  CREATE_PROGRAMME_SHARE_LINK_MUTATION,
  CREATE_CARE_PROGRAMME_MUTATION,
  DELETE_CARE_PLAN_PROGRAMME_ITEM_MUTATION,
  DELETE_CARE_PLAN_PROGRAMME_MUTATION,
  DELETE_MEAL_ALTERNATIVE_MUTATION,
  ENROL_PATIENT_IN_PROGRAMME_MUTATION,
  INVITE_PATIENT_TO_PROGRAMME_MUTATION,
  PAUSE_CARE_PROGRAMME_MUTATION,
  PROGRAMME_SHARE_LINKS_QUERY,
  RESUME_CARE_PROGRAMME_MUTATION,
  UPDATE_CARE_PLAN_PROGRAMME_ITEM_MUTATION,
  UPDATE_CARE_PLAN_PROGRAMME_MUTATION,
  UPDATE_MEAL_ALTERNATIVE_MUTATION,
  UPDATE_DRAFT_CARE_PROGRAMME_MUTATION,
  PROGRAMME_COHORTS_QUERY,
  CREATE_PROGRAMME_COHORT_MUTATION,
  UPDATE_PROGRAMME_COHORT_MUTATION,
  OPEN_PROGRAMME_COHORT_MUTATION,
  ACTIVATE_PROGRAMME_COHORT_MUTATION,
  COMPLETE_PROGRAMME_COHORT_MUTATION,
  CANCEL_PROGRAMME_COHORT_MUTATION,
  type CarePlanProgramme,
  type CarePlanProgrammePlanType,
  type MealAlternative,
  type CareProgramme,
  type ProgrammeCohort,
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

type CarePlanProgrammesData = {
  carePlanProgrammes: CarePlanProgramme[];
};

type ProgrammePlanTab = "overview" | "general" | "meal" | "exercise" | "patients" | "cohorts" | "journey" | "sharing" | "settings";

type ProgrammePlanForm = {
  title: string;
  description: string;
  instructions: string;
  monthNumber: string;
  phaseLabel: string;
  scheduleCadence: "monthly" | "weekly";
  sortOrder: string;
  startsOnDay: string;
  endsOnDay: string;
  durationDays: string;
  items: ProgrammePlanItemForm[];
};

type ProgrammePlanItemForm = {
  id?: string;
  clientId: string;
  title: string;
  mealType: string;
  exerciseType: string;
  dayNumber: string;
  timeOfDay: string;
  durationMinutes: string;
  intensity: string;
  instructions: string;
  description: string;
  contentType: "text" | "video" | "both" | "";
  videoUrl: string;
  bodyText: string;
  alternatives: ProgrammeMealAlternativeForm[];
};

type ProgrammeMealAlternativeForm = {
  id?: string;
  clientId: string;
  title: string;
  description: string;
  kcal: string;
  carbsG: string;
  proteinG: string;
  fatG: string;
};

type CreateProgrammeData = {
  createCareProgramme?: {
    programme?: {
      id: string;
    };
  };
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

type ProgrammeAdminWorkflow = "overview" | "setup" | "enrolment" | "activation" | "details";

type ProgrammeWizardCalendarItem = {
  id: string;
  title: string;
  eventType: string;
  day: string;
  endDay: string;
  description: string;
};

const programmeCalendarEventOptions = [
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

const programmeBillingModelOptions = [
  { value: "one_time", label: "Once-off" },
  { value: "monthly", label: "Monthly" },
  { value: "fixed_period", label: "Fixed period" },
];

const programmePlanTabs: Array<{ key: ProgrammePlanTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "general", label: "Care Plans" },
  { key: "meal", label: "Meal Plans" },
  { key: "exercise", label: "Exercise Plans" },
  { key: "patients", label: "Patients" },
  { key: "cohorts", label: "Cohorts" },
  { key: "journey", label: "Care Journey" },
  { key: "sharing", label: "Sharing" },
  { key: "settings", label: "Settings" },
];

const mealTypeOptions = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

const exerciseIntensityOptions = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
];

const scheduleCadenceOptions = [
  { value: "monthly", label: "Monthly (day of month)" },
  { value: "weekly", label: "Weekly (day of week)" },
];

const planContentTypeOptions = [
  { value: "", label: "No attached content" },
  { value: "text", label: "Text" },
  { value: "video", label: "Video" },
  { value: "both", label: "Text and video" },
];

function calendarEventLabel(value: string) {
  return programmeCalendarEventOptions.find((option) => option.value === value)?.label ?? titleCase(value);
}

const defaultProgrammeCalendarItems: ProgrammeWizardCalendarItem[] = [
  { id: "milestone-1", title: "", eventType: "consultant_review", day: "1", endDay: "", description: "" },
];

const emptyProgrammeForm = {
  organizationId: "",
  name: "",
  code: "",
  programmeType: "diabetes",
  description: "",
  patientOffer: "",
  whoItIsFor: "",
  whatHappensNext: "",
  defaultDurationDays: "180",
  defaultMonitoringCadenceDays: "1",
  startsAt: new Date().toISOString().slice(0, 10),
  endsAt: calculateProgrammeEndDate(new Date().toISOString().slice(0, 10), "180"),
  enrolmentOpen: true,
  calendarItems: defaultProgrammeCalendarItems,
  priceName: "",
  priceAmount: "",
  priceCurrency: "ZMW",
  billingModel: "monthly",
  billingInterval: "month",
  includedServiceSummary: "",
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
  if (normalized === "ACTIVE") return "success" as const;
  if (normalized === "DRAFT" || normalized === "INVITED" || normalized === "PENDING_BASELINE") return "warning" as const;
  if (normalized === "PAUSED") return "primary" as const;
  if (normalized === "ARCHIVED" || normalized === "WITHDRAWN") return "danger" as const;
  return "secondary" as const;
}

function normalizePlanType(value: string | null | undefined): CarePlanProgrammePlanType {
  const normalized = (value ?? "").toUpperCase();
  if (normalized === "MEAL_PLAN" || normalized === "EXERCISE_PLAN" || normalized === "GENERAL") return normalized;
  return "GENERAL";
}

function planTitleForType(planType: CarePlanProgrammePlanType) {
  if (normalizePlanType(planType) === "MEAL_PLAN") return "Meal Plans";
  if (normalizePlanType(planType) === "EXERCISE_PLAN") return "Exercise Plans";
  return "Care Plans";
}

function emptyPlanItem(planType: CarePlanProgrammePlanType, sortOrder = 0): ProgrammePlanItemForm {
  const normalized = normalizePlanType(planType);
  return {
    clientId: `programme-plan-item-${Date.now()}-${sortOrder}`,
    title: "",
    mealType: normalized === "MEAL_PLAN" ? "breakfast" : "",
    exerciseType: "",
    dayNumber: "1",
    timeOfDay: "",
    durationMinutes: normalized === "EXERCISE_PLAN" ? "30" : "",
    intensity: normalized === "EXERCISE_PLAN" ? "moderate" : "",
    instructions: "",
    description: "",
    contentType: "text",
    videoUrl: "",
    bodyText: "",
    alternatives: [],
  };
}

function mealAlternativeFormFromAlternative(alternative: MealAlternative): ProgrammeMealAlternativeForm {
  return {
    id: alternative.id,
    clientId: alternative.id,
    title: alternative.title,
    description: alternative.description ?? "",
    kcal: String(alternative.kcal ?? ""),
    carbsG: String(alternative.carbsG ?? ""),
    proteinG: String(alternative.proteinG ?? ""),
    fatG: String(alternative.fatG ?? ""),
  };
}

function emptyMealAlternative(sortOrder = 0): ProgrammeMealAlternativeForm {
  return {
    clientId: `meal-alternative-${Date.now()}-${sortOrder}`,
    title: "",
    description: "",
    kcal: "",
    carbsG: "",
    proteinG: "",
    fatG: "",
  };
}

function emptyPlanForm(planType: CarePlanProgrammePlanType): ProgrammePlanForm {
  return {
    title: "",
    description: "",
    instructions: "",
    monthNumber: "",
    phaseLabel: "",
    scheduleCadence: "monthly",
    sortOrder: "0",
    startsOnDay: "1",
    endsOnDay: "",
    durationDays: "",
    items: [emptyPlanItem(planType)],
  };
}

function planFormFromPlan(plan: CarePlanProgramme): ProgrammePlanForm {
  const planType = normalizePlanType(plan.planType);
  return {
    title: plan.title,
    description: plan.description ?? "",
    instructions: plan.instructions ?? "",
    monthNumber: String(plan.monthNumber ?? ""),
    phaseLabel: plan.phaseLabel ?? "",
    scheduleCadence: plan.scheduleCadence?.toLowerCase() === "weekly" ? "weekly" : "monthly",
    sortOrder: String(plan.sortOrder ?? 0),
    startsOnDay: String(plan.startsOnDay ?? ""),
    endsOnDay: String(plan.endsOnDay ?? ""),
    durationDays: String(plan.durationDays ?? ""),
    items: plan.items.length
      ? plan.items.map((item) => ({
          id: item.id,
          clientId: item.id,
          title: item.title,
          mealType: item.mealType ?? (planType === "MEAL_PLAN" ? "breakfast" : ""),
          exerciseType: item.exerciseType ?? "",
          dayNumber: String(item.dayNumber ?? ""),
          timeOfDay: item.timeOfDay ?? "",
          durationMinutes: String(item.durationMinutes ?? ""),
          intensity: item.intensity ?? (planType === "EXERCISE_PLAN" ? "moderate" : ""),
          instructions: item.instructions ?? "",
          description: item.description ?? "",
          contentType: (item.contentType?.toLowerCase() as ProgrammePlanItemForm["contentType"]) ?? "",
          videoUrl: item.videoUrl ?? "",
          bodyText: item.bodyText ?? "",
          alternatives: (item.mealAlternatives ?? []).map(mealAlternativeFormFromAlternative),
        }))
      : [emptyPlanItem(planType)],
  };
}

function positiveNumberOrUndefined(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function planPayload(form: ProgrammePlanForm, planType: CarePlanProgrammePlanType, includeItems: boolean) {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    description: form.description.trim() || null,
    planType: normalizePlanType(planType).toLowerCase(),
    monthNumber: positiveNumberOrUndefined(form.monthNumber) ?? null,
    phaseLabel: form.phaseLabel.trim() || null,
    scheduleCadence: form.scheduleCadence,
    sortOrder: Number(form.sortOrder) || 0,
    startsOnDay: positiveNumberOrUndefined(form.startsOnDay) ?? null,
    endsOnDay: positiveNumberOrUndefined(form.endsOnDay) ?? null,
    durationDays: positiveNumberOrUndefined(form.durationDays) ?? null,
    instructions: form.instructions.trim() || null,
    metadataJson: {},
  };
  if (includeItems) {
    payload.items = form.items
      .filter((item) => item.title.trim())
      .map((item, index) => itemPayload(item, planType, index));
  }
  return payload;
}

function itemPayload(item: ProgrammePlanItemForm, planType: CarePlanProgrammePlanType, index: number) {
  const normalized = normalizePlanType(planType);
  return {
    title: item.title.trim(),
    description: item.description.trim() || null,
    dayNumber: positiveNumberOrUndefined(item.dayNumber) ?? null,
    timeOfDay: item.timeOfDay || null,
    mealType: normalized === "MEAL_PLAN" ? item.mealType || null : null,
    exerciseType: normalized === "EXERCISE_PLAN" ? item.exerciseType.trim() || item.title.trim() : null,
    durationMinutes: normalized === "EXERCISE_PLAN" ? positiveNumberOrUndefined(item.durationMinutes) ?? null : null,
    intensity: normalized === "EXERCISE_PLAN" ? item.intensity || null : null,
    instructions: item.instructions.trim() || null,
    contentType: item.contentType || null,
    videoUrl: item.videoUrl.trim() || null,
    bodyText: item.bodyText.trim() || null,
    metadataJson: {},
    sortOrder: index,
  };
}

function mealAlternativePayload(alternative: ProgrammeMealAlternativeForm, index: number) {
  return {
    title: alternative.title.trim(),
    description: alternative.description.trim() || null,
    kcal: positiveNumberOrUndefined(alternative.kcal) ?? null,
    carbsG: positiveNumberOrUndefined(alternative.carbsG) ?? null,
    proteinG: positiveNumberOrUndefined(alternative.proteinG) ?? null,
    fatG: positiveNumberOrUndefined(alternative.fatG) ?? null,
    sortOrder: index,
  };
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

function calculateProgrammeEndDate(startDate: string, durationDays: string) {
  const duration = Number(durationDays);
  if (!startDate || !Number.isFinite(duration) || duration < 1) return "";
  const date = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + duration - 1);
  return date.toISOString().slice(0, 10);
}

function programmeCodeFromName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseProgrammeSettings(value: string | null | undefined) {
  try {
    const parsed = JSON.parse(value || "{}") as {
      patientOffer?: string;
      whoItIsFor?: string;
      whatHappensNext?: string;
      careJourneyTemplate?: { items?: unknown };
    };
    return parsed;
  } catch {
    return {};
  }
}

function calendarItemsFromSettings(value: unknown): ProgrammeWizardCalendarItem[] {
  const items = value && typeof value === "object" && "items" in value ? (value as { items?: unknown }).items : value;
  if (!Array.isArray(items)) return defaultProgrammeCalendarItems;
  const parsed = items
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const title = String(raw.title ?? raw.label ?? "").trim();
      if (!title) return null;
      return {
        id: `programme-calendar-${index}-${title}`,
        title,
        eventType: String(raw.eventType ?? raw.event_type ?? "care_team_check_in"),
        day: String(raw.day ?? raw.dayNumber ?? index + 1),
        endDay: String(raw.endDay ?? raw.end_day ?? ""),
        description: String(raw.description ?? raw.detail ?? ""),
      };
    })
    .filter((item): item is ProgrammeWizardCalendarItem => Boolean(item));
  return parsed.length ? parsed : defaultProgrammeCalendarItems;
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
    code: form.code || programmeCodeFromName(form.name),
    description: form.description || undefined,
    programmeType: form.programmeType,
    defaultDurationDays: Number(form.defaultDurationDays) || undefined,
    defaultMonitoringCadenceDays: Number(form.defaultMonitoringCadenceDays) || 1,
    settingsJson: JSON.stringify({
      condition: "diabetes",
      continuityCare: true,
      patientOffer: form.patientOffer,
      whoItIsFor: form.whoItIsFor,
      whatHappensNext: form.whatHappensNext,
      careJourneyTemplate: {
        items: form.calendarItems
          .filter((item) => item.title.trim() && Number(item.day) > 0)
          .map((item) => ({
            title: item.title.trim(),
            eventType: item.eventType,
            day: Number(item.day),
            endDay: Number(item.endDay) > 0 ? Number(item.endDay) : undefined,
            description: item.description.trim() || undefined,
          })),
      },
    }),
    enrolmentOpen: form.enrolmentOpen,
    startsAt: form.startsAt || undefined,
    endsAt: form.endsAt || undefined,
  };
}

function ProgrammeSetupForm({
  programmeId,
}: {
  programmeId?: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const canManageProgrammes = hasProgrammePermission(user, "programme.manage");
  const [step, setStep] = useState(0);
  const [dirty, setDirty] = useState(false);

  const editQuery = useQuery<ProgrammeData>(CARE_PROGRAMME_QUERY, {
    variables: { id: programmeId! },
    skip: !programmeId,
    fetchPolicy: "cache-and-network",
  });
  const selectedProgramme = editQuery.data?.careProgramme ?? null;

  const [form, setForm] = useState(emptyProgrammeForm);

  useEffect(() => {
    if (selectedProgramme) {
      const settings = parseProgrammeSettings(selectedProgramme.settingsJson);
      setForm({
        organizationId: selectedProgramme.organization?.id ?? "",
        name: selectedProgramme.name,
        code: selectedProgramme.code,
        programmeType: selectedProgramme.programmeType,
        description: selectedProgramme.description ?? "",
        patientOffer: settings.patientOffer ?? emptyProgrammeForm.patientOffer,
        whoItIsFor: settings.whoItIsFor ?? emptyProgrammeForm.whoItIsFor,
        whatHappensNext: settings.whatHappensNext ?? emptyProgrammeForm.whatHappensNext,
        defaultDurationDays: String(selectedProgramme.defaultDurationDays ?? 180),
        defaultMonitoringCadenceDays: String(selectedProgramme.defaultMonitoringCadenceDays ?? 1),
        startsAt: selectedProgramme.startsAt ?? "",
        endsAt:
          selectedProgramme.endsAt ??
          calculateProgrammeEndDate(
            selectedProgramme.startsAt ?? "",
            String(selectedProgramme.defaultDurationDays ?? 180),
          ),
        enrolmentOpen: selectedProgramme.enrolmentOpen,
        calendarItems: calendarItemsFromSettings(settings.careJourneyTemplate),
        priceName: emptyProgrammeForm.priceName,
        priceAmount: emptyProgrammeForm.priceAmount,
        priceCurrency: emptyProgrammeForm.priceCurrency,
        billingModel: emptyProgrammeForm.billingModel,
        billingInterval: emptyProgrammeForm.billingInterval,
        includedServiceSummary: emptyProgrammeForm.includedServiceSummary,
      });
    }
  }, [selectedProgramme]);

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const [error, setError] = useState<string | null>(null);
  const [createProgramme, createState] = useMutation<CreateProgrammeData>(
    CREATE_CARE_PROGRAMME_MUTATION,
  );
  const [updateProgramme, updateState] = useMutation(UPDATE_DRAFT_CARE_PROGRAMME_MUTATION);
  const [createPrice, createPriceState] = useMutation(CREATE_PROGRAMME_PRICE_MUTATION);
  const saving = createState.loading || updateState.loading || createPriceState.loading;
  const canSubmitProgramme =
    canManageProgrammes &&
    !saving &&
    Boolean(form.name.trim()) &&
    Number(form.defaultDurationDays) > 0 &&
    Boolean(form.startsAt) &&
    Boolean(form.endsAt);
  const organizationOptions = useMemo(() => {
    const memberships = user?.clinicAccess?.memberships ?? [];
    const seen = new Set<string>();
    return memberships
      .filter((membership) => membership?.organizationId)
      .map((membership) => ({
        value: membership.organizationId as string,
        label: membership.organizationName ?? "Organization",
        description: membership.tenantName ?? undefined,
        badge: titleCase(membership.role),
      }))
      .filter((option) => {
        if (seen.has(option.value)) return false;
        seen.add(option.value);
        return true;
      });
  }, [user?.clinicAccess?.memberships]);

  function updateTiming(
    updates: Partial<Pick<typeof emptyProgrammeForm, "defaultDurationDays" | "startsAt">>,
  ) {
    setForm((current) => {
      const next = { ...current, ...updates };
      const calculatedEnd = calculateProgrammeEndDate(next.startsAt, next.defaultDurationDays);
      return { ...next, endsAt: calculatedEnd };
    });
  }

  function updateCalendarItem(id: string, updates: Partial<ProgrammeWizardCalendarItem>) {
    setForm((current) => ({
      ...current,
      calendarItems: current.calendarItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    }));
  }

  function addCalendarItem() {
    const nextDay = form.calendarItems.reduce((max, item) => {
      const d = Number(item.day) || 0;
      const e = Number(item.endDay) || d;
      return Math.max(max, d, e);
    }, 0) + 1;
    setForm((current) => ({
      ...current,
      calendarItems: [
        ...current.calendarItems,
        {
          id: `programme-step-${Date.now()}`,
          title: "",
          eventType: "consultant_review",
          day: String(nextDay),
          endDay: "",
          description: "",
        },
      ],
    }));
  }

  function removeCalendarItem(id: string) {
    setForm((current) => ({
      ...current,
      calendarItems: current.calendarItems.filter((item) => item.id !== id),
    }));
  }

  const steps = ["Programme", "Schedule", "Patient offer", "Care journey", "Pricing", "Review"];
  const stepDescriptions = [
    "Name your programme, choose its type, and assign it to an organization.",
    "Set how long the programme runs and how often patients should log readings.",
    "Write what patients will see when they find or are invited to this programme.",
    "Build the dated milestones patients follow — reviews, tasks, and check-ins.",
    "Set the price patients or sponsors pay to join this programme.",
    "Check everything looks right before creating your programme.",
  ];

  function canContinue() {
    return !continueBlockedReason();
  }

  function continueBlockedReason(): string | null {
    if (step === 0) {
      if (!form.name.trim()) return "Give your programme a name.";
      if (!form.programmeType) return "Choose a programme type.";
      if (!form.organizationId) return "Select the organization running this programme.";
      return null;
    }
    if (step === 1) {
      if (!(Number(form.defaultDurationDays) > 0)) return "Programme length must be at least 1 day.";
      if (!form.startsAt) return "Choose a start date.";
      if (!form.endsAt) return "End date could not be calculated — check the start date and length.";
      if (!(Number(form.defaultMonitoringCadenceDays) > 0))
        return "Reading frequency must be at least 1 day.";
      return null;
    }
    if (step === 2) {
      if (!form.patientOffer.trim()) return "Describe what this programme is for patients.";
      if (!form.whoItIsFor.trim()) return "Describe who this programme is for.";
      if (!form.whatHappensNext.trim()) return "Explain what happens after a patient joins.";
      return null;
    }
    if (step === 3) {
      return form.calendarItems.some((item) => item.title.trim() && Number(item.day) > 0)
        ? null
        : "Add at least one milestone with a title and day number.";
    }
    if (step === 4) {
      if (selectedProgramme) return null;
      if (!form.priceName.trim()) return "Give this price tier a name.";
      if (!(Number(form.priceAmount) > 0)) return "Enter an amount greater than 0.";
      return null;
    }
    return canSubmitProgramme
      ? null
      : "Complete the required fields before creating this programme.";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isReviewStep) {
      goNext();
      return;
    }
    setError(null);
    if (!form.startsAt || !form.endsAt || Number(form.defaultDurationDays) <= 0) {
      setError("Programme duration, start date, and end date are required.");
      return;
    }
    try {
      if (selectedProgramme?.status === "DRAFT") {
        await updateProgramme({
          variables: { programmeId: selectedProgramme.id, data: programmePayload(form) },
        });
        setDirty(false);
        router.push(`/consultant/programmes/${selectedProgramme.id}`);
        return;
      }
      const response = await createProgramme({ variables: { data: programmePayload(form) } });
      const createdId = response.data?.createCareProgramme?.programme?.id;
      if (createdId && Number(form.priceAmount) > 0) {
        await createPrice({
          variables: {
            programmeId: createdId,
            data: {
              name: form.priceName,
              currency: form.priceCurrency,
              amount: form.priceAmount,
              billingModel: form.billingModel,
              billingInterval: form.billingInterval || undefined,
              includedServiceSummary: form.includedServiceSummary,
              approved: true,
            },
          },
        });
      }
      setDirty(false);
      router.push(createdId ? `/consultant/programmes/${createdId}` : "/consultant/programmes");
    } catch (err) {
      setError(mapError(err));
    }
  }

  const isFirstStep = step === 0;
  const isReviewStep = step === steps.length - 1;
  const blockedReason = continueBlockedReason();
  const stepContinueAllowed = !blockedReason;
  const sortedCalendarPreview = [...form.calendarItems]
    .filter((item) => item.title.trim() && Number(item.day) > 0)
    .sort((a, b) => Number(a.day) - Number(b.day));
  const selectedOrganizationLabel =
    organizationOptions.find((option) => option.value === form.organizationId)?.label ??
    "Not selected";
  const billingModelLabel =
    programmeBillingModelOptions.find((option) => option.value === form.billingModel)?.label ??
    form.billingModel;

  function goNext() {
    if (!canContinue()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function goBack() {
    setStep((current) => Math.max(current - 1, 0));
  }

  if (programmeId && editQuery.loading && !selectedProgramme) {
    return (
      <Panel>
        <PanelBody>
          <p className="py-8 text-center text-sm text-muted">Loading programme…</p>
        </PanelBody>
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            if (dirty && !window.confirm("You have unsaved changes. Leave anyway?")) return;
            router.push(
              selectedProgramme
                ? `/consultant/programmes/${selectedProgramme.id}`
                : "/consultant/programmes",
            );
          }}
        >
          <ArrowLeft className="size-4" />
          Back
        </Button>
        <h2 className="text-lg font-semibold text-ink">
          {selectedProgramme ? `Edit: ${selectedProgramme.name}` : "New care programme"}
        </h2>
      </div>

      <Panel>
        <PanelBody className="space-y-5">
        {error ? (
          <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}
        <OnboardingStepper steps={steps} currentStep={step} />
        <form onSubmit={(event) => void handleSubmit(event)} onChange={() => { if (!dirty) setDirty(true); }} className="space-y-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Step {step + 1} of {steps.length}
            </p>
            <h3 className="text-lg font-semibold text-text">{steps[step]}</h3>
            <p className="text-sm text-muted">{stepDescriptions[step]}</p>
          </div>

          {step === 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="programme-name">Programme name</Label>
                <Input
                  id="programme-name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Diabetes continuity programme"
                />
                {form.name.trim() ? (
                  <p className="text-xs text-muted">
                    Code: <span className="font-mono text-text">{form.code || programmeCodeFromName(form.name)}</span>
                  </p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-type">Programme type</Label>
                <Select
                  id="programme-type"
                  value={form.programmeType}
                  options={PROGRAMME_TYPE_OPTIONS}
                  disabled={!canManageProgrammes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, programmeType: event.target.value }))
                  }
                />
              </div>
              <SearchableSelector
                id="programme-org"
                label="Organization"
                value={form.organizationId}
                options={organizationOptions}
                placeholder="Select the organization running this programme"
                emptyLabel="No organizations found in your session"
                disabled={!canManageProgrammes}
                onChange={(organizationId) =>
                  setForm((current) => ({ ...current, organizationId }))
                }
              />
              <div className="flex flex-col gap-1.5 self-end pb-2">
                <label className="flex items-center gap-2 text-sm text-text">
                  <input
                    type="checkbox"
                    checked={form.enrolmentOpen}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, enrolmentOpen: event.target.checked }))
                    }
                  />
                  Open enrolment
                </label>
                <p className="pl-6 text-xs text-muted">
                  When on, patients can find and join this programme themselves. When off, only staff can enrol patients.
                </p>
              </div>
              <div className="space-y-1.5 lg:col-span-2">
                <Label htmlFor="programme-description">Internal description</Label>
                <Textarea
                  id="programme-description"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Notes for your care team — patients won't see this"
                />
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="programme-duration">Programme length (days)</Label>
                <Input
                  id="programme-duration"
                  type="number"
                  min={1}
                  value={form.defaultDurationDays}
                  required
                  onChange={(event) => updateTiming({ defaultDurationDays: event.target.value })}
                  placeholder="e.g. 180"
                />
                <p className="text-xs text-muted">
                  How many days each patient stays on the programme.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-cadence">Reading frequency (days)</Label>
                <Input
                  id="programme-cadence"
                  type="number"
                  min={1}
                  value={form.defaultMonitoringCadenceDays}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      defaultMonitoringCadenceDays: event.target.value,
                    }))
                  }
                  placeholder="e.g. 1"
                />
                <p className="text-xs text-muted">
                  How often patients are expected to log a reading. 1 = daily.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-start">Start date</Label>
                <Input
                  id="programme-start"
                  type="date"
                  value={form.startsAt}
                  required
                  onChange={(event) => updateTiming({ startsAt: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-end">End date</Label>
                <Input
                  id="programme-end"
                  type="date"
                  value={form.endsAt}
                  required
                  readOnly
                  className="bg-muted/10 text-muted"
                />
                <p className="text-xs text-muted">
                  Auto-calculated: start date + {form.defaultDurationDays || "…"} days.
                </p>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="programme-patient-offer">What is this programme?</Label>
                <Textarea
                  id="programme-patient-offer"
                  value={form.patientOffer}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, patientOffer: event.target.value }))
                  }
                  placeholder="e.g. A structured diabetes support programme with monitoring, care-team follow-up, and consultant reviews."
                />
                <p className="text-xs text-muted">
                  Patients see this when they find or are invited to the programme.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-who-for">Who is it for?</Label>
                <Textarea
                  id="programme-who-for"
                  value={form.whoItIsFor}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, whoItIsFor: event.target.value }))
                  }
                  placeholder="e.g. Adults living with diabetes who need regular follow-up, glucose review, and clearer next steps."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-what-next">What happens after joining?</Label>
                <Textarea
                  id="programme-what-next"
                  value={form.whatHappensNext}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, whatHappensNext: event.target.value }))
                  }
                  placeholder="e.g. The patient meets the care team, follows a dated care journey, logs readings, and books reviews when needed."
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-background px-3 py-2">
                <p className="text-sm text-text">
                  Each milestone appears on the patient&apos;s care journey timeline. They run from day 1 to day {form.defaultDurationDays || "…"} of the programme.
                </p>
                <p className="mt-1 text-xs text-muted">
                  You can always add, remove, or reschedule milestones after the programme is created.
                </p>
              </div>
              <div className="space-y-3">
                {form.calendarItems.map((item, index) => {
                  const durationDays = Number(form.defaultDurationDays);
                  const lastDay = Number(item.endDay) > 0 ? Number(item.endDay) : Number(item.day);
                  const beyondDuration = durationDays > 0 && lastDay > durationDays;
                  return (
                    <div
                      key={item.id}
                      className="space-y-3 rounded-xl border border-border bg-background p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                          Milestone {index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeCalendarItem(item.id)}
                          className="text-muted transition hover:text-danger"
                          aria-label="Remove milestone"
                        >
                          <X className="size-4" />
                        </button>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`calendar-title-${item.id}`}>Title</Label>
                          <Input
                            id={`calendar-title-${item.id}`}
                            value={item.title}
                            onChange={(event) =>
                              updateCalendarItem(item.id, { title: event.target.value })
                            }
                            placeholder="e.g. First glucose trend review"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`calendar-type-${item.id}`}>Type</Label>
                          <Select
                            id={`calendar-type-${item.id}`}
                            value={item.eventType}
                            options={programmeCalendarEventOptions}
                            onChange={(event) =>
                              updateCalendarItem(item.id, { eventType: event.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`calendar-day-${item.id}`}>Start day</Label>
                          <Input
                            id={`calendar-day-${item.id}`}
                            type="number"
                            min={1}
                            value={item.day}
                            onChange={(event) =>
                              updateCalendarItem(item.id, { day: event.target.value })
                            }
                            placeholder="e.g. 1"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`calendar-endday-${item.id}`}>
                            End day <span className="font-normal text-muted">(optional)</span>
                          </Label>
                          <Input
                            id={`calendar-endday-${item.id}`}
                            type="number"
                            min={1}
                            value={item.endDay}
                            onChange={(event) =>
                              updateCalendarItem(item.id, { endDay: event.target.value })
                            }
                            placeholder="Single day if blank"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`calendar-desc-${item.id}`}>Description</Label>
                        <Textarea
                          id={`calendar-desc-${item.id}`}
                          value={item.description}
                          onChange={(event) =>
                            updateCalendarItem(item.id, { description: event.target.value })
                          }
                          placeholder="What the patient or care team should do on this day"
                        />
                      </div>
                      {beyondDuration ? (
                        <p className="text-xs text-warning">
                          This falls after the programme ends on day {durationDays}. Extend the
                          duration or move this milestone earlier.
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addCalendarItem}
                className="gap-1.5"
              >
                <Plus className="size-4" />
                Add milestone
              </Button>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4">
              {selectedProgramme ? (
                <p className="rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted">
                  Pricing is set when a programme is first created. Manage pricing for existing
                  programmes from{" "}
                  <a
                    href="/consultant/billing/prices"
                    className="font-medium text-primary underline underline-offset-2"
                  >
                    Billing &rsaquo; Prices
                  </a>
                  .
                </p>
              ) : null}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="programme-price-name">Price tier name</Label>
                  <Input
                    id="programme-price-name"
                    value={form.priceName}
                    disabled={Boolean(selectedProgramme)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, priceName: event.target.value }))
                    }
                    placeholder="e.g. Diabetes continuity package"
                  />
                  <p className="text-xs text-muted">
                    The name patients see on their invoice.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="programme-price-amount">Amount (ZMW)</Label>
                  <Input
                    id="programme-price-amount"
                    type="number"
                    min={0}
                    value={form.priceAmount}
                    disabled={Boolean(selectedProgramme)}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, priceAmount: event.target.value }))
                    }
                    placeholder="e.g. 150"
                  />
                  <p className="text-xs text-muted">Amount in Zambian Kwacha.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="programme-billing-model">How patients pay</Label>
                  <Select
                    id="programme-billing-model"
                    value={form.billingModel}
                    options={programmeBillingModelOptions}
                    disabled={Boolean(selectedProgramme)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        billingModel: event.target.value,
                        billingInterval: event.target.value === "monthly" ? "month" : "",
                      }))
                    }
                  />
                </div>
                {form.billingModel === "fixed_period" ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="programme-billing-interval">Billing interval</Label>
                    <Input
                      id="programme-billing-interval"
                      value={form.billingInterval}
                      disabled={Boolean(selectedProgramme)}
                      placeholder="e.g. programme"
                      onChange={(event) =>
                        setForm((current) => ({ ...current, billingInterval: event.target.value }))
                      }
                    />
                  </div>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="programme-included-services">What&apos;s included</Label>
                <Textarea
                  id="programme-included-services"
                  value={form.includedServiceSummary}
                  disabled={Boolean(selectedProgramme)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      includedServiceSummary: event.target.value,
                    }))
                  }
                  placeholder="e.g. Care journey calendar, glucose monitoring review, care-team follow-up, and consultant booking."
                />
              </div>
              <p className="text-xs text-muted">
                Cash and off-platform payments can be recorded after the programme is created.
              </p>
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Programme
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  {form.name || "Untitled programme"}
                </p>
                <p className="text-sm text-muted">
                  {labelForChoice(PROGRAMME_TYPE_OPTIONS, form.programmeType)} &middot;{" "}
                  {selectedOrganizationLabel} &middot;{" "}
                  {form.enrolmentOpen ? "Open enrolment" : "Staff-only enrolment"}
                </p>
                {form.description ? (
                  <p className="mt-2 text-xs text-muted italic">{form.description}</p>
                ) : null}
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Schedule
                </p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text">
                  <span>{form.defaultDurationDays} days</span>
                  <span className="text-muted">&middot;</span>
                  <span>{formatDateRange(form.startsAt, form.endsAt)}</span>
                  <span className="text-muted">&middot;</span>
                  <span>readings every {form.defaultMonitoringCadenceDays === "1" ? "day" : `${form.defaultMonitoringCadenceDays} days`}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  What patients see
                </p>
                <p className="text-sm text-text">{form.patientOffer || <span className="italic text-muted">Not set</span>}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium text-muted">Who it&apos;s for</p>
                    <p className="text-sm text-text">{form.whoItIsFor || <span className="italic text-muted">Not set</span>}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted">After joining</p>
                    <p className="text-sm text-text">{form.whatHappensNext || <span className="italic text-muted">Not set</span>}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Care journey ({sortedCalendarPreview.length} milestone{sortedCalendarPreview.length !== 1 ? "s" : ""})
                </p>
                {sortedCalendarPreview.length ? (
                  <div className="mt-3 space-y-0">
                    {sortedCalendarPreview.map((item, idx) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {item.day}
                          </div>
                          {idx < sortedCalendarPreview.length - 1 ? (
                            <div className="w-px grow bg-border" />
                          ) : null}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm font-medium text-text">
                            {item.title}
                            {item.endDay ? <span className="text-muted"> (days {item.day}–{item.endDay})</span> : null}
                          </p>
                          <p className="text-xs text-muted">{calendarEventLabel(item.eventType)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted">No milestones added.</p>
                )}
              </div>

              {!selectedProgramme ? (
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Pricing
                  </p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text">
                    <span>{form.priceName || "Unnamed tier"}</span>
                    <span className="text-muted">&middot;</span>
                    <span className="font-semibold">{form.priceCurrency} {form.priceAmount}</span>
                    <span className="text-muted">&middot;</span>
                    <span>{billingModelLabel}</span>
                  </div>
                  {form.includedServiceSummary ? (
                    <p className="mt-2 text-xs text-muted">{form.includedServiceSummary}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2 border-t border-border pt-4">
            {blockedReason ? (
              <p className="text-xs text-danger">{blockedReason}</p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={goBack}
                  disabled={isFirstStep}
                >
                  Back
                </Button>
                <Button href="/consultant/programmes" type="button" size="sm" variant="ghost">
                  Cancel
                </Button>
              </div>
              {isReviewStep ? (
                <Button type="submit" size="sm" disabled={!canSubmitProgramme || saving}>
                  {saving ? (
                    "Saving..."
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      {selectedProgramme?.status === "DRAFT"
                        ? "Update draft"
                        : "Create programme"}
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={goNext} disabled={!stepContinueAllowed}>
                  Next
                </Button>
              )}
            </div>
          </div>
        </form>
      </PanelBody>
      </Panel>
    </div>
  );
}

function EnrolmentForm({ programme, onDone }: { programme: CareProgramme; onDone: () => void }) {
  const { user } = useAuth();
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [patientId, setPatientId] = useState("");
  const [mode, setMode] = useState<"existing" | "invite">("existing");
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
          data: {
            monitoringCadenceOverrideDays: programme.defaultMonitoringCadenceDays || undefined,
          },
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
      {error ? (
        <p className="rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div
        className="flex gap-2 border-b border-border pb-3"
        role="group"
        aria-label="Enrolment method"
      >
        <Button
          type="button"
          size="sm"
          variant={mode === "existing" ? "primary" : "secondary"}
          aria-pressed={mode === "existing"}
          disabled={saving}
          onClick={() => {
            setError(null);
            setMode("existing");
          }}
        >
          Existing patient
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "invite" ? "primary" : "secondary"}
          aria-pressed={mode === "invite"}
          disabled={saving}
          onClick={() => {
            setError(null);
            setMode("invite");
          }}
        >
          Invite patient
        </Button>
      </div>
      {mode === "existing" ? (
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
          <Button
            type="submit"
            size="sm"
            disabled={!canEnrolPatients || saving || !patientId.trim()}
          >
            Enrol patient
          </Button>
        </form>
      ) : (
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="Patient email"
              type="email"
            />
            <Input
              value={inviteName}
              onChange={(event) => setInviteName(event.target.value)}
              placeholder="Full name"
            />
            <Input
              value={invitePhone}
              onChange={(event) => setInvitePhone(event.target.value)}
              placeholder="Mobile money phone"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={!canEnrolPatients || saving || !inviteEmail.trim()}
          >
            <Send className="size-4" />
            Invite patient
          </Button>
        </form>
      )}
    </div>
  );
}

function ProgrammePlanSummaryPanel({ programme }: { programme: CareProgramme }) {
  const settings = parseProgrammeSettings(programme.settingsJson);
  const items = settings.careJourneyTemplate
    ? calendarItemsFromSettings(settings.careJourneyTemplate)
        .filter((item) => item.title.trim() && Number(item.day) > 0)
        .sort((a, b) => Number(a.day) - Number(b.day))
    : [];
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={items.length}>
          Programme Milestones
        </PanelTitle>
      </PanelHeader>
      {items.length === 0 ? (
        <PanelEmpty>No programme milestones configured.</PanelEmpty>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="bg-background text-xs text-muted">
              <tr>
                <th scope="col" className="px-5 py-3 font-medium">
                  Day
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Milestone
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-5 py-4">
                    {item.day}
                    {item.endDay ? ` - ${item.endDay}` : ""}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium">{item.title}</p>
                    {item.description ? (
                      <p className="mt-1 break-words text-xs text-muted">{item.description}</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-4 text-muted">{calendarEventLabel(item.eventType)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
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
    <div id="share-care-plan" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">Share care programme</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Public programme offer, package prices, and enrolment link.
          </p>
        </div>
        <Button type="button" size="sm" variant="secondary" disabled={disabled} onClick={() => void handleCreateShareLink()}>
          <Share2 className="size-4" />
          {createState.loading ? "Creating..." : shareLink ? "Create new share link" : "Share care programme"}
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
        <p className="mt-3 text-xs text-muted">Public enrolment requires an active programme with enrolment open.</p>
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
  const checklist = readinessItems(selectedEnrolment);
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Users}>Readiness And Care Team</PanelTitle>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {selectedEnrolment ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <p className="text-sm font-semibold">
                  {selectedEnrolment.patient.fullName ??
                    selectedEnrolment.patient.email}
                </p>
                <p className="text-xs text-muted">
                  Lead clinician:{" "}
                  {selectedEnrolment.leadProvider?.displayName ??
                    "Not assigned"}
                </p>
              </div>
              <ProgrammeEnrolmentActions
                key={selectedEnrolment.id}
                enrolment={selectedEnrolment}
                onChanged={onChanged}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {checklist.map((item) => (
                <div key={item.label} className="border-b border-border py-3">
                  <div className="flex items-center gap-2">
                    {item.ready ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <Circle className="size-4 text-warning" />
                    )}
                    <p className="text-sm font-medium">{item.label}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedEnrolment.careTeamAssignments
                .filter((assignment) => assignment.active)
                .map((assignment) => (
                  <Badge key={assignment.id} variant="secondary">
                    {labelForChoice(
                      PROGRAMME_CARE_TEAM_ROLE_OPTIONS,
                      assignment.role,
                    )}
                    :{" "}
                    {assignment.provider?.displayName ??
                      assignment.assignedUserDisplayName}
                  </Badge>
                ))}
            </div>
          </>
        ) : (
          <PanelEmpty>
            Select an enrolled patient to review activation readiness.
          </PanelEmpty>
        )}
      </PanelBody>
    </Panel>
  );
}

function ProgrammesListView() {
  const router = useRouter();
  const { user } = useAuth();
  const canManage = hasProgrammePermission(user, "programme.manage");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [clinic, setClinic] = useState("ALL");
  const [enrolmentFilter, setEnrolmentFilter] = useState("ALL");
  const [sort, setSort] = useState("NAME");
  const [page, setPage] = useState(1);
  const programmesQuery = useQuery<ProgrammesData>(CLINIC_CARE_PROGRAMMES_QUERY, {
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const programmes = programmesQuery.data?.clinicCareProgrammes ?? [];
  const statusTabs = [
    { key: "ALL", label: "All" },
    { key: "ACTIVE", label: "Active" },
    { key: "DRAFT", label: "Drafts" },
    { key: "PAUSED", label: "Paused" },
    { key: "ARCHIVED", label: "Archived" },
  ];
  const clinicOptions = Array.from(
    new Map(
      programmes.map((programme) => [
        programme.organization?.id ?? "UNASSIGNED",
        {
          value: programme.organization?.id ?? "UNASSIGNED",
          label: programme.organization?.name ?? "No organization",
        },
      ]),
    ).values(),
  ).sort((left, right) => left.label.localeCompare(right.label));
  const hasFilters = Boolean(
    search || status !== "ALL" || clinic !== "ALL" || enrolmentFilter !== "ALL" || sort !== "NAME",
  );
  const filtered = programmes
    .filter((programme) => {
      const open = programme.status === "ACTIVE" && programme.enrolmentOpen;
      return (
        (status === "ALL" || programme.status === status) &&
        (clinic === "ALL" || (programme.organization?.id ?? "UNASSIGNED") === clinic) &&
        (enrolmentFilter === "ALL" || (enrolmentFilter === "OPEN" ? open : !open)) &&
        [programme.name, programme.code, programme.organization?.name].some((value) =>
          value?.toLowerCase().includes(search.trim().toLowerCase()),
        )
      );
    })
    .sort((left, right) => {
      if (sort === "NEWEST")
        return right.createdAt.localeCompare(left.createdAt) || left.name.localeCompare(right.name);
      if (sort === "START")
        return (
          (left.startsAt ?? "9999-12-31").localeCompare(right.startsAt ?? "9999-12-31") ||
          left.name.localeCompare(right.name)
        );
      return left.name.localeCompare(right.name);
    });
  const pageSize = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;
  const visibleProgrammes = filtered.slice(offset, offset + pageSize);

  function resetFilters() {
    setSearch("");
    setStatus("ALL");
    setClinic("ALL");
    setEnrolmentFilter("ALL");
    setSort("NAME");
    setPage(1);
  }

  return (
    <div className="min-w-0 space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h1 className="text-xl font-semibold text-ink">Care Programmes</h1>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Refresh programmes"
            aria-label="Refresh programmes"
            disabled={programmesQuery.loading}
            onClick={() => void programmesQuery.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" size="sm" disabled={!canManage} onClick={() => router.push("/consultant/programmes/setup")}>
            <Plus className="size-4" />
            New programme
          </Button>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Programme status"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {statusTabs.map((tab, index) => (
          <button
            key={tab.key}
            id={`programme-list-tab-${tab.key}`}
            role="tab"
            aria-selected={status === tab.key}
            aria-controls="programme-list-results"
            tabIndex={status === tab.key ? 0 : -1}
            type="button"
            onClick={() => {
              setStatus(tab.key);
              setPage(1);
            }}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % statusTabs.length;
              else if (event.key === "ArrowLeft")
                next = (index - 1 + statusTabs.length) % statusTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = statusTabs.length - 1;
              else return;
              event.preventDefault();
              setStatus(statusTabs[next].key);
              setPage(1);
              (
                event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined
              )?.focus();
            }}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${status === tab.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}
          >
            {tab.label}
            <span className="text-xs tabular-nums">
              {programmesQuery.loading && !programmesQuery.data
                ? "..."
                : tab.key === "ALL"
                  ? programmes.length
                  : programmes.filter((programme) => programme.status === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted" />
          <Input
            aria-label="Search care programmes"
            placeholder="Search programme, code, or organization"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        {clinicOptions.length > 1 ? (
          <Select
            aria-label="Filter by organization"
            className="w-full sm:w-48"
            value={clinic}
            options={[{ value: "ALL", label: "All organizations" }, ...clinicOptions]}
            onChange={(event) => {
              setClinic(event.target.value);
              setPage(1);
            }}
          />
        ) : null}
        <Select
          aria-label="Filter by enrolment availability"
          className="w-full sm:w-48"
          value={enrolmentFilter}
          options={[
            { value: "ALL", label: "All enrolment" },
            { value: "OPEN", label: "Open enrolment" },
            { value: "CLOSED", label: "Closed enrolment" },
          ]}
          onChange={(event) => {
            setEnrolmentFilter(event.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Sort programmes"
          className="w-full sm:w-44"
          value={sort}
          options={[
            { value: "NAME", label: "Name: A to Z" },
            { value: "NEWEST", label: "Newest first" },
            { value: "START", label: "Start date" },
          ]}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          title="Reset filters"
          aria-label="Reset filters"
          className="size-11 shrink-0 px-0"
          disabled={!hasFilters}
          onClick={resetFilters}
        >
          <X className="size-4" />
        </Button>
      </div>

      <section
        role="tabpanel"
        id="programme-list-results"
        aria-labelledby={`programme-list-tab-${status}`}
        aria-busy={programmesQuery.loading}
        className="min-w-0"
      >
        {programmesQuery.error ? (
          <div className="space-y-3 border-y border-border py-8 text-center">
            <p role="alert" className="text-sm text-danger">
              Unable to load care programmes.
            </p>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void programmesQuery.refetch()}
            >
              <RefreshCw className="size-4" />
              Retry
            </Button>
          </div>
        ) : programmesQuery.loading && !programmesQuery.data ? (
          <div
            className="space-y-3 border-y border-border py-6"
            aria-label="Loading care programmes"
          >
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="h-12 animate-pulse bg-border/30" />
            ))}
          </div>
        ) : visibleProgrammes.length === 0 ? (
          <div className="space-y-3 border-y border-border py-12 text-center">
            <p className="text-sm text-muted">
              {programmes.length === 0
                ? "No care programmes yet."
                : "No programmes match these filters."}
            </p>
            {programmes.length > 0 && hasFilters ? (
              <Button type="button" size="sm" variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <div
            role="region"
            aria-label="Care programmes table"
            tabIndex={0}
            className="overflow-x-auto border-y border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <table className="w-full min-w-[960px] table-fixed text-left text-sm">
              <caption className="sr-only">Care programmes matching the selected filters</caption>
              <colgroup>
                <col />
                <col className="w-32" />
                <col className="w-52" />
                <col className="w-28" />
                <col className="w-32" />
                <col className="w-36" />
              </colgroup>
              <thead className="border-b border-border bg-background/80 text-xs text-muted">
                <tr>
                  {["Programme", "Status", "Dates", "Duration", "Enrolment", "Actions"].map(
                    (label) => (
                      <th key={label} scope="col" className="px-4 py-3.5 font-semibold first:pl-5">
                        {label === "Actions" ? <span className="sr-only">{label}</span> : label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-surface">
                {visibleProgrammes.map((programme) => (
                  <tr
                    key={programme.id}
                    className="group align-middle transition-colors even:bg-background/30 hover:bg-primary/5 focus-within:bg-primary/5"
                  >
                    <td className="border-l-2 border-transparent py-4 pl-5 pr-4 group-hover:border-primary/50 group-focus-within:border-primary/50">
                      <Button
                        href={`/consultant/programmes/${programme.id}`}
                        variant="ghost"
                        size="sm"
                        className="h-auto max-w-full justify-start rounded-sm whitespace-normal break-words p-0 text-left font-semibold leading-5 text-ink hover:bg-transparent hover:text-primary hover:underline"
                      >
                        {programme.name}
                      </Button>
                      <p className="mt-1.5 break-words font-mono text-xs text-muted">
                        {programme.code}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={statusVariant(programme.status)}
                        className="gap-1.5 rounded-md px-2 py-1 tracking-normal"
                      >
                        <span
                          aria-hidden="true"
                          className="size-1.5 shrink-0 rounded-full bg-current"
                        />
                        {titleCase(programme.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs tabular-nums">
                      <dl className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-2 gap-y-1.5">
                        <dt className="text-muted">Start</dt>
                        <dd className="break-words text-text">
                          {programme.startsAt ? formatDate(programme.startsAt) : "Not set"}
                        </dd>
                        <dt className="text-muted">End</dt>
                        <dd className="break-words text-text">
                          {programme.endsAt ? formatDate(programme.endsAt) : "Not set"}
                        </dd>
                      </dl>
                    </td>
                    <td className="px-4 py-4 text-text">
                      {programme.defaultDurationDays ? (
                        <>
                          <span className="font-medium tabular-nums">
                            {programme.defaultDurationDays}
                          </span>
                          <span className="ml-1 text-xs text-muted">days</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted">Open-ended</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {programme.status === "ACTIVE" && programme.enrolmentOpen ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                          <CheckCircle2 aria-hidden="true" className="size-3.5 shrink-0" />
                          Open
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                          <Circle aria-hidden="true" className="size-3.5 shrink-0" />
                          Closed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        href={`/consultant/programmes/${programme.id}`}
                        variant="secondary"
                        size="sm"
                        aria-label={`View details for ${programme.name}`}
                      >
                        View details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!programmesQuery.error && programmesQuery.data ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="text-xs text-muted">
              {filtered.length
                ? `${offset + 1}-${Math.min(offset + pageSize, filtered.length)} of ${filtered.length} programmes`
                : "0 programmes"}
            </p>
            {totalPages > 1 ? (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  title="Previous page"
                  aria-label="Previous page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-xs tabular-nums text-muted">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  title="Next page"
                  aria-label="Next page"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
          </footer>
        ) : null}
      </section>

    </div>
  );
}

function ProgrammeSharedPlansPanel({
  programmeId,
  planType,
  canManage,
}: {
  programmeId: string;
  planType: CarePlanProgrammePlanType;
  canManage: boolean;
}) {
  const normalizedPlanType = normalizePlanType(planType);
  const plansQuery = useQuery<CarePlanProgrammesData>(CARE_PLAN_PROGRAMMES_QUERY, {
    variables: { programmeId, planType: normalizedPlanType.toLowerCase() },
    fetchPolicy: "cache-and-network",
  });
  const plans = plansQuery.data?.carePlanProgrammes ?? [];
  const [editingPlan, setEditingPlan] = useState<CarePlanProgramme | null>(null);
  const [creating, setCreating] = useState(false);
  const [viewingPlan, setViewingPlan] = useState<CarePlanProgramme | null>(null);
  const [editorTab, setEditorTab] = useState<"details" | "items">("details");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgrammePlanForm>(() => emptyPlanForm(normalizedPlanType));
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createPlan, createPlanState] = useMutation(CREATE_CARE_PLAN_PROGRAMME_MUTATION);
  const [updatePlan, updatePlanState] = useMutation(UPDATE_CARE_PLAN_PROGRAMME_MUTATION);
  const [deletePlan, deletePlanState] = useMutation(DELETE_CARE_PLAN_PROGRAMME_MUTATION);
  const [createAlternative, createAlternativeState] = useMutation(CREATE_MEAL_ALTERNATIVE_MUTATION);
  const [updateAlternative, updateAlternativeState] = useMutation(UPDATE_MEAL_ALTERNATIVE_MUTATION);
  const [deleteAlternative, deleteAlternativeState] = useMutation(DELETE_MEAL_ALTERNATIVE_MUTATION);
  const [createItem, createItemState] = useMutation(CREATE_CARE_PLAN_PROGRAMME_ITEM_MUTATION);
  const [updateItem, updateItemState] = useMutation(UPDATE_CARE_PLAN_PROGRAMME_ITEM_MUTATION);
  const [deleteItem, deleteItemState] = useMutation(DELETE_CARE_PLAN_PROGRAMME_ITEM_MUTATION);
  const saving =
    createPlanState.loading ||
    updatePlanState.loading ||
    deletePlanState.loading ||
    createAlternativeState.loading ||
    updateAlternativeState.loading ||
    deleteAlternativeState.loading ||
    createItemState.loading ||
    updateItemState.loading ||
    deleteItemState.loading;
  const isMeal = normalizedPlanType === "MEAL_PLAN";
  const isExercise = normalizedPlanType === "EXERCISE_PLAN";
  const Icon = isMeal ? Utensils : isExercise ? Dumbbell : ClipboardList;
  const activePlan = editingPlan;
  const selectedItem = form.items.find((item) => item.clientId === selectedItemId) ?? form.items[0];
  const scheduleDayMaximum = form.scheduleCadence === "weekly" ? 7 : 30;
  const valid =
    Boolean(form.title.trim()) &&
    (!form.monthNumber || (Number.isInteger(Number(form.monthNumber)) && Number(form.monthNumber) > 0)) &&
    (!form.sortOrder || (Number.isInteger(Number(form.sortOrder)) && Number(form.sortOrder) >= 0)) &&
    (!form.startsOnDay || (Number.isInteger(Number(form.startsOnDay)) && Number(form.startsOnDay) > 0)) &&
    (!form.endsOnDay || (Number.isInteger(Number(form.endsOnDay)) && Number(form.endsOnDay) > 0)) &&
    (!form.durationDays || (Number.isInteger(Number(form.durationDays)) && Number(form.durationDays) > 0)) &&
    (!form.startsOnDay || !form.endsOnDay || Number(form.endsOnDay) >= Number(form.startsOnDay)) &&
    !(form.durationDays && (form.startsOnDay || form.endsOnDay)) &&
    form.items.every((item) => {
      if (!item.title.trim()) return true;
      if (item.dayNumber && !(Number.isInteger(Number(item.dayNumber)) && Number(item.dayNumber) >= 1 && Number(item.dayNumber) <= scheduleDayMaximum)) return false;
      if (isExercise && item.durationMinutes && !(Number.isInteger(Number(item.durationMinutes)) && Number(item.durationMinutes) > 0)) return false;
      if (item.alternatives.some((alternative) => alternative.title.trim() &&
        [alternative.kcal, alternative.carbsG, alternative.proteinG, alternative.fatG]
          .some((value) => value && !(Number.isInteger(Number(value)) && Number(value) > 0)))) return false;
      return true;
    });

  function startCreate() {
    setError(null);
    setEditingPlan(null);
    setCreating(true);
    setForm(emptyPlanForm(normalizedPlanType));
    setEditorTab("details");
    setSelectedItemId(null);
  }

  function startEdit(plan: CarePlanProgramme) {
    setError(null);
    setCreating(false);
    setEditingPlan(plan);
    setForm(planFormFromPlan(plan));
    setEditorTab("details");
    setSelectedItemId(null);
  }

  function closeEditor() {
    if (saving) return;
    setCreating(false);
    setEditingPlan(null);
    setDeleteItemId(null);
    setError(null);
  }

  function updateItemForm(clientId: string, updates: Partial<ProgrammePlanItemForm>) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.clientId === clientId ? { ...item, ...updates } : item,
      ),
    }));
  }

  function addItem() {
    const item = emptyPlanItem(normalizedPlanType, form.items.length);
    setForm((current) => ({ ...current, items: [...current.items, item] }));
    setSelectedItemId(item.clientId);
  }

  async function removeItem(item: ProgrammePlanItemForm) {
    if (!item.id) {
      setForm((current) => ({
        ...current,
        items: current.items.filter((candidate) => candidate.clientId !== item.clientId),
      }));
      return;
    }
    if (deleteItemId !== item.id) {
      setDeleteItemId(item.id);
      return;
    }
    setError(null);
    try {
      await deleteItem({ variables: { itemId: item.id } });
      setDeleteItemId(null);
      setForm((current) => ({
        ...current,
        items: current.items.filter((candidate) => candidate.clientId !== item.clientId),
      }));
      await plansQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!valid) {
      setError("Add a title and check day or duration values before saving.");
      return;
    }
    try {
      const itemsToSave = form.items.filter((item) => item.title.trim());
      const savedItemIds = new Map<string, string>();
      if (activePlan) {
        await updatePlan({
          variables: {
            carePlanProgrammeId: activePlan.id,
            data: planPayload(form, normalizedPlanType, false),
          },
        });
        for (const [index, item] of itemsToSave.entries()) {
          const data = itemPayload(item, normalizedPlanType, index);
          if (item.id) {
            const response = await updateItem({ variables: { itemId: item.id, data } });
            savedItemIds.set(item.clientId, response.data?.updateCarePlanProgrammeItem?.item?.id ?? item.id);
          } else {
            const response = await createItem({ variables: { carePlanProgrammeId: activePlan.id, data } });
            const savedId = response.data?.createCarePlanProgrammeItem?.item?.id;
            if (!savedId) throw new Error(`Could not save ${isMeal ? "meal" : isExercise ? "activity" : "step"} ${index + 1}.`);
            savedItemIds.set(item.clientId, savedId);
            setForm((current) => ({ ...current, items: current.items.map((currentItem) => currentItem.clientId === item.clientId ? { ...currentItem, id: savedId } : currentItem) }));
          }
        }
      } else {
        const response = await createPlan({
          variables: {
            programmeId,
            data: planPayload(form, normalizedPlanType, true),
          },
        });
        const savedPlan: CarePlanProgramme | null = response.data?.createCarePlanProgramme?.carePlanProgramme ?? null;
        if (!savedPlan) throw new Error("The plan was not returned after saving. Refresh the page before trying again.");
        savedPlan.items.forEach((savedItem: CarePlanProgramme["items"][number]) => {
          const formItem = itemsToSave[savedItem.sortOrder];
          if (formItem) savedItemIds.set(formItem.clientId, savedItem.id);
        });
        // If a later meal-alternative request fails, continue editing this saved plan rather than creating a duplicate.
        setEditingPlan(savedPlan);
        setCreating(false);
        setForm((current) => ({ ...current, items: current.items.map((item) => ({ ...item, id: savedItemIds.get(item.clientId) ?? item.id })) }));
      }

      if (isMeal) {
        for (const item of itemsToSave) {
          const itemId = savedItemIds.get(item.clientId) ?? item.id;
          if (!itemId) continue;
          const keptAlternativeIds = new Set<string>();
          for (const [index, alternative] of item.alternatives.entries()) {
            if (!alternative.title.trim()) continue;
            const data = mealAlternativePayload(alternative, index);
            if (alternative.id) {
              await updateAlternative({ variables: { alternativeId: alternative.id, data } });
              keptAlternativeIds.add(alternative.id);
            } else {
              const response = await createAlternative({ variables: { itemId, data } });
              const savedId = response.data?.createMealAlternative?.mealAlternative?.id;
              if (!savedId) throw new Error(`Could not save alternative ${index + 1} for ${item.title}.`);
              keptAlternativeIds.add(savedId);
              setForm((current) => ({
                ...current,
                items: current.items.map((currentItem) => currentItem.clientId === item.clientId
                  ? { ...currentItem, alternatives: currentItem.alternatives.map((currentAlternative) => currentAlternative.clientId === alternative.clientId ? { ...currentAlternative, id: savedId } : currentAlternative) }
                  : currentItem),
              }));
            }
          }
          const originalItem = activePlan?.items.find((candidate) => candidate.id === item.id);
          for (const oldAlternative of originalItem?.mealAlternatives ?? []) {
            if (!keptAlternativeIds.has(oldAlternative.id)) {
              await deleteAlternative({ variables: { alternativeId: oldAlternative.id } });
            }
          }
        }
      }
      closeEditor();
      await plansQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function confirmDeletePlan(planId: string) {
    setError(null);
    try {
      await deletePlan({ variables: { carePlanProgrammeId: planId } });
      setDeletePlanId(null);
      if (editingPlan?.id === planId) closeEditor();
      await plansQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={Icon} count={plans.length}>
          {planTitleForType(normalizedPlanType)}
        </PanelTitle>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={!canManage} onClick={startCreate}>
            <Plus className="size-4" />
            New plan
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Refresh plans"
            aria-label="Refresh plans"
            onClick={() => void plansQuery.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </PanelHeader>
      <PanelBody className="space-y-4">
        {error && !creating && !editingPlan && !deletePlanId ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
        {!canManage ? (
          <p className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-muted">
            Programme administrator access is required to manage shared plans.
          </p>
        ) : null}
        {creating || editingPlan ? (
          <DetailModal
            title={activePlan
              ? `Edit ${isMeal ? "meal plan" : isExercise ? "exercise plan" : "care plan"}`
              : `New ${isMeal ? "meal plan" : isExercise ? "exercise plan" : "care plan"}`}
            subtitle={planTitleForType(normalizedPlanType)}
            onClose={closeEditor}
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={saving}
                  onClick={closeEditor}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={`${normalizedPlanType}-plan-editor`}
                  size="sm"
                  disabled={!canManage || saving || !valid}
                >
                  <Save className="size-4" />
                  {saving ? "Saving..." : activePlan ? "Save changes" : "Create plan"}
                </Button>
              </div>
            }
          >
            <form
              id={`${normalizedPlanType}-plan-editor`}
              onSubmit={(event) => void handleSave(event)}
              className="space-y-4"
            >
              {error ? (
                <p role="alert" className="text-sm text-danger">
                  {error}
                </p>
              ) : null}
              {activePlan ? (
                <p className="text-xs text-warning">
                  Changes apply to all patients enrolled in this programme.
                </p>
              ) : (
                <div className="rounded-lg border border-border bg-background px-3 py-2">
                  <p className="text-sm text-text">
                    {isMeal
                      ? "Create a meal plan that patients on this programme will follow. Add individual meals as items."
                      : isExercise
                        ? "Create an exercise plan that patients on this programme will follow. Add individual activities as items."
                        : "Create a care plan with clinical steps or actions for patients on this programme."}
                  </p>
                </div>
              )}
              <div
                className="flex gap-2 border-b border-border pb-3"
                role="group"
                aria-label="Plan editor section"
              >
                <Button
                  type="button"
                  size="sm"
                  variant={editorTab === "details" ? "primary" : "secondary"}
                  aria-pressed={editorTab === "details"}
                  onClick={() => setEditorTab("details")}
                >
                  Plan details
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={editorTab === "items" ? "primary" : "secondary"}
                  aria-pressed={editorTab === "items"}
                  onClick={() => setEditorTab("items")}
                >
                  {isMeal ? "Meals" : isExercise ? "Activities" : "Steps"} ({form.items.filter((item) => item.title.trim()).length})
                </Button>
              </div>
              {!valid ? (
                <p role="status" className="text-xs text-muted">
                  {!form.title.trim()
                    ? "Enter a plan name before saving."
                    : "Check the month, schedule day, duration and nutrition values. Use whole numbers within the shown ranges."}
                </p>
              ) : null}
              <fieldset disabled={saving} className="min-w-0">
                {editorTab === "details" ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`${normalizedPlanType}-title`}>Plan name</Label>
                      <Input
                        id={`${normalizedPlanType}-title`}
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, title: event.target.value }))
                        }
                        placeholder={
                          isMeal
                            ? "e.g. Week 1 balanced diet plan"
                            : isExercise
                              ? "e.g. Daily walking routine"
                              : "e.g. Initial assessment and monitoring"
                        }
                      />
                      <p className="text-xs text-muted">
                        {isMeal
                          ? "A short name for this meal plan. Patients see this on their dashboard."
                          : isExercise
                            ? "A short name for this exercise plan. Patients see this on their dashboard."
                            : "A short name for this care plan. Patients see this on their dashboard."}
                      </p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`${normalizedPlanType}-description`}>Description</Label>
                      <Textarea
                        id={`${normalizedPlanType}-description`}
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, description: event.target.value }))
                        }
                        placeholder={
                          isMeal
                            ? "e.g. A low-glycaemic meal plan to stabilise blood sugar during the first week"
                            : isExercise
                              ? "e.g. Light daily activity to build a consistent routine"
                              : "e.g. Outlines the clinical steps for the first month of the programme"
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-phase`}>Phase label <span className="font-normal text-muted">(optional)</span></Label>
                      <Input id={`${normalizedPlanType}-phase`} value={form.phaseLabel} onChange={(event) => setForm((current) => ({ ...current, phaseLabel: event.target.value }))} placeholder="e.g. Getting started" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-month`}>Programme month <span className="font-normal text-muted">(optional)</span></Label>
                      <Input id={`${normalizedPlanType}-month`} type="number" min={1} step={1} value={form.monthNumber} onChange={(event) => setForm((current) => ({ ...current, monthNumber: event.target.value }))} placeholder="e.g. 1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-cadence`}>Schedule cadence</Label>
                      <Select id={`${normalizedPlanType}-cadence`} value={form.scheduleCadence} options={scheduleCadenceOptions} onChange={(event) => setForm((current) => ({ ...current, scheduleCadence: event.target.value as ProgrammePlanForm["scheduleCadence"] }))} />
                      <p className="text-xs text-muted">Controls how item schedule days repeat.</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-sort`}>Display order</Label>
                      <Input id={`${normalizedPlanType}-sort`} type="number" min={0} step={1} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-starts`}>
                        Start day <span className="font-normal text-muted">(optional)</span>
                      </Label>
                      <Input
                        id={`${normalizedPlanType}-starts`}
                        type="number"
                        min={1}
                        value={form.startsOnDay}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, startsOnDay: event.target.value }))
                        }
                        placeholder="e.g. 1"
                      />
                      <p className="text-xs text-muted">
                        Which programme day this plan begins on.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-ends`}>
                        End day <span className="font-normal text-muted">(optional)</span>
                      </Label>
                      <Input
                        id={`${normalizedPlanType}-ends`}
                        type="number"
                        min={1}
                        value={form.endsOnDay}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, endsOnDay: event.target.value }))
                        }
                        placeholder="e.g. 7"
                      />
                      <p className="text-xs text-muted">
                        Which programme day this plan ends on. Leave blank for ongoing plans.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`${normalizedPlanType}-duration`}>
                        Duration (days) <span className="font-normal text-muted">(optional)</span>
                      </Label>
                      <Input
                        id={`${normalizedPlanType}-duration`}
                        type="number"
                        min={1}
                        value={form.durationDays}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, durationDays: event.target.value }))
                        }
                        placeholder="e.g. 7"
                      />
                      <p className="text-xs text-muted">
                        How many days this plan runs for. Use this or start/end days, not both.
                      </p>
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor={`${normalizedPlanType}-instructions`}>
                        Instructions for the patient <span className="font-normal text-muted">(optional)</span>
                      </Label>
                      <Textarea
                        id={`${normalizedPlanType}-instructions`}
                        value={form.instructions}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, instructions: event.target.value }))
                        }
                        placeholder={
                          isMeal
                            ? "e.g. Drink at least 2 litres of water daily. Avoid sugary drinks between meals."
                            : isExercise
                              ? "e.g. Warm up for 5 minutes before each session. Stop if you feel dizzy."
                              : "e.g. Complete each step in order. Contact your care team if anything is unclear."
                        }
                      />
                      <p className="text-xs text-muted">
                        General guidance shown to the patient alongside this plan.
                      </p>
                    </div>
                  </div>
                ) : null}
                {editorTab === "items" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-text">
                          {isMeal ? "Meals" : isExercise ? "Activities" : "Steps"}
                        </p>
                        <p className="text-xs text-muted">
                          {isMeal
                            ? "Add individual meals the patient should eat as part of this plan."
                            : isExercise
                              ? "Add individual exercises or activities the patient should do."
                              : "Add individual steps or actions the patient should follow."}
                        </p>
                      </div>
                      <Button type="button" size="sm" variant="secondary" onClick={addItem}>
                        <Plus className="size-4" />
                        {isMeal ? "Add meal" : isExercise ? "Add activity" : "Add step"}
                      </Button>
                    </div>
                    <Select
                      aria-label={`Select ${isMeal ? "meal" : isExercise ? "activity" : "step"}`}
                      value={selectedItem?.clientId ?? ""}
                      options={form.items.map((item, index) => ({
                        value: item.clientId,
                        label: item.title.trim() || `${isMeal ? "Meal" : isExercise ? "Activity" : "Step"} ${index + 1}`,
                      }))}
                      onChange={(event) => setSelectedItemId(event.target.value)}
                    />
                    {form.items
                      .filter((item) => item.clientId === selectedItem?.clientId)
                      .map((item) => (
                        <div key={item.clientId} className="space-y-3 border-t border-border pt-3">
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor={`${item.clientId}-title`}>
                                {isExercise ? "Activity name" : isMeal ? "Meal name" : "Step title"}
                              </Label>
                              <Input
                                id={`${item.clientId}-title`}
                                value={item.title}
                                onChange={(event) =>
                                  updateItemForm(item.clientId, { title: event.target.value })
                                }
                                placeholder={
                                  isMeal
                                    ? "e.g. Oatmeal with fruit"
                                    : isExercise
                                      ? "e.g. Morning walk"
                                      : "e.g. Take fasting blood glucose reading"
                                }
                              />
                            </div>
                            {isMeal ? (
                              <div className="space-y-1.5">
                                <Label htmlFor={`${item.clientId}-meal-type`}>Meal type</Label>
                                <Select
                                  id={`${item.clientId}-meal-type`}
                                  value={item.mealType}
                                  options={mealTypeOptions}
                                  onChange={(event) =>
                                    updateItemForm(item.clientId, { mealType: event.target.value })
                                  }
                                />
                                <p className="text-xs text-muted">Which meal of the day this is for.</p>
                              </div>
                            ) : null}
                            {isExercise ? (
                              <>
                                <div className="space-y-1.5">
                                  <Label htmlFor={`${item.clientId}-duration`}>
                                    Duration (minutes)
                                  </Label>
                                  <Input
                                    id={`${item.clientId}-duration`}
                                    type="number"
                                    min={1}
                                    value={item.durationMinutes}
                                    onChange={(event) =>
                                      updateItemForm(item.clientId, {
                                        durationMinutes: event.target.value,
                                      })
                                    }
                                    placeholder="e.g. 30"
                                  />
                                  <p className="text-xs text-muted">How long the activity should last.</p>
                                </div>
                                <div className="space-y-1.5">
                                  <Label htmlFor={`${item.clientId}-intensity`}>Intensity</Label>
                                  <Select
                                    id={`${item.clientId}-intensity`}
                                    value={item.intensity}
                                    options={exerciseIntensityOptions}
                                    onChange={(event) =>
                                      updateItemForm(item.clientId, {
                                        intensity: event.target.value,
                                      })
                                    }
                                  />
                                  <p className="text-xs text-muted">How strenuous the activity is.</p>
                                </div>
                              </>
                            ) : null}
                            <div className="space-y-1.5">
                              <Label htmlFor={`${item.clientId}-day`}>
                                Schedule day <span className="font-normal text-muted">(optional)</span>
                              </Label>
                              <Input
                                id={`${item.clientId}-day`}
                                type="number"
                                min={1}
                                value={item.dayNumber}
                                onChange={(event) =>
                                  updateItemForm(item.clientId, { dayNumber: event.target.value })
                                }
                                max={scheduleDayMaximum}
                                step={1}
                                placeholder={form.scheduleCadence === "weekly" ? "1 = Monday" : "1-30"}
                              />
                              <p className="text-xs text-muted">
                                {form.scheduleCadence === "weekly"
                                  ? "Day of week: 1 = Monday through 7 = Sunday. Leave blank for every day."
                                  : "Day of month: 1-30. Leave blank for every day of the month."}
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor={`${item.clientId}-time`}>
                                Time of day <span className="font-normal text-muted">(optional)</span>
                              </Label>
                              <Input
                                id={`${item.clientId}-time`}
                                type="time"
                                value={item.timeOfDay}
                                onChange={(event) =>
                                  updateItemForm(item.clientId, { timeOfDay: event.target.value })
                                }
                              />
                              <p className="text-xs text-muted">
                                {isMeal
                                  ? "Suggested time for this meal."
                                  : isExercise
                                    ? "Suggested time for this activity."
                                    : "Suggested time for this step."}
                              </p>
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor={`${item.clientId}-instructions`}>
                                {isMeal ? "Preparation or dietary notes" : isExercise ? "How to do this activity" : "Instructions"}
                                {" "}<span className="font-normal text-muted">(optional)</span>
                              </Label>
                              <Textarea
                                id={`${item.clientId}-instructions`}
                                value={item.instructions}
                                onChange={(event) =>
                                  updateItemForm(item.clientId, {
                                    instructions: event.target.value,
                                  })
                                }
                                placeholder={
                                  isMeal
                                    ? "e.g. Use whole oats, not instant. Add berries for fibre."
                                    : isExercise
                                      ? "e.g. Walk at a brisk pace. Use flat terrain if available."
                                      : "e.g. Record the reading in the app before breakfast."
                                }
                              />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                              <Label htmlFor={`${item.clientId}-content-type`}>Patient content</Label>
                              <Select
                                id={`${item.clientId}-content-type`}
                                value={item.contentType}
                                options={planContentTypeOptions}
                                onChange={(event) => updateItemForm(item.clientId, { contentType: event.target.value as ProgrammePlanItemForm["contentType"] })}
                              />
                            </div>
                            {item.contentType === "video" || item.contentType === "both" ? (
                              <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor={`${item.clientId}-video-url`}>Video URL</Label>
                                <Input id={`${item.clientId}-video-url`} type="url" value={item.videoUrl} onChange={(event) => updateItemForm(item.clientId, { videoUrl: event.target.value })} placeholder="https://" />
                              </div>
                            ) : null}
                            {item.contentType === "text" || item.contentType === "both" ? (
                              <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor={`${item.clientId}-body-text`}>Patient-facing content</Label>
                                <Textarea id={`${item.clientId}-body-text`} value={item.bodyText} onChange={(event) => updateItemForm(item.clientId, { bodyText: event.target.value })} placeholder="Write the approved education or instructions shown to the patient." />
                              </div>
                            ) : null}
                          </div>
                          {isMeal ? (
                            <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-text">Meal alternatives</p>
                                  <p className="text-xs text-muted">Optional substitutes with nutritional values.</p>
                                </div>
                                <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => updateItemForm(item.clientId, { alternatives: [...item.alternatives, emptyMealAlternative(item.alternatives.length)] })}>
                                  <Plus className="size-4" /> Add alternative
                                </Button>
                              </div>
                              {item.alternatives.map((alternative, alternativeIndex) => (
                                <div key={alternative.clientId} className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                                  <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor={`${alternative.clientId}-title`}>Alternative name</Label>
                                    <Input id={`${alternative.clientId}-title`} value={alternative.title} onChange={(event) => updateItemForm(item.clientId, { alternatives: item.alternatives.map((candidate) => candidate.clientId === alternative.clientId ? { ...candidate, title: event.target.value } : candidate) })} placeholder="e.g. Unsweetened yoghurt with nuts" />
                                  </div>
                                  <div className="space-y-1.5 md:col-span-2">
                                    <Label htmlFor={`${alternative.clientId}-description`}>Description</Label>
                                    <Textarea id={`${alternative.clientId}-description`} value={alternative.description} onChange={(event) => updateItemForm(item.clientId, { alternatives: item.alternatives.map((candidate) => candidate.clientId === alternative.clientId ? { ...candidate, description: event.target.value } : candidate) })} />
                                  </div>
                                  {(["kcal", "carbsG", "proteinG", "fatG"] as const).map((field) => (
                                    <div key={field} className="space-y-1.5">
                                      <Label htmlFor={`${alternative.clientId}-${field}`}>{field === "kcal" ? "Energy (kcal)" : field === "carbsG" ? "Carbohydrate (g)" : field === "proteinG" ? "Protein (g)" : "Fat (g)"}</Label>
                                      <Input id={`${alternative.clientId}-${field}`} type="number" min={1} step={1} value={alternative[field]} onChange={(event) => updateItemForm(item.clientId, { alternatives: item.alternatives.map((candidate) => candidate.clientId === alternative.clientId ? { ...candidate, [field]: event.target.value } : candidate) })} />
                                    </div>
                                  ))}
                                  <div className="flex justify-end md:col-span-2">
                                    <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => updateItemForm(item.clientId, { alternatives: item.alternatives.filter((candidate) => candidate.clientId !== alternative.clientId) })}>
                                      <Trash2 className="size-4" /> Remove alternative {alternativeIndex + 1}
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : null}
                          <div className="flex justify-between gap-2">
                            <p className="text-xs text-muted">
                              {isMeal ? "Meal" : isExercise ? "Activity" : "Step"}{" "}
                              {form.items.findIndex(
                                (candidate) => candidate.clientId === item.clientId,
                              ) + 1}{" "}
                              of {form.items.length}
                            </p>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => void removeItem(item)}
                            >
                              <Trash2 className="size-4" />
                              {deleteItemId === item.id ? "Confirm delete" : "Delete"}
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </fieldset>
            </form>
          </DetailModal>
        ) : null}
        {plansQuery.error ? (
          <PanelEmpty>Unable to load plans. Please refresh.</PanelEmpty>
        ) : plans.length === 0 ? (
          <PanelEmpty className="rounded-lg border border-dashed border-border">
            {plansQuery.loading
              ? "Loading plans..."
              : `No ${planTitleForType(normalizedPlanType).toLowerCase()} configured yet.`}
          </PanelEmpty>
        ) : (
          <div className="divide-y divide-border">
            {plans.map((plan) => (
              <div key={plan.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-text">{plan.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {plan.phaseLabel ? `${plan.phaseLabel} | ` : ""}
                    {plan.monthNumber ? `Month ${plan.monthNumber} | ` : ""}
                    {titleCase(plan.scheduleCadence)} schedule |{" "}
                    {plan.startsOnDay ? `Day ${plan.startsOnDay}` : "No start day"}
                    {plan.endsOnDay ? ` - ${plan.endsOnDay}` : ""}
                    {plan.durationDays ? ` | ${plan.durationDays} days` : ""}
                    {` | ${plan.items.length} item(s)`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="View plan"
                    aria-label={`View ${plan.title}`}
                    onClick={() => setViewingPlan(plan)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="Edit plan"
                    aria-label={`Edit ${plan.title}`}
                    disabled={!canManage || saving}
                    onClick={() => startEdit(plan)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="Delete plan"
                    aria-label={`Delete ${plan.title}`}
                    disabled={!canManage || saving}
                    onClick={() => {
                      setError(null);
                      setDeletePlanId(plan.id);
                    }}
                  >
                    <Trash2 className="size-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelBody>
      {viewingPlan ? (
        <DetailModal
          title={viewingPlan.title}
          subtitle={planTitleForType(normalizedPlanType)}
          onClose={() => setViewingPlan(null)}
          footer={
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setViewingPlan(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-muted">
              {viewingPlan.phaseLabel ? `${viewingPlan.phaseLabel} | ` : ""}
              {viewingPlan.monthNumber ? `Month ${viewingPlan.monthNumber} | ` : ""}
              {titleCase(viewingPlan.scheduleCadence)} schedule
            </p>
            {viewingPlan.description ? (
              <p className="whitespace-pre-wrap break-words text-sm text-muted">
                {viewingPlan.description}
              </p>
            ) : null}
            {viewingPlan.instructions ? (
              <p className="whitespace-pre-wrap break-words text-sm text-text">
                {viewingPlan.instructions}
              </p>
            ) : null}
            <ul className="divide-y divide-border">
              {viewingPlan.items.map((item) => (
                <li key={item.id} className="py-3">
                  <p className="break-words text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.dayNumber ? `Day ${item.dayNumber}` : "Any day"}
                    {item.timeOfDay ? ` | ${item.timeOfDay}` : ""}
                    {item.mealType ? ` | ${titleCase(item.mealType)}` : ""}
                    {item.exerciseType ? ` | ${titleCase(item.exerciseType)}` : ""}
                    {item.durationMinutes ? ` | ${item.durationMinutes} min` : ""}
                    {item.intensity ? ` | ${titleCase(item.intensity)}` : ""}
                  </p>
                  {item.instructions ? (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-muted">
                      {item.instructions}
                    </p>
                  ) : null}
                  {item.bodyText ? <p className="mt-2 whitespace-pre-wrap break-words text-sm text-text">{item.bodyText}</p> : null}
                  {item.videoUrl ? <a className="mt-2 inline-block break-all text-sm text-primary underline" href={item.videoUrl} target="_blank" rel="noreferrer">Open video resource</a> : null}
                  {item.mealAlternatives?.length ? (
                    <div className="mt-3 space-y-2 rounded-md bg-background p-3">
                      <p className="text-xs font-semibold text-text">Meal alternatives</p>
                      {item.mealAlternatives.map((alternative) => (
                        <div key={alternative.id} className="text-xs text-muted">
                          <p className="font-medium text-text">{alternative.title}</p>
                          {alternative.description ? <p>{alternative.description}</p> : null}
                          <p>{[
                            alternative.kcal ? `${alternative.kcal} kcal` : null,
                            alternative.carbsG ? `${alternative.carbsG} g carbohydrate` : null,
                            alternative.proteinG ? `${alternative.proteinG} g protein` : null,
                            alternative.fatG ? `${alternative.fatG} g fat` : null,
                          ].filter(Boolean).join(" | ")}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </DetailModal>
      ) : null}
      {deletePlanId ? (
        <DetailModal
          title="Delete plan"
          subtitle={plans.find((plan) => plan.id === deletePlanId)?.title}
          onClose={() => {
            if (!saving) setDeletePlanId(null);
          }}
          className="sm:max-w-lg"
        >
          {error ? (
            <p role="alert" className="mb-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
          <p className="text-sm text-muted">
            This plan and all its items will be removed for every patient in the programme.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={saving}
              onClick={() => setDeletePlanId(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saving}
              onClick={() => void confirmDeletePlan(deletePlanId)}
            >
              <Trash2 className="size-4" />
              {saving ? "Deleting..." : "Delete plan"}
            </Button>
          </div>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

type CohortForm = {
  label: string;
  startsAt: string;
  durationMonths: string;
  endsAt: string;
  maxCapacity: string;
  enrolmentOpensAt: string;
  enrolmentClosesAt: string;
};

const emptyCohortForm: CohortForm = {
  label: "",
  startsAt: "",
  durationMonths: "3",
  endsAt: "",
  maxCapacity: "",
  enrolmentOpensAt: "",
  enrolmentClosesAt: "",
};

function cohortFormFromData(cohort: ProgrammeCohort): CohortForm {
  return {
    label: cohort.label,
    startsAt: cohort.startsAt ?? "",
    durationMonths: String(cohort.durationMonths ?? 3),
    endsAt: cohort.endsAt ?? "",
    maxCapacity: cohort.maxCapacity != null ? String(cohort.maxCapacity) : "",
    enrolmentOpensAt: cohort.enrolmentOpensAt ? cohort.enrolmentOpensAt.slice(0, 16) : "",
    enrolmentClosesAt: cohort.enrolmentClosesAt ? cohort.enrolmentClosesAt.slice(0, 16) : "",
  };
}

function cohortStatusActions(status: string) {
  const s = status.toUpperCase();
  if (s === "DRAFT") return [{ action: "open" as const, label: "Open for enrolment" }];
  if (s === "OPEN") return [{ action: "activate" as const, label: "Activate cohort" }];
  if (s === "ACTIVE") return [{ action: "complete" as const, label: "Complete cohort" }];
  return [];
}

function ProgrammeCohortsPanel({ programmeId, canManage }: { programmeId: string; canManage: boolean }) {
  const [editing, setEditing] = useState<ProgrammeCohort | "new" | null>(null);
  const [form, setForm] = useState<CohortForm>(emptyCohortForm);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");

  const cohortsQuery = useQuery<{ programmeCohorts: ProgrammeCohort[] }>(PROGRAMME_COHORTS_QUERY, {
    variables: { programmeId },
    fetchPolicy: "cache-and-network",
  });
  const cohorts = cohortsQuery.data?.programmeCohorts ?? [];

  const [createCohort, createState] = useMutation(CREATE_PROGRAMME_COHORT_MUTATION);
  const [updateCohort, updateState] = useMutation(UPDATE_PROGRAMME_COHORT_MUTATION);
  const [openCohort, openState] = useMutation(OPEN_PROGRAMME_COHORT_MUTATION);
  const [activateCohort, activateState] = useMutation(ACTIVATE_PROGRAMME_COHORT_MUTATION);
  const [completeCohort, completeState] = useMutation(COMPLETE_PROGRAMME_COHORT_MUTATION);
  const [cancelCohort, cancelState] = useMutation(CANCEL_PROGRAMME_COHORT_MUTATION);

  const saving =
    createState.loading || updateState.loading || openState.loading ||
    activateState.loading || completeState.loading || cancelState.loading;

  function openCreate() {
    setForm(emptyCohortForm);
    setError(null);
    setEditing("new");
  }

  function openEdit(cohort: ProgrammeCohort) {
    setForm(cohortFormFromData(cohort));
    setError(null);
    setEditing(cohort);
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    setError(null);
    const data: Record<string, unknown> = {
      label: form.label.trim(),
      startsAt: form.startsAt || undefined,
      durationMonths: form.durationMonths ? parseInt(form.durationMonths, 10) : undefined,
      endsAt: form.endsAt || undefined,
      maxCapacity: form.maxCapacity ? parseInt(form.maxCapacity, 10) : undefined,
      enrolmentOpensAt: form.enrolmentOpensAt || undefined,
      enrolmentClosesAt: form.enrolmentClosesAt || undefined,
    };
    try {
      if (editing === "new") {
        await createCohort({ variables: { programmeId, data } });
      } else if (editing) {
        await updateCohort({ variables: { cohortId: editing.id, data } });
      }
      await cohortsQuery.refetch();
      setEditing(null);
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleLifecycle(cohortId: string, action: string) {
    if (saving) return;
    setError(null);
    try {
      if (action === "open") await openCohort({ variables: { cohortId } });
      else if (action === "activate") await activateCohort({ variables: { cohortId } });
      else if (action === "complete") await completeCohort({ variables: { cohortId } });
      await cohortsQuery.refetch();
    } catch (err) {
      setError(mapError(err));
    }
  }

  async function handleCancel() {
    if (!cancellingId || saving) return;
    setError(null);
    try {
      await cancelCohort({ variables: { cohortId: cancellingId, reason: cancelReason.trim() || undefined } });
      await cohortsQuery.refetch();
      setCancellingId(null);
      setCancelReason("");
    } catch (err) {
      setError(mapError(err));
    }
  }

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle icon={CalendarRange} count={cohorts.length}>Cohorts</PanelTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            title="Refresh cohorts"
            aria-label="Refresh cohorts"
            disabled={cohortsQuery.loading}
            onClick={() => void cohortsQuery.refetch()}
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button type="button" size="sm" disabled={!canManage} onClick={openCreate}>
            <Plus className="size-4" />
            New cohort
          </Button>
        </div>
      </PanelHeader>
      <PanelBody>
        {error && !editing && !cancellingId ? (
          <p role="alert" className="mb-3 text-sm text-danger">{error}</p>
        ) : null}
        {cohortsQuery.error ? (
          <PanelEmpty>Unable to load cohorts. Please refresh.</PanelEmpty>
        ) : cohorts.length === 0 ? (
          <PanelEmpty className="rounded-lg border border-dashed border-border">
            {cohortsQuery.loading
              ? "Loading cohorts..."
              : "No cohorts created yet. Create a cohort to group patients by intake period."}
          </PanelEmpty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-background text-xs text-muted">
                <tr>
                  {["Label", "Status", "Dates", "Capacity", "Enrolled", ""].map((h) => (
                    <th key={h} className="px-4 py-3 font-medium" scope="col">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cohorts.map((cohort) => {
                  const actions = cohortStatusActions(cohort.status);
                  return (
                    <tr key={cohort.id}>
                      <td className="max-w-48 break-words px-4 py-3 font-medium">{cohort.label}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant(cohort.status)}>{titleCase(cohort.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDateRange(cohort.startsAt, cohort.endsAt)}
                        {cohort.durationMonths ? ` (${cohort.durationMonths}mo)` : ""}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {cohort.maxCapacity != null ? cohort.maxCapacity : "Unlimited"}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {cohort.enrolledCount ?? 0}
                        {cohort.spotsRemaining != null ? ` / ${cohort.maxCapacity}` : ""}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {actions.map((a) => (
                            <Button
                              key={a.action}
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!canManage || saving}
                              onClick={() => void handleLifecycle(cohort.id, a.action)}
                            >
                              {a.label}
                            </Button>
                          ))}
                          {cohort.status.toUpperCase() === "DRAFT" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Edit cohort"
                              disabled={!canManage || saving}
                              onClick={() => openEdit(cohort)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          ) : null}
                          {!["COMPLETED", "CANCELLED"].includes(cohort.status.toUpperCase()) ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              title="Cancel cohort"
                              disabled={!canManage || saving}
                              onClick={() => {
                                setError(null);
                                setCancelReason("");
                                setCancellingId(cohort.id);
                              }}
                            >
                              <X className="size-4 text-danger" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PanelBody>

      {editing ? (
        <DetailModal
          title={editing === "new" ? "Create cohort" : `Edit cohort: ${editing.label}`}
          onClose={() => { if (!saving) setEditing(null); }}
          className="sm:max-w-xl"
        >
          <form onSubmit={(event) => void handleSave(event)} className="space-y-4">
            {error ? (
              <p role="alert" className="text-sm text-danger">{error}</p>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="cohort-label">Cohort label</Label>
              <Input
                id="cohort-label"
                value={form.label}
                disabled={saving}
                onChange={(e) => setForm((c) => ({ ...c, label: e.target.value }))}
                placeholder="e.g. January 2027 intake"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cohort-starts-at">Start date</Label>
                <Input
                  id="cohort-starts-at"
                  type="date"
                  value={form.startsAt}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, startsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cohort-duration">Duration (months)</Label>
                <Input
                  id="cohort-duration"
                  type="number"
                  min={1}
                  value={form.durationMonths}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, durationMonths: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cohort-ends-at">End date <span className="font-normal text-muted">(auto-calculated if blank)</span></Label>
                <Input
                  id="cohort-ends-at"
                  type="date"
                  value={form.endsAt}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, endsAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cohort-capacity">Max capacity <span className="font-normal text-muted">(optional)</span></Label>
                <Input
                  id="cohort-capacity"
                  type="number"
                  min={1}
                  value={form.maxCapacity}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, maxCapacity: e.target.value }))}
                  placeholder="Unlimited"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cohort-enrolment-opens">Enrolment opens <span className="font-normal text-muted">(optional)</span></Label>
                <Input
                  id="cohort-enrolment-opens"
                  type="datetime-local"
                  value={form.enrolmentOpensAt}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, enrolmentOpensAt: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cohort-enrolment-closes">Enrolment closes <span className="font-normal text-muted">(optional)</span></Label>
                <Input
                  id="cohort-enrolment-closes"
                  type="datetime-local"
                  value={form.enrolmentClosesAt}
                  disabled={saving}
                  onChange={(e) => setForm((c) => ({ ...c, enrolmentClosesAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={saving || !form.label.trim() || !form.startsAt || !form.durationMonths}>
                <Save className="size-4" />
                {saving ? "Saving..." : editing === "new" ? "Create cohort" : "Save changes"}
              </Button>
            </div>
          </form>
        </DetailModal>
      ) : null}

      {cancellingId ? (
        <DetailModal
          title="Cancel cohort"
          subtitle={cohorts.find((c) => c.id === cancellingId)?.label}
          onClose={() => { if (!saving) setCancellingId(null); }}
          className="sm:max-w-lg"
        >
          {error ? (
            <p role="alert" className="mb-3 text-sm text-danger">{error}</p>
          ) : null}
          <p className="text-sm text-muted">
            Cancelling a cohort stops new enrolments. Existing enrolments are not affected.
          </p>
          <div className="mt-3 space-y-1.5">
            <Label htmlFor="cohort-cancel-reason">Reason (optional)</Label>
            <Textarea
              id="cohort-cancel-reason"
              value={cancelReason}
              disabled={saving}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" size="sm" variant="secondary" disabled={saving} onClick={() => setCancellingId(null)}>
              Keep cohort
            </Button>
            <Button type="button" size="sm" disabled={saving} onClick={() => void handleCancel()}>
              <X className="size-4" />
              {saving ? "Cancelling..." : "Cancel cohort"}
            </Button>
          </div>
        </DetailModal>
      ) : null}
    </Panel>
  );
}

function ProgrammeDetailsView({ programmeId }: { programmeId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const canManageProgrammes = hasProgrammePermission(user, "programme.manage");
  const canEnrolPatients = hasProgrammePermission(user, "programme.enrol");
  const [activeTab, setActiveTab] = useUrlState("tab", "overview", programmePlanTabs.map((tab) => tab.key));
  const [enrolmentModalOpen, setEnrolmentModalOpen] = useState(false);
  const [selectedEnrolmentId, setSelectedEnrolmentId] = useState<string | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [journeyView, setJourneyView] = useUrlState("journeyTab", "milestones", ["milestones", "schedule"]);
  const [lifecycleAction, setLifecycleAction] = useState<
    "activate" | "pause" | "resume" | "archive" | "delete" | null
  >(null);
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
    skip: activeTab !== "journey",
  });
  const programme = programmeQuery.data?.careProgramme ?? null;
  const enrolments = enrolmentsQuery.data?.clinicProgrammeEnrolments ?? [];
  const selectedEnrolment =
    enrolments.find((enrolment) => enrolment.id === selectedEnrolmentId) ?? null;
  const filteredEnrolments = enrolments.filter((enrolment) =>
    [
      enrolment.patient.fullName,
      enrolment.patient.email,
      enrolment.patient.id,
      enrolment.leadProvider?.displayName,
    ].some((value) => value?.toLowerCase().includes(patientSearch.trim().toLowerCase())),
  );
  const [activateProgramme, activateState] = useMutation(ACTIVATE_CARE_PROGRAMME_MUTATION);
  const [pauseProgramme, pauseState] = useMutation(PAUSE_CARE_PROGRAMME_MUTATION);
  const [resumeProgramme, resumeState] = useMutation(RESUME_CARE_PROGRAMME_MUTATION);
  const [archiveProgramme, archiveState] = useMutation(ARCHIVE_CARE_PROGRAMME_MUTATION);
  const [deleteProgramme, deleteState] = useMutation<{
    deleteCareProgramme: { deletedId: string; ok: boolean };
  }>(DELETE_CARE_PROGRAMME_MUTATION, {
    update(cache, { data }) {
      if (!data?.deleteCareProgramme.ok) return;
      const cacheId = cache.identify({
        __typename: "CareProgrammeType",
        id: data.deleteCareProgramme.deletedId,
      });
      if (cacheId) cache.evict({ id: cacheId });
      cache.evict({ id: "ROOT_QUERY", fieldName: "clinicCareProgrammes" });
      cache.gc();
    },
  });
  const saving =
    activateState.loading ||
    pauseState.loading ||
    resumeState.loading ||
    archiveState.loading ||
    deleteState.loading;
  const canDeleteProgramme = Boolean(
    Array.isArray(enrolmentsQuery.data?.clinicProgrammeEnrolments) &&
    !enrolmentsQuery.loading &&
    !enrolmentsQuery.error &&
    enrolments.length === 0,
  );

  async function refetchAll() {
    await programmeQuery.refetch();
    await enrolmentsQuery.refetch();
    if (activeTab === "journey") await scheduleQuery.refetch();
  }

  async function confirmLifecycle(event: FormEvent) {
    event.preventDefault();
    if (!programme || !lifecycleAction || saving || !canManageProgrammes) return;
    setError(null);
    try {
      if (lifecycleAction === "delete") {
        if (!canDeleteProgramme || reason.trim() !== programme.name.trim()) return;
        const response = await deleteProgramme({ variables: { programmeId: programme.id } });
        if (!response.data?.deleteCareProgramme.ok) {
          throw new Error("Programme deletion was not confirmed. Please try again.");
        }
        router.replace("/consultant/programmes");
        return;
      }
      const variables = { programmeId: programme.id, reason: reason.trim() || undefined };
      if (lifecycleAction === "activate") await activateProgramme({ variables });
      if (lifecycleAction === "pause") await pauseProgramme({ variables });
      if (lifecycleAction === "resume") await resumeProgramme({ variables });
      if (lifecycleAction === "archive")
        await archiveProgramme({
          variables: { ...variables, reason: reason.trim() || "Archived by admin" },
        });
      await refetchAll();
      setLifecycleAction(null);
      setReason("");
    } catch (err) {
      setError(mapError(err));
    }
  }

  if (!programme && programmeQuery.loading) return <PanelEmpty>Loading programme...</PanelEmpty>;
  if (!programme) return <PanelEmpty>Programme not found.</PanelEmpty>;
  const settings = parseProgrammeSettings(programme.settingsJson);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <Button
            href="/consultant/programmes"
            size="sm"
            variant="ghost"
            title="Back to programmes"
            aria-label="Back to programmes"
            className="size-9 shrink-0 px-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-semibold text-ink">{programme.name}</h1>
              <Badge variant={statusVariant(programme.status)}>{titleCase(programme.status)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {programme.organization?.name ?? programme.code} |{" "}
              {formatDateRange(programme.startsAt, programme.endsAt)}
            </p>
          </div>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canEnrolPatients}
          onClick={() => setEnrolmentModalOpen(true)}
        >
          <UserPlus className="size-4" />
          Enrol patient
        </Button>
      </header>

      <div
        role="tablist"
        aria-label="Programme sections"
        className="flex gap-1 overflow-x-auto border-b border-border"
      >
        {programmePlanTabs.map((tab, index) => (
          <button
            key={tab.key}
            id={`programme-tab-${tab.key}`}
            role="tab"
            aria-selected={activeTab === tab.key}
            aria-controls={`programme-panel-${tab.key}`}
            tabIndex={activeTab === tab.key ? 0 : -1}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            onKeyDown={(event) => {
              let next = index;
              if (event.key === "ArrowRight") next = (index + 1) % programmePlanTabs.length;
              else if (event.key === "ArrowLeft")
                next = (index - 1 + programmePlanTabs.length) % programmePlanTabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = programmePlanTabs.length - 1;
              else return;
              event.preventDefault();
              setActiveTab(programmePlanTabs[next].key);
              (
                event.currentTarget.parentElement?.children[next] as HTMLButtonElement | undefined
              )?.focus();
            }}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-text"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`programme-panel-${activeTab}`}
        aria-labelledby={`programme-tab-${activeTab}`}
      >
        {activeTab === "overview" ? (
          <Panel>
            <PanelHeader>
              <PanelTitle icon={ClipboardList}>Programme Overview</PanelTitle>
            </PanelHeader>
            <PanelBody>
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Programme code", programme.code],
                  [
                    "Duration",
                    programme.defaultDurationDays
                      ? `${programme.defaultDurationDays} days`
                      : "Open-ended",
                  ],
                  ["Monitoring", `Every ${programme.defaultMonitoringCadenceDays} day(s)`],
                  ["Enrolment", programme.enrolmentOpen ? "Open" : "Closed"],
                  ["Patients", String(enrolments.length)],
                  [
                    "Clinically ready",
                    String(enrolments.filter((item) => item.carePlanReady).length),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs font-medium text-muted">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-text">{value}</dd>
                  </div>
                ))}
              </dl>
              <dl className="mt-6 grid gap-5 border-t border-border pt-5 md:grid-cols-2">
                {[
                  ["Description", programme.description],
                  ["Patient offer", settings.patientOffer],
                  ["Who it is for", settings.whoItIsFor],
                  ["After joining", settings.whatHappensNext],
                ]
                  .filter(([, value]) => Boolean(value))
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-muted">{label}</dt>
                      <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-text">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </PanelBody>
          </Panel>
        ) : null}

        {activeTab === "overview" ? <ProgrammeProviderOfferSettings key={`${programme.id}:${programme.updatedAt}`} programme={programme} canManage={canManageProgrammes} onSaved={() => programmeQuery.refetch()} /> : null}

        {activeTab === "general" || activeTab === "meal" || activeTab === "exercise" ? (
          <ProgrammeSharedPlansPanel
            key={activeTab}
            programmeId={programme.id}
            planType={
              activeTab === "general"
                ? "GENERAL"
                : activeTab === "meal"
                  ? "MEAL_PLAN"
                  : "EXERCISE_PLAN"
            }
            canManage={canManageProgrammes}
          />
        ) : null}

        {activeTab === "patients" ? (
          selectedEnrolment ? (
            <div className="space-y-3">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setSelectedEnrolmentId(null)}
              >
                <ArrowLeft className="size-4" />
                All patients
              </Button>
              <CareTeamAndActivation
                key={selectedEnrolment.id}
                selectedEnrolment={selectedEnrolment}
                onChanged={refetchAll}
              />
            </div>
          ) : (
            <Panel>
              <PanelHeader>
                <PanelTitle icon={Users} count={enrolments.length}>
                  Enrolled Patients
                </PanelTitle>
                <div className="flex flex-wrap gap-2">
                  {hasProgrammePermission(user, "billing.manage") ? (
                    <Button href="/consultant/billing" size="sm" variant="secondary">
                      Billing
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    title="Refresh patients"
                    aria-label="Refresh patients"
                    disabled={enrolmentsQuery.loading}
                    onClick={() => void enrolmentsQuery.refetch()}
                  >
                    <RefreshCw className="size-4" />
                  </Button>
                </div>
              </PanelHeader>
              <PanelBody className="border-b border-border">
                <div className="relative max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-3 size-4 text-muted" />
                  <Input
                    aria-label="Search patients"
                    placeholder="Search patients or lead clinician"
                    value={patientSearch}
                    onChange={(event) => setPatientSearch(event.target.value)}
                    className="pl-9"
                  />
                </div>
              </PanelBody>
              {enrolmentsQuery.error ? (
                <PanelEmpty>Unable to load patients. Please refresh.</PanelEmpty>
              ) : filteredEnrolments.length === 0 ? (
                <PanelEmpty>
                  {enrolmentsQuery.loading
                    ? "Loading patients..."
                    : patientSearch
                      ? "No matching patients."
                      : "No patients enrolled yet."}
                </PanelEmpty>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-background text-xs text-muted">
                      <tr>
                        {[
                          "Patient",
                          "Status",
                          "Lead clinician",
                          "Clinical plan",
                          "Shared plans",
                          "",
                        ].map((label) => (
                          <th key={label} className="px-4 py-3 font-medium" scope="col">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredEnrolments.map((enrolment) => (
                        <tr key={enrolment.id}>
                          <td className="max-w-60 break-words px-4 py-3 font-medium">
                            {enrolment.patient.fullName ??
                              enrolment.patient.email ??
                              enrolment.patient.id}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(enrolment.status)}>
                              {titleCase(enrolment.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted">
                            {enrolment.leadProvider?.displayName ?? "Unassigned"}
                          </td>
                          <td className="px-4 py-3">
                            {enrolment.carePlanReady ? "Ready" : "Pending"}
                          </td>
                          <td className="px-4 py-3">
                            {enrolment.hasSharedPlanAccess ? "Access active" : "Locked"}
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => setSelectedEnrolmentId(enrolment.id)}
                            >
                              <Eye className="size-4" />
                              Manage
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>
          )
        ) : null}

        {activeTab === "cohorts" ? (
          <ProgrammeCohortsPanel programmeId={programme.id} canManage={canManageProgrammes} />
        ) : null}

        {activeTab === "journey" ? (
          <div className="space-y-3">
            <div className="flex gap-1" role="group" aria-label="Care journey view">
              <Button
                type="button"
                size="sm"
                variant={journeyView === "milestones" ? "primary" : "secondary"}
                aria-pressed={journeyView === "milestones"}
                onClick={() => setJourneyView("milestones")}
              >
                Milestones
              </Button>
              <Button
                type="button"
                size="sm"
                variant={journeyView === "schedule" ? "primary" : "secondary"}
                aria-pressed={journeyView === "schedule"}
                onClick={() => setJourneyView("schedule")}
              >
                Patient schedule
              </Button>
            </div>
            {journeyView === "milestones" ? (
              <ProgrammePlanSummaryPanel programme={programme} />
            ) : scheduleQuery.error ? (
              <PanelEmpty>Unable to load the patient schedule.</PanelEmpty>
            ) : scheduleQuery.loading ? (
              <PanelEmpty>Loading schedule...</PanelEmpty>
            ) : (
              <ProgrammeSchedulePanel items={scheduleQuery.data?.clinicProgrammeSchedule ?? []} />
            )}
          </div>
        ) : null}

        {activeTab === "sharing" ? (
          <Panel>
            <PanelBody>
              <ProgrammeShareLinkPanel programme={programme} />
            </PanelBody>
          </Panel>
        ) : null}

        {activeTab === "settings" ? (
          <Panel>
            <PanelHeader>
              <PanelTitle icon={ClipboardList}>Programme Settings</PanelTitle>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!canManageProgrammes || programme.status !== "DRAFT"}
                onClick={() => router.push(`/consultant/programmes/setup?edit=${programmeId}`)}
              >
                <Pencil className="size-4" />
                Edit draft
              </Button>
            </PanelHeader>
            <PanelBody>
              <div className="divide-y divide-border">
                {[
                  {
                    action: "activate" as const,
                    label: "Activate programme",
                    description: "Open this draft programme for enrolment.",
                    icon: CheckCircle2,
                    allowed: programme.status === "DRAFT",
                  },
                  {
                    action: "pause" as const,
                    label: "Pause programme",
                    description: "Temporarily pause the active programme.",
                    icon: PauseCircle,
                    allowed: programme.status === "ACTIVE",
                  },
                  {
                    action: "resume" as const,
                    label: "Resume programme",
                    description: "Restore this paused programme.",
                    icon: PlayCircle,
                    allowed: programme.status === "PAUSED",
                  },
                  {
                    action: "archive" as const,
                    label: "Archive programme",
                    description:
                      "Retire the programme and preserve its patient and billing history.",
                    icon: Archive,
                    allowed: programme.status !== "ARCHIVED",
                  },
                ]
                  .filter((item) => item.allowed)
                  .map((item) => (
                    <div
                      key={item.action}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">{item.label}</p>
                        <p className="mt-1 text-xs text-muted">{item.description}</p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!canManageProgrammes || saving}
                        onClick={() => {
                          setError(null);
                          setReason("");
                          setLifecycleAction(item.action);
                        }}
                      >
                        <item.icon className="size-4" />
                        {titleCase(item.action)}
                      </Button>
                    </div>
                  ))}
                {programme.status === "ARCHIVED" ? (
                  <p className="py-4 text-sm text-muted">This programme is archived.</p>
                ) : null}
                <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-danger">Delete programme</p>
                    <p className="mt-1 text-xs text-muted">
                      {enrolmentsQuery.loading
                        ? "Checking enrolment history..."
                        : enrolmentsQuery.error ||
                            !Array.isArray(enrolmentsQuery.data?.clinicProgrammeEnrolments)
                          ? "Unable to verify enrolment history. Refresh patients before deleting."
                          : enrolments.length > 0
                            ? "This programme has enrolments, including any completed or withdrawn patients. Use Archive instead."
                            : "Permanently remove this programme and its plans, prices, monitoring defaults, and share links."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="text-danger"
                    disabled={!canManageProgrammes || saving || !canDeleteProgramme}
                    onClick={() => {
                      setError(null);
                      setReason("");
                      setLifecycleAction("delete");
                    }}
                  >
                    <Trash2 className="size-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </PanelBody>
          </Panel>
        ) : null}
      </div>

      {lifecycleAction ? (
        <DetailModal
          title={`${titleCase(lifecycleAction)} programme`}
          subtitle={programme.name}
          onClose={() => {
            if (!saving) setLifecycleAction(null);
          }}
          className="sm:max-w-lg"
        >
          <form onSubmit={(event) => void confirmLifecycle(event)} className="space-y-4">
            {error ? (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            ) : null}
            <p className="text-sm text-muted">
              {lifecycleAction === "delete"
                ? "This permanently deletes the programme, all its care, meal, and exercise plans and items, prices, monitoring defaults, and share links. This cannot be undone. Any enrolment, including completed or withdrawn enrolments, blocks deletion."
                : lifecycleAction === "archive"
                  ? "The programme will be retired. Patient and billing history will be preserved."
                  : `Confirm that you want to ${lifecycleAction} this programme.`}
            </p>
            {lifecycleAction === "delete" ? (
              <div className="space-y-1.5">
                <Label htmlFor="programme-delete-confirmation">
                  Type the programme name to confirm
                </Label>
                <Input
                  id="programme-delete-confirmation"
                  value={reason}
                  disabled={saving}
                  autoComplete="off"
                  onChange={(event) => setReason(event.target.value)}
                  placeholder={programme.name}
                />
              </div>
            ) : null}
            {lifecycleAction === "pause" || lifecycleAction === "archive" ? (
              <div className="space-y-1.5">
                <Label htmlFor="programme-lifecycle-reason">Reason (optional)</Label>
                <Textarea
                  id="programme-lifecycle-reason"
                  value={reason}
                  disabled={saving}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={saving}
                onClick={() => setLifecycleAction(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={
                  saving ||
                  (lifecycleAction === "delete" &&
                    (!canDeleteProgramme || reason.trim() !== programme.name.trim()))
                }
              >
                {lifecycleAction === "delete" ? <Trash2 className="size-4" /> : null}
                {saving
                  ? lifecycleAction === "delete"
                    ? "Deleting..."
                    : "Saving..."
                  : `Confirm ${lifecycleAction}`}
              </Button>
            </div>
          </form>
        </DetailModal>
      ) : null}

      {enrolmentModalOpen ? (
        <DetailModal
          title="Enrol patient"
          subtitle={programme.name}
          onClose={() => setEnrolmentModalOpen(false)}
          className="sm:max-w-2xl"
          footer={
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setEnrolmentModalOpen(false)}
            >
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
  if (workflow === "setup") return <ProgrammeSetupForm programmeId={programmeId} />;
  if (workflow === "details" && programmeId) return <ProgrammeDetailsView programmeId={programmeId} />;
  if ((workflow === "enrolment" || workflow === "activation") && programmeId) return <ProgrammeDetailsView programmeId={programmeId} />;
  return <ProgrammesListView />;
}
