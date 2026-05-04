"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LabOrderRecord } from "@/types";
import { LabStatusBadge } from "@/components/patient/labs/LabStatusBadge";

type LabDetailModalProps = Readonly<{
  labOrder: LabOrderRecord;
  onClose: () => void;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function LabDetailModal({ labOrder, onClose }: LabDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lab-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[1.75rem] bg-surface shadow-subtle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2 id="lab-modal-title" className="text-xl font-semibold text-text">
              Lab Test Details
            </h2>
            <p className="text-sm text-muted">{labOrder.testName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:bg-slate-50"
            aria-label="Close lab details"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap gap-2">
            <LabStatusBadge status={labOrder.status} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Ordered by</p>
              <p className="text-base font-medium text-text">{labOrder.orderedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Date Ordered</p>
              <p className="text-base font-medium text-text">{formatDate(labOrder.dateOrdered)}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted">Result</p>
            <p className="text-base text-text">
              {labOrder.resultSummary ?? "No result summary is available yet."}
            </p>
          </div>
          {labOrder.hasAttachment ? (
            <Button href="/" variant="secondary">
              Download Report
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
