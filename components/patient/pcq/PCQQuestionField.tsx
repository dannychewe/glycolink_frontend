"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { PATIENT_SAVE_PCQ_DRAFT_MUTATION } from "@/lib/patient/pcq-graphql";
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
  switch (question.questionType) {
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
}: {
  question: PCQQuestion;
  answers: PCQAnswer[];
  responseId: string;
  disabled: boolean;
}) {
  const initialAnswer = answers.find((a) => a.questionId === question.id);
  const [value, setValue] = useState(() => getInitialValue(question, answers));
  const [selected, setSelected] = useState<string[]>(() =>
    question.questionType === "multi_select" ? parseJsonArray(initialAnswer?.answerJson) : [],
  );
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveDraft] = useMutation(PATIENT_SAVE_PCQ_DRAFT_MUTATION);

  const type = question.questionType;
  const options = parseOptions(question.options);

  async function persist(serialized: string) {
    if (disabled) return;
    try {
      await saveDraft({ variables: { responseId, questionId: question.id, value: serialized } });
      setSavedAt(new Date().toISOString());
    } catch {
      // autosave failures are silent — the patient can still submit
    }
  }

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
