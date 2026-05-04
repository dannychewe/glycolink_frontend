"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { CheckCircle2 } from "lucide-react";
import { LOG_GLUCOSE_MUTATION } from "@/lib/monitoring/graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const contextOptions = [
  { value: "fasting", label: "Fasting" },
  { value: "pre_meal", label: "Before meal" },
  { value: "post_meal", label: "After meal (2 hr)" },
  { value: "random", label: "Random" },
  { value: "bedtime", label: "Bedtime" },
];

type GlucoseFormValues = {
  value: number;
  context: string;
  recordedAt: string;
};

type GlucoseLogFormProps = Readonly<{
  onSuccess?: () => void;
}>;

function getCurrentDateTimeValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function GlucoseLogForm({ onSuccess }: GlucoseLogFormProps) {
  const [succeeded, setSucceeded] = useState(false);
  const [logGlucose, { loading, error }] = useMutation(LOG_GLUCOSE_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GlucoseFormValues>({
    defaultValues: {
      value: 5.5,
      context: "fasting",
      recordedAt: getCurrentDateTimeValue(),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    await logGlucose({
      variables: {
        data: {
          value: Number(values.value),
          context: values.context,
          recordedAt: new Date(values.recordedAt).toISOString(),
          source: "patient",
        },
      },
    });

    reset({ value: 5.5, context: "fasting", recordedAt: getCurrentDateTimeValue() });
    setSucceeded(true);
    setTimeout(() => setSucceeded(false), 4000);
    onSuccess?.();
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-text">Log Glucose Reading</h3>
        <p className="mt-0.5 text-sm text-muted">Values in mmol/L</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Failed to log reading. Please try again.
        </div>
      ) : null}

      {succeeded ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Glucose reading logged successfully.
        </div>
      ) : null}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="glucose-value">Glucose value (mmol/L)</Label>
          <Input
            id="glucose-value"
            type="number"
            step="0.1"
            min="0.1"
            {...register("value", {
              valueAsNumber: true,
              required: "Glucose value is required.",
              min: { value: 0.1, message: "Value must be greater than 0." },
            })}
          />
          {errors.value?.message ? (
            <p className="text-sm text-danger">{errors.value.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="glucose-context">Context</Label>
          <select
            id="glucose-context"
            {...register("context")}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {contextOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="glucose-recorded-at">Date and time</Label>
          <Input
            id="glucose-recorded-at"
            type="datetime-local"
            {...register("recordedAt", { required: "Date and time are required." })}
          />
          {errors.recordedAt?.message ? (
            <p className="text-sm text-danger">{errors.recordedAt.message}</p>
          ) : null}
        </div>

        <div className="flex items-end">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving…" : "Log Reading"}
          </Button>
        </div>
      </form>
    </div>
  );
}
