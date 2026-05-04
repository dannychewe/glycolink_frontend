"use client";

import { Button } from "@/components/ui/button";
import { DetailModal } from "@/components/ui/detail-modal";
import type { ConsultantPrescription } from "@/types";

type ConsultantPrescriptionRevokeModalProps = Readonly<{
  prescription: ConsultantPrescription;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>;

export function ConsultantPrescriptionRevokeModal({
  prescription,
  isLoading,
  onClose,
  onConfirm,
}: ConsultantPrescriptionRevokeModalProps) {
  return (
    <DetailModal
      title="Revoke Prescription"
      subtitle={`${prescription.patientName} • ${prescription.medicationName}`}
      onClose={isLoading ? () => undefined : onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep Active
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Revoking..." : "Confirm Revoke"}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-muted">
        Are you sure you want to revoke this prescription? This will update the
        prescription status to revoked for this workflow.
      </p>
    </DetailModal>
  );
}
