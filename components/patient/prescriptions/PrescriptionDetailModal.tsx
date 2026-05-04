"use client";

import { X } from "lucide-react";
import type { PrescriptionRecord } from "@/types";

type PrescriptionDetailModalProps = Readonly<{
  prescription: PrescriptionRecord;
  onClose: () => void;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function PrescriptionDetailModal({
  prescription,
  onClose,
}: PrescriptionDetailModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prescription-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-[1.75rem] bg-surface shadow-subtle"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div className="space-y-1">
            <h2 id="prescription-modal-title" className="text-xl font-semibold text-text">
              Prescription Details
            </h2>
            <p className="text-sm text-muted">{prescription.medicationName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl border border-border bg-surface text-text transition hover:bg-slate-50"
            aria-label="Close prescription details"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm text-muted">Dosage</p>
            <p className="text-base font-medium text-text">
              {prescription.dosage} • {prescription.frequency}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">Instructions</p>
            <p className="text-base text-text">{prescription.instructions}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Prescribed by</p>
              <p className="text-base font-medium text-text">{prescription.prescribedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Date Issued</p>
              <p className="text-base font-medium text-text">{formatDate(prescription.dateIssued)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
