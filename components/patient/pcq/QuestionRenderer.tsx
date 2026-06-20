"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PCQFormValues } from "@/lib/patient/pcq-template";
import type { PCQQuestion } from "@/types";

type QuestionRendererProps = Readonly<{
  question: PCQQuestion;
  disabled?: boolean;
}>;

export function QuestionRenderer({
  question,
  disabled = false,
}: QuestionRendererProps) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<PCQFormValues>();

  const fieldError = errors[question.id];
  const watchedValue = watch(question.id);

  return (
    <div className="space-y-2">
      <Label htmlFor={question.id}>
        {question.label}
        {question.required ? <span className="ml-1 text-danger">*</span> : null}
      </Label>

      {question.type === "text" ? (
        <Input id={question.id} disabled={disabled} {...register(question.id)} />
      ) : null}

      {question.type === "textarea" ? (
        <Textarea id={question.id} disabled={disabled} {...register(question.id)} />
      ) : null}

      {question.type === "select" ? (
        <select
          id={question.id}
          disabled={disabled}
          className="flex h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
          {...register(question.id)}
        >
          <option value="">Select an option</option>
          {question.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : null}

      {question.type === "boolean" ? (
        <label className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-4">
          <input
            id={question.id}
            type="checkbox"
            disabled={disabled}
            checked={Boolean(watchedValue)}
            className="mt-1 size-4 rounded border-border text-primary focus:ring-primary disabled:cursor-not-allowed"
            {...register(question.id)}
          />
          <span className="text-sm leading-6 text-text">{question.label}</span>
        </label>
      ) : null}

      {fieldError?.message ? (
        <p className="text-sm text-danger">{String(fieldError.message)}</p>
      ) : null}
    </div>
  );
}
