"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@apollo/client";
import { CheckCircle2 } from "lucide-react";
import { SET_THRESHOLD_MUTATION } from "@/lib/monitoring/graphql";
import { CONSULTANT_CLIENTS_QUERY } from "@/lib/consultant/clients-graphql";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ThresholdFormValues = {
  patientId: string;
  glucoseLow: number;
  glucoseHigh: number;
};

type ConsultantClient = {
  patientId: string;
  patientName: string | null;
  email: string | null;
  diabetesType: string | null;
};

export function SetThresholdForm() {
  const [succeeded, setSucceeded] = useState(false);
  const [setThreshold, { loading, error }] = useMutation(SET_THRESHOLD_MUTATION);

  const { data: clientsData, loading: clientsLoading } = useQuery<{
    consultantClients: ConsultantClient[];
  }>(CONSULTANT_CLIENTS_QUERY, {
    variables: { limit: 100 },
    fetchPolicy: "cache-first",
  });

  const clients = clientsData?.consultantClients ?? [];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ThresholdFormValues>({
    defaultValues: {
      patientId: "",
      glucoseLow: 3.9,
      glucoseHigh: 10.0,
    },
  });

  const glucoseLow = watch("glucoseLow");

  const onSubmit = handleSubmit(async (values) => {
    await setThreshold({
      variables: {
        patientId: values.patientId,
        data: {
          glucoseLow: Number(values.glucoseLow),
          glucoseHigh: Number(values.glucoseHigh),
        },
      },
    });

    setSucceeded(true);
    setTimeout(() => setSucceeded(false), 4000);
    reset({ patientId: "", glucoseLow: 3.9, glucoseHigh: 10.0 });
  });

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle sm:p-6">
      <div className="mb-5 space-y-1">
        <h3 className="text-base font-semibold text-text">Set Glucose Threshold</h3>
        <p className="text-sm text-muted">
          Configure alert thresholds for a patient. Readings outside this range will trigger alerts.
          Values in mmol/L.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          Failed to set threshold. Please try again.
        </div>
      ) : null}

      {succeeded ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          Threshold updated successfully.
        </div>
      ) : null}

      <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patient-id">Patient</Label>
          <select
            id="patient-id"
            disabled={clientsLoading}
            className="flex h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-text outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
            {...register("patientId", { required: "Please select a patient." })}
          >
            <option value="">
              {clientsLoading ? "Loading patients…" : "Select a patient"}
            </option>
            {clients.map((c) => (
              <option key={c.patientId} value={c.patientId}>
                {c.patientName ?? c.email ?? c.patientId}
                {c.email && c.patientName ? ` — ${c.email}` : ""}
                {c.diabetesType ? ` (${c.diabetesType.replace(/_/g, " ")})` : ""}
              </option>
            ))}
          </select>
          {errors.patientId?.message ? (
            <p className="text-sm text-danger">{errors.patientId.message}</p>
          ) : null}
          {!clientsLoading && clients.length === 0 ? (
            <p className="text-xs text-muted">
              No patients found. Invite patients from the{" "}
              <Link href="/consultant/patients" className="text-primary underline">Clients page</Link>.
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="glucose-low">Low threshold (mmol/L)</Label>
          <Input
            id="glucose-low"
            type="number"
            step="0.1"
            min="0.5"
            {...register("glucoseLow", {
              valueAsNumber: true,
              required: "Low threshold is required.",
              min: { value: 0.5, message: "Must be at least 0.5." },
            })}
          />
          {errors.glucoseLow?.message ? (
            <p className="text-sm text-danger">{errors.glucoseLow.message}</p>
          ) : null}
          <p className="text-xs text-muted">Alert fires when glucose drops below this value.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="glucose-high">High threshold (mmol/L)</Label>
          <Input
            id="glucose-high"
            type="number"
            step="0.1"
            min="0.5"
            {...register("glucoseHigh", {
              valueAsNumber: true,
              required: "High threshold is required.",
              validate: (v) =>
                v > Number(glucoseLow) || "High must be greater than the low threshold.",
            })}
          />
          {errors.glucoseHigh?.message ? (
            <p className="text-sm text-danger">{errors.glucoseHigh.message}</p>
          ) : null}
          <p className="text-xs text-muted">Alert fires when glucose rises above this value.</p>
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={loading || clientsLoading} className="w-full sm:w-auto">
            {loading ? "Saving…" : "Set Threshold"}
          </Button>
        </div>
      </form>
    </div>
  );
}
