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
  options: string[] | null;
};

type PCQAnswer = {
  id: string;
  questionId: string;
  answerText: string | null;
  answerNumeric: number | null;
  answerBoolean: boolean | null;
  answerJson: string | null;
};

function getInitialValue(question: PCQQuestion, answers: PCQAnswer[]): string {
  const answer = answers.find((a) => a.questionId === question.id);
  if (!answer) return "";
  const type = question.questionType.toUpperCase();
  if (type === "BOOLEAN") return answer.answerBoolean != null ? String(answer.answerBoolean) : "";
  if (type === "NUMERIC") return answer.answerNumeric != null ? String(answer.answerNumeric) : "";
  return answer.answerText ?? answer.answerJson ?? "";
}

function serializeValue(value: string, questionType: string): string {
  const type = questionType.toUpperCase();
  if (type === "BOOLEAN") return value === "true" ? "true" : "false";
  if (type === "NUMERIC") return value === "" ? "null" : String(Number(value));
  return JSON.stringify(value);
}

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
  const [value, setValue] = useState(() => getInitialValue(question, answers));
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saveDraft] = useMutation(PATIENT_SAVE_PCQ_DRAFT_MUTATION);

  const type = question.questionType.toUpperCase();

  async function handleBlur() {
    if (disabled) return;
    try {
      await saveDraft({
        variables: {
          responseId,
          questionId: question.id,
          value: serializeValue(value, question.questionType),
        },
      });
      setSavedAt(new Date().toISOString());
    } catch {
      // autosave failures are silent — user can still submit
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {question.questionText}
        {question.isRequired ? <span className="ml-1 text-danger">*</span> : null}
      </Label>

      {type === "TEXT" ? (
        <Input
          id={question.id}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void handleBlur()}
        />
      ) : null}

      {type === "TEXTAREA" ? (
        <Textarea
          id={question.id}
          value={value}
          disabled={disabled}
          rows={3}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void handleBlur()}
        />
      ) : null}

      {type === "NUMERIC" ? (
        <Input
          id={question.id}
          type="number"
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void handleBlur()}
        />
      ) : null}

      {type === "SELECT" ? (
        <select
          id={question.id}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void handleBlur()}
          className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">Select an option</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : null}

      {type === "BOOLEAN" ? (
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-4 cursor-pointer">
          <input
            id={question.id}
            type="checkbox"
            disabled={disabled}
            checked={value === "true"}
            onChange={(e) => {
              const next = e.target.checked ? "true" : "false";
              setValue(next);
            }}
            onBlur={() => void handleBlur()}
            className="mt-1 size-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
          />
          <span className="text-sm leading-6 text-text">{question.questionText}</span>
        </label>
      ) : null}

      {savedAt && !disabled ? (
        <p className="text-xs text-muted">
          Saved {new Date(savedAt).toLocaleTimeString("en-ZM", { hour: "numeric", minute: "2-digit" })}
        </p>
      ) : null}
    </div>
  );
}
