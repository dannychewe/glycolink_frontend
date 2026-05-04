"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { LabOrderRecord } from "@/types";
import { LabDetailModal } from "@/components/patient/labs/LabDetailModal";
import { LabStatusBadge } from "@/components/patient/labs/LabStatusBadge";

type LabCardProps = Readonly<{
  labOrder: LabOrderRecord;
}>;

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-ZM", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function LabCard({ labOrder }: LabCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-4 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-text">{labOrder.testName}</p>
            <p className="text-sm text-muted">Ordered by {labOrder.orderedBy}</p>
            <p className="text-sm text-muted">{formatDate(labOrder.dateOrdered)}</p>
          </div>
          <LabStatusBadge status={labOrder.status} />
        </CardHeader>
        <CardContent className="space-y-4">
          {labOrder.resultSummary ? (
            <p className="overflow-hidden text-ellipsis [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
              {labOrder.resultSummary}
            </p>
          ) : null}
          <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
            View Details
          </Button>
        </CardContent>
      </Card>

      {isOpen ? (
        <LabDetailModal labOrder={labOrder} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}
