"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LabOrderBuilder } from "@/components/consultant/consultations/LabOrderBuilder";
import { PrescriptionBuilder } from "@/components/consultant/consultations/PrescriptionBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  consultationWorkspaceSchema,
  type ConsultationWorkspaceValues,
} from "@/lib/validation/consultation-workspace";
import type {
  ConsultantPatientContext,
  ConsultantWorklistAppointment,
} from "@/types";

type ConsultationWorkspaceViewProps = Readonly<{
  appointment: ConsultantWorklistAppointment;
  patient: ConsultantPatientContext;
}>;

function formatElapsedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainingSeconds}`;
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function ConsultationWorkspaceView({
  appointment,
  patient,
}: ConsultationWorkspaceViewProps) {
  const router = useRouter();
  const [elapsedSeconds, setElapsedSeconds] = useState(7 * 60 + 24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<ConsultationWorkspaceValues>({
    resolver: zodResolver(consultationWorkspaceSchema),
    defaultValues: {
      subjective: "",
      objective: "",
      assessment: "",
      plan: "",
      diagnosis: "",
      medications: [],
      labOrders: [],
    },
    mode: "onTouched",
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const onSubmit = methods.handleSubmit(async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    router.push("/consultant/appointments");
  });

  return (
    <FormProvider {...methods}>
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Patient Context</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-text">{patient.name}</p>
                  <p className="text-sm text-muted">
                    {patient.diabetesType} • {patient.age} years • {patient.gender}
                  </p>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-text">Allergies</p>
                    <p className="mt-1 leading-6 text-muted">{patient.allergies}</p>
                  </div>
                  <div>
                    <p className="font-medium text-text">Medications</p>
                    <p className="mt-1 leading-6 text-muted">{patient.medications}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
                      Consultation Workspace
                    </p>
                    <CardTitle>Consultation in progress</CardTitle>
                    <p className="text-sm text-muted">
                      {appointment.patientName} • {appointment.date} at {appointment.time}
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary">
                    Session {formatElapsedTime(elapsedSeconds)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border border-border bg-background px-4 py-4">
                  <p className="text-sm font-medium text-text">Recent glucose readings</p>
                  <div className="mt-3 space-y-3">
                    {patient.monitoring.slice(0, 3).map((reading) => (
                      <div
                        key={reading.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="font-medium text-text">
                          {reading.value} {reading.unit}
                        </span>
                        <span className="text-muted">
                          {formatTimestamp(reading.timestamp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-background px-4 py-4">
                  <p className="text-sm font-medium text-text">PCQ highlights</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
                    {patient.pcq.slice(0, 2).map((item, index) => (
                      <li key={`${item.question}-${index}`}>
                        <span className="font-medium text-text">{item.question}: </span>
                        {item.answer}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Clinical Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subjective">Subjective</Label>
                    <Textarea id="subjective" {...methods.register("subjective")} />
                    <p className="text-sm text-danger">
                      {methods.formState.errors.subjective?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective">Objective</Label>
                    <Textarea id="objective" {...methods.register("objective")} />
                    <p className="text-sm text-danger">
                      {methods.formState.errors.objective?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assessment">Assessment</Label>
                    <Textarea id="assessment" {...methods.register("assessment")} />
                    <p className="text-sm text-danger">
                      {methods.formState.errors.assessment?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">Plan</Label>
                    <Textarea id="plan" {...methods.register("plan")} />
                    <p className="text-sm text-danger">
                      {methods.formState.errors.plan?.message}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="diagnosis">Diagnosis</Label>
                    <Input id="diagnosis" {...methods.register("diagnosis")} />
                    <p className="text-sm text-danger">
                      {methods.formState.errors.diagnosis?.message}
                    </p>
                  </div>
                </div>

                <PrescriptionBuilder />
                <LabOrderBuilder />

                <Button type="submit" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Complete Consultation"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}
