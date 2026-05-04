"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { PrescriptionRecord } from "@/types";
import { PrescriptionDetailModal } from "@/components/patient/prescriptions/PrescriptionDetailModal";
import { PrescriptionStatusBadge } from "@/components/patient/prescriptions/PrescriptionStatusBadge";

type PrescriptionCardProps = Readonly<{
  prescription: PrescriptionRecord;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-text">{prescription.medicationName}</p>
            <p className="text-sm text-muted">
              {prescription.dosage} • {prescription.frequency}
            </p>
          </div>
          <PrescriptionStatusBadge status={prescription.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {prescription.instructions}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">Prescribed by</p>
              <p className="text-sm font-medium text-text">{prescription.prescribedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted">Date Issued</p>
              <p className="text-sm font-medium text-text">{formatDate(prescription.dateIssued)}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>

      {isOpen ? (
        <PrescriptionDetailModal
          prescription={prescription}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
