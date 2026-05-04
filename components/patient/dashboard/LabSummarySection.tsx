"use client";

import { useState } from "react";
import { FlaskConical } from "lucide-react";
import { LabDetailModal } from "@/components/patient/labs/LabDetailModal";
import { LabStatusBadge } from "@/components/patient/labs/LabStatusBadge";
import { Button } from "@/components/ui/button";
import type { PatientDashboardData } from "@/types";

type LabSummarySectionProps = Readonly<{
  latestLab: PatientDashboardData["latestLab"];
}>;

export function LabSummarySection({ latestLab }: LabSummarySectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-2xl">Labs</h2>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FlaskConical className="size-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
                  Latest lab
                </p>
                <p className="font-semibold text-text">{latestLab.testName}</p>
              </div>
            </div>
            <LabStatusBadge status={latestLab.status} />
          </div>

          {latestLab.resultSummary ? (
            <p className="mt-4 text-sm leading-6 text-muted">{latestLab.resultSummary}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
            {latestLab.orderedBy ? (
              <span>
                Ordered by{" "}
                <span className="font-medium text-text">{latestLab.orderedBy}</span>
              </span>
            ) : null}
            {latestLab.dateOrdered ? (
              <span>
                {new Intl.DateTimeFormat("en-ZM", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(latestLab.dateOrdered))}
              </span>
            ) : null}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
              View Results
            </Button>
          </div>
        </div>
      </section>

      {isOpen ? <LabDetailModal labOrder={latestLab} onClose={() => setIsOpen(false)} /> : null}
    </>
  );
}
