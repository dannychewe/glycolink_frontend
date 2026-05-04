"use client";

import { useState } from "react";
import { ConsultantPrescriptionDetailModal } from "@/components/consultant/prescriptions/ConsultantPrescriptionDetailModal";
import { ConsultantPrescriptionRevokeModal } from "@/components/consultant/prescriptions/ConsultantPrescriptionRevokeModal";
import { ConsultantPrescriptionStatusBadge } from "@/components/consultant/prescriptions/ConsultantPrescriptionStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ConsultantPrescription } from "@/types";

type ConsultantPrescriptionsPageViewProps = Readonly<{
  prescriptions: ConsultantPrescription[];
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function ConsultantPrescriptionsPageView({
  prescriptions,
}: ConsultantPrescriptionsPageViewProps) {
  const [items, setItems] = useState(prescriptions);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState<string | null>(null);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  function handleRevokePrescription(prescriptionId: string) {
    setItems((current) =>
      current.map((prescription) =>
        prescription.id === prescriptionId
          ? {
              ...prescription,
              status: "REVOKED",
            }
          : prescription,
      ),
    );
  }

  const selectedPrescription =
    items.find((prescription) => prescription.id === selectedPrescriptionId) ?? null;
  const revokeTarget =
    items.find((prescription) => prescription.id === revokeTargetId) ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-primary">
          Clinical Orders
        </p>
        <h1 className="text-3xl font-semibold text-text sm:text-4xl">Prescriptions</h1>
      </header>

      {items.length > 0 ? (
        <div className="grid gap-4">
          {items.map((prescription) => (
            <Card key={prescription.id}>
              <CardContent className="px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-text">
                        {prescription.patientName}
                      </p>
                      <p className="text-sm font-medium text-text">
                        {prescription.medicationName}
                      </p>
                      <p className="text-sm text-muted">
                        {prescription.dosage} • {prescription.frequency}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <ConsultantPrescriptionStatusBadge
                        status={prescription.status}
                      />
                      <p className="text-xs uppercase tracking-[0.14em] text-muted">
                        Issued {formatDate(prescription.dateIssued)}
                      </p>
                    </div>
                  </div>

                  <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                    <Button
                      type="button"
                      variant="secondary"
                      fullWidth
                      className="xl:w-auto"
                      onClick={() => setSelectedPrescriptionId(prescription.id)}
                    >
                      View Details
                    </Button>
                    {prescription.status === "ACTIVE" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        fullWidth
                        className="border border-danger/20 bg-danger/5 text-danger hover:bg-danger/10 xl:w-auto"
                        onClick={() => setRevokeTargetId(prescription.id)}
                      >
                        Revoke Prescription
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center shadow-soft">
          <p className="text-base font-medium text-text">No prescriptions available</p>
        </div>
      )}

      {selectedPrescription ? (
        <ConsultantPrescriptionDetailModal
          prescription={selectedPrescription}
          onClose={() => setSelectedPrescriptionId(null)}
          onOpenRevoke={() => {
            setSelectedPrescriptionId(null);
            setRevokeTargetId(selectedPrescription.id);
          }}
        />
      ) : null}

      {revokeTarget ? (
        <ConsultantPrescriptionRevokeModal
          prescription={revokeTarget}
          isLoading={isRevoking}
          onClose={() => setRevokeTargetId(null)}
          onConfirm={async () => {
            setIsRevoking(true);
            await new Promise((resolve) => setTimeout(resolve, 650));
            handleRevokePrescription(revokeTarget.id);
            setIsRevoking(false);
            setRevokeTargetId(null);
          }}
        />
      ) : null}
    </div>
  );
}
