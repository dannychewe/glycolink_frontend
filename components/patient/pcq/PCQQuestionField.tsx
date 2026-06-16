"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "@apollo/client";
import {
  PATIENT_SAVE_PCQ_ANSWER_MUTATION,
  PATIENT_SAVE_PCQ_DRAFT_MUTATION,
} from "@/lib/patient/pcq-graphql";
import type { PcqExplicitSave } from "@/components/patient/pcq/use-pcq-explicit-save";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PCQQuestion = {
  id: string;
  questionText: string;
  questionType: string;
  isRequired: boolean;
  order: number;
  options: string[] | string | null;
};

type PCQAnswer = {
  id: string;
  questionId: string;
  answerText: string | null;
  answerNumeric: number | null;
  answerBoolean: boolean | null;
  answerJson: unknown;
};

// The backend / seeded templates and the consultant builder use slightly
// different names for the same input ("select" vs "single_select", "textarea"
// vs "long_text", and sometimes UPPERCASE). Normalize to one canonical set so
// every question renders an input the patient can actually fill.
type CanonicalType =
  | "text"
  | "long_text"
  | "number"
  | "date"
  | "single_select"
  | "multi_select"
  | "boolean"
  | "json";

function normalizeQuestionType(raw: string | null | undefined): CanonicalType {
  const t = (raw ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  switch (t) {
    case "text":
    case "short_text":
    case "string":
    case "input":
      return "text";
    case "long_text":
    case "longtext":
    case "textarea":
    case "multiline":
    case "paragraph":
      return "long_text";
    case "number":
    case "numeric":
    case "integer":
    case "int":
    case "float":
    case "decimal":
      return "number";
    case "date":
    case "datetime":
    case "datetime_local":
      return "date";
    case "single_select":
    case "singleselect":
    case "select":
    case "dropdown":
    case "radio":
    case "choice":
    case "single_choice":
      return "single_select";
    case "multi_select":
    case "multiselect":
    case "multi_choice":
    case "checkbox":
    case "checkboxes":
    case "checklist":
      return "multi_select";
    case "boolean":
    case "bool":
    case "yes_no":
    case "yesno":
    case "toggle":
      return "boolean";
    case "json":
    case "file":
    case "upload":
      return "json";
    default:
      // Unknown type — fall back to a free-text input so the patient can still
      // answer rather than seeing a label with no field.
      return "text";
  }
}

function parseOptions(raw: string[] | string | null | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return raw.split(",").map((s) => s.trim()).filter(Boolean);
  }
}

function parseJsonArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

// Initial scalar string value for an answer (non-multiselect types).
function getInitialValue(question: PCQQuestion, answers: PCQAnswer[]): string {
  const answer = answers.find((a) => a.questionId === question.id);
  if (!answer) return "";
  switch (normalizeQuestionType(question.questionType)) {
    case "boolean":
      return answer.answerBoolean != null ? String(answer.answerBoolean) : "";
    case "number":
      return answer.answerNumeric != null ? String(answer.answerNumeric) : "";
    case "json":
      if (answer.answerJson == null) return answer.answerText ?? "";
      return typeof answer.answerJson === "string"
        ? answer.answerJson
        : JSON.stringify(answer.answerJson, null, 2);
    default:
      return answer.answerText ?? "";
  }
}

// Produce a JSONString payload for save mutations.
function serializeScalar(value: string, questionType: string): string {
  switch (questionType) {
    case "boolean":
      return value === "true" ? "true" : "false";
    case "number":
      return value === "" ? "null" : String(Number(value));
    case "json":
      // The raw text the patient typed is expected to already be valid JSON.
      return value.trim() === "" ? "null" : value;
    default:
      return JSON.stringify(value);
  }
}

const selectClass =
  "flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70";

export function PCQQuestionField({
  question,
  answers,
  responseId,
  disabled,
  register,
}: {
  question: PCQQuestion;
  answers: PCQAnswer[];
  responseId: string;
  disabled: boolean;
  /** When present, the field registers an explicit savePcqAnswer saver. */
  register?: PcqExplicitSave["register"];
}) {
  const type = normalizeQuestionType(question.questionType);
  const initialAnswer = answers.find((a) => a.questionId === question.id);
  const [value, setValue] = useState(() => getInitialValue(question, answers));
  const [selected, setSelected] = useState<string[]>(() =>
    type === "multi_select" ? parseJsonArray(initialAnswer?.answerJson) : [],
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveDraft] = useMutation(PATIENT_SAVE_PCQ_DRAFT_MUTATION);
  const [saveAnswer] = useMutation(PATIENT_SAVE_PCQ_ANSWER_MUTATION);

  const options = parseOptions(question.options);

  // Latest serialized value, kept in a ref so the registered saver closure
  // (registered once on mount) always flushes the current answer.
  const currentSerialized = () =>
    type === "multi_select" ? JSON.stringify(selected) : serializeScalar(value, type);
  const serializedRef = useRef(currentSerialized());
  serializedRef.current = currentSerialized();

  async function persist(serialized: string) {
    if (disabled) return;
    try {
      await saveDraft({ variables: { responseId, questionId: question.id, value: serialized } });
      setSavedAt(new Date().toISOString());
    } catch {
      // autosave failures are silent — the patient can still submit
    }
  }

  // Explicit save (savePcqAnswer) — surfaces errors so the parent can react.
  useEffect(() => {
    if (disabled || !register) return;
    return register(question.id, async () => {
      await saveAnswer({
        variables: { responseId, questionId: question.id, value: serializedRef.current },
      });
      setSavedAt(new Date().toISOString());
    });
    // saveAnswer/responseId are stable for the life of this field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [register, disabled, question.id, responseId]);

  function handleScalarBlur() {
    void persist(serializeScalar(value, type));
  }

  function handleImmediate(next: string) {
    setValue(next);
    void persist(serializeScalar(next, type));
  }

  function toggleMulti(option: string, checked: boolean) {
    const next = checked ? [...selected, option] : selected.filter((o) => o !== option);
    setSelected(next);
    void persist(JSON.stringify(next));
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {question.questionText}
        {question.isRequired ? <span className="ml-1 text-danger">*</span> : null}
      </Label>

      {type === "text" ? (
        <Input
          id={question.id}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleScalarBlur}
        />
      ) : null}

      {type === "long_text" ? (
        <Textarea
          id={question.id}
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleScalarBlur}
        />
      ) : null}

      {type === "number" ? (
        <Input
          id={question.id}
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleScalarBlur}
        />
      ) : null}

      {type === "date" ? (
        <Input
          id={question.id}
          type="date"
          value={value}
          disabled={disabled}
          onChange={(e) => handleImmediate(e.target.value)}
        />
      ) : null}

      {type === "single_select" ? (
        <select
          id={question.id}
          value={value}
          disabled={disabled}
          onChange={(e) => handleImmediate(e.target.value)}
          className={selectClass}
        >
          <option value="">Select an option</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      ) : null}

      {type === "multi_select" ? (
        <div className="space-y-2">
          {options.map((opt) => (
            <label key={opt} className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={disabled}
                checked={selected.includes(opt)}
                onChange={(e) => toggleMulti(opt, e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
              />
              <span className="text-sm leading-6 text-text">{opt}</span>
            </label>
          ))}
        </div>
      ) : null}

      {type === "boolean" ? (
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-4 cursor-pointer">
          <input
            id={question.id}
            type="checkbox"
            disabled={disabled}
            checked={value === "true"}
            onChange={(e) => handleImmediate(e.target.checked ? "true" : "false")}
            className="mt-1 size-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
          />
          <span className="text-sm leading-6 text-text">{question.questionText}</span>
        </label>
      ) : null}

      {type === "json" ? (
        <Textarea
          id={question.id}
          value={value}
          disabled={disabled}
          rows={4}
          placeholder='e.g. {"key": "value"}'
          className="font-mono text-xs"
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleScalarBlur}
        />
      ) : null}

      {savedAt && !disabled ? (
        <p className="text-xs text-muted">
          Saved {new Date(savedAt).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}
        </p>
      ) : null}
    </div>
  );
}
