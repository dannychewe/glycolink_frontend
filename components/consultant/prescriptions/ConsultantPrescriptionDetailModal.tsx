"use client";

import { ConsultantPrescriptionStatusBadge } from "@/components/consultant/prescriptions/ConsultantPrescriptionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DetailModal } from "@/components/ui/detail-modal";
import type { ConsultantPrescription } from "@/types";

type ConsultantPrescriptionDetailModalProps = Readonly<{
  prescription: ConsultantPrescription;
  onClose: () => void;
  onOpenRevoke: () => void;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function ConsultantPrescriptionDetailModal({
  prescription,
  onClose,
  onOpenRevoke,
}: ConsultantPrescriptionDetailModalProps) {
  return (
    <DetailModal
      title={prescription.patientName}
      subtitle={prescription.medicationName}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          {prescription.status === "ACTIVE" ? (
            <Button
              type="button"
              variant="ghost"
              className="border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10"
              onClick={onOpenRevoke}
            >
              Revoke Prescription
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <ConsultantPrescriptionStatusBadge status={prescription.status} />
        </div>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Dosage
          </h3>
          <Card>
            <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted">Dosage</p>
                <p className="text-sm font-medium text-text">{prescription.dosage}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Frequency</p>
                <p className="text-sm font-medium text-text">{prescription.frequency}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Instructions
          </h3>
          <Card>
            <CardContent className="px-5 py-5">
              <p className="text-sm leading-6 text-text">{prescription.instructions}</p>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Issued By
          </h3>
          <Card>
            <CardContent className="grid gap-5 px-5 py-5 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted">Doctor</p>
                <p className="text-sm font-medium text-text">{prescription.prescribedBy}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted">Date Issued</p>
                <p className="text-sm font-medium text-text">
                  {formatDate(prescription.dateIssued)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Status
          </h3>
          <Card>
            <CardContent className="px-5 py-5">
              <ConsultantPrescriptionStatusBadge status={prescription.status} />
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">
            Medications
          </h3>
          <div className="space-y-3">
            {prescription.medications.map((medication, index) => (
              <Card key={`${medication.medicationName}-${index}`}>
                <CardContent className="space-y-3 px-5 py-5">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text">
                      {medication.medicationName}
                    </p>
                    <p className="text-sm text-muted">
                      {medication.dosage} • {medication.frequency}
                    </p>
                  </div>
                  <p className="text-sm leading-6 text-muted">
                    {medication.instructions}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </DetailModal>
  );
}
