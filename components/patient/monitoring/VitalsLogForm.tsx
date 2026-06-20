"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import { CheckCircle2 } from "lucide-react";
import { LOG_VITALS_MUTATION } from "@/lib/monitoring/graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const vitalTypeOptions = [
  { value: "blood_pressure_systolic", label: "Blood Pressure — Systolic", unit: "mmHg" },
  { value: "blood_pressure_diastolic", label: "Blood Pressure — Diastolic", unit: "mmHg" },
  { value: "heart_rate", label: "Heart Rate", unit: "bpm" },
  { value: "weight", label: "Weight", unit: "kg" },
  { value: "spo2", label: "Oxygen Saturation (SpO2)", unit: "%" },
];

type VitalsFormValues = {
  vitalType: string;
  value: number;
  recordedAt: string;
};

type VitalsLogFormProps = Readonly<{
  onSuccess?: () => void;
}>;

function getCurrentDateTimeValue() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function VitalsLogForm({ onSuccess }: VitalsLogFormProps) {
  const [succeeded, setSucceeded] = useState(false);
  const [logVitals, { loading, error }] = useMutation(LOG_VITALS_MUTATION);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<VitalsFormValues>({
    defaultValues: {
      vitalType: "blood_pressure_systolic",
      value: 120,
      recordedAt: getCurrentDateTimeValue(),
    },
  });

  const selectedType = watch("vitalType");
  const selectedOption = vitalTypeOptions.find((o) => o.value === selectedType);
  const unit = selectedOption?.unit ?? "";

  const onSubmit = handleSubmit(async (values) => {
    await logVitals({
      variables: {
        data: {
          type: values.vitalType,
          value: Number(values.value),
          unit,
          recordedAt: new Date(values.recordedAt).toISOString(),
          source: "patient",
        },
      },
    });

    reset({ vitalType: "blood_pressure_systolic", value: 120, recordedAt: getCurrentDateTimeValue() });
    setSucceeded(true);
    setTimeout(() => setSucceeded(false), 4000);
    onSuccess?.();
  });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold text-text">Log Vital Sign</h3>
        <p className="mt-0.5 text-sm text-muted">Record blood pressure, heart rate, weight, or SpO2</p>
      </div>

      {error ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Failed to log vital. Please try again.
        </div>
      ) : null}

      {succeeded ? (
        <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Vital sign logged successfully.
        </div>
      ) : null}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="vital-type">Vital type</Label>
          <select
            id="vital-type"
            {...register("vitalType")}
            className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {vitalTypeOptions.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vital-value">
            Value{unit ? ` (${unit})` : ""}
          </Label>
          <Input
            id="vital-value"
            type="number"
            step="0.1"
            min="0"
            {...register("value", {
              valueAsNumber: true,
              required: "Value is required.",
              min: { value: 0, message: "Value must be positive." },
            })}
          />
          {errors.value?.message ? (
            <p className="text-sm text-danger">{errors.value.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="vital-recorded-at">Date and time</Label>
          <Input
            id="vital-recorded-at"
            type="datetime-local"
            {...register("recordedAt", { required: "Date and time are required." })}
          />
          {errors.recordedAt?.message ? (
            <p className="text-sm text-danger">{errors.recordedAt.message}</p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? "Saving…" : "Log Vital"}
          </Button>
        </div>
      </form>
    </div>
  );
}
