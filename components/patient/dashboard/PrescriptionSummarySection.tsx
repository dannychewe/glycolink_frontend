"use client";

import { useState } from "react";
import { Pill } from "lucide-react";
import { PrescriptionDetailModal } from "@/components/patient/prescriptions/PrescriptionDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PatientDashboardData } from "@/types";

type PrescriptionSummarySectionProps = Readonly<{
  latestPrescription: PatientDashboardData["latestPrescription"];
}>;

export function PrescriptionSummarySection({ latestPrescription }: PrescriptionSummarySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-2xl">Prescriptions</h2>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <Pill className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Latest prescription
                </p>
                <p className="font-semibold text-text">{latestPrescription.medicationName}</p>
              </div>
            </div>
            {latestPrescription.status ? (
              <Badge variant={latestPrescription.status === "ACTIVE" ? "success" : "secondary"}>
                {latestPrescription.status}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs text-muted">Dosage</p>
              <p className="mt-0.5 text-sm font-semibold text-text">{latestPrescription.dosage}</p>
            </div>
            <div className="rounded-xl bg-background px-4 py-3">
              <p className="text-xs text-muted">Frequency</p>
              <p className="mt-0.5 text-sm font-semibold text-text">
                {latestPrescription.frequency}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
            {latestPrescription.prescribedBy ? (
              <span>
                By{" "}
                <span className="font-medium text-text">{latestPrescription.prescribedBy}</span>
              </span>
            ) : null}
            {latestPrescription.dateIssued ? (
              <span>
                {new Intl.DateTimeFormat("en-ZM", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(latestPrescription.dateIssued))}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
              View Prescription
            </Button>
          </div>
        </div>
      </section>

      {isOpen ? (
        <PrescriptionDetailModal
          prescription={latestPrescription}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
